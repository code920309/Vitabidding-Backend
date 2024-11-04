// src/auth/services/auth.service.ts
import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import {
  AccessLogRepository,
  AccessTokenRepository,
  RefreshTokenRepository,
  UserRepository,
} from '../repositories';
import { User } from '../entities';
import { BusinessException } from '../../exception';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginResDto } from '../dto';
import { TokenBlacklistService } from './token-blacklist.service';
import { RedisService } from '../../redis/redis.service';
import { MailService } from '../../mail/mail.service';
import * as disposableDomains from 'disposable-email-domains';
import { RequestInfo, TokenPayload } from '../types';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly accessTokenRepository: AccessTokenRepository,
    private readonly accessLogRepository: AccessLogRepository,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  async login(
    email: string,
    plainPassword: string,
    req: RequestInfo,
  ): Promise<LoginResDto> {
    const user = await this.validateUser(email, plainPassword);
    const payload: TokenPayload = this.createTokenPayload(user.id);

    const [accessToken, refreshToken] = await Promise.all([
      this.createAccessToken(user, payload),
      this.createRefreshToken(user, payload),
    ]);

    const { ip, endpoint, ua } = req;
    await this.accessLogRepository.createAccessLog(user, ua, endpoint, ip);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  async loginOauth(user: User, req: RequestInfo): Promise<LoginResDto> {
    const payload: TokenPayload = this.createTokenPayload(user.id);

    const [accessToken, refreshToken] = await Promise.all([
      this.createAccessToken(user, payload),
      this.createRefreshToken(user, payload),
    ]);

    const { ip, endpoint, ua } = req;
    await this.accessLogRepository.createAccessLog(user, ua, endpoint, ip);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  async logout(accessToken: string): Promise<{ message: string }> {
    try {
      // accessToken에서 사용자 ID와 jti 추출
      const { sub: userId, jti: jtiAccess } = await this.jwtService.verifyAsync(
        accessToken,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );

      // 블랙리스트 확인 후 이미 블랙리스트에 있으면 `401 Unauthorized` 반환
      const isBlacklisted =
        await this.tokenBlacklistService.isTokenBlacklisted(jtiAccess);
      if (isBlacklisted) {
        console.log(
          `Token ${jtiAccess} is already blacklisted. Returning 401 Unauthorized.`,
        );
        throw new BusinessException(
          'auth',
          'token-revoked',
          'This token has been revoked',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 블랙리스트에 추가하고 활성화된 모든 토큰을 무효화
      await this.addToBlacklist(
        accessToken,
        jtiAccess,
        'access',
        'ACCESS_TOKEN_EXPIRY',
      );

      const activeAccessTokens = await this.accessTokenRepository.find({
        where: { user: { id: userId }, isRevoked: false },
      });
      const activeRefreshTokens = await this.refreshTokenRepository.find({
        where: { user: { id: userId }, isRevoked: false },
      });

      // 모든 액세스 및 리프레시 토큰을 블랙리스트에 추가하고 무효화
      await Promise.all([
        ...activeAccessTokens.map(async (token) => {
          const { jti } = await this.jwtService.verifyAsync(token.token, {
            secret: this.configService.get<string>('JWT_SECRET'),
          });
          await this.addToBlacklist(
            token.token,
            jti,
            'access',
            'ACCESS_TOKEN_EXPIRY',
          );
          token.isRevoked = true;
        }),
        ...activeRefreshTokens.map(async (token) => {
          const { jti } = await this.jwtService.verifyAsync(token.token, {
            secret: this.configService.get<string>('JWT_SECRET'),
          });
          await this.addToBlacklist(
            token.token,
            jti,
            'refresh',
            'REFRESH_TOKEN_EXPIRY',
          );
          token.isRevoked = true;
        }),
      ]);

      // 데이터베이스에 토큰 상태 저장
      await this.accessTokenRepository.save(activeAccessTokens);
      await this.refreshTokenRepository.save(activeRefreshTokens);

      console.log(`All tokens for user ${userId} have been revoked.`);
      return { message: 'Logout successful for all active sessions' };
    } catch (error) {
      console.error('Error during logout:', error);
      throw new BusinessException(
        'auth',
        'logout-failed',
        'Failed to logout user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const { exp, ...payload } = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );

      const user = await this.userRepository.findOneBy({ id: payload.sub });
      if (!user) {
        throw new BusinessException(
          'auth',
          'user-not-found',
          'User not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return this.createAccessToken(user, payload as TokenPayload);
    } catch (error) {
      throw new BusinessException(
        'auth',
        'invalid-refresh-token',
        'Invalid refresh token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  createTokenPayload(userId: string): TokenPayload {
    return {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      jti: uuidv4(),
    };
  }

  async createAccessToken(user: User, payload: TokenPayload): Promise<string> {
    const expiresIn = this.configService.get<string>('ACCESS_TOKEN_EXPIRY');
    const token = this.jwtService.sign(payload, { expiresIn });
    const expiresAt = this.calculateExpiry(expiresIn);

    await this.accessTokenRepository.saveAccessToken(
      payload.jti,
      user,
      token,
      expiresAt,
    );

    return token;
  }

  async createRefreshToken(user: User, payload: TokenPayload): Promise<string> {
    const expiresIn = this.configService.get<string>('REFRESH_TOKEN_EXPIRY');
    const token = this.jwtService.sign(payload, { expiresIn });
    const expiresAt = this.calculateExpiry(expiresIn);

    await this.refreshTokenRepository.saveRefreshToken(
      payload.jti,
      user,
      token,
      expiresAt,
    );

    return token;
  }

  private async validateUser(
    email: string,
    plainPassword: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await argon2.verify(user.password, plainPassword))) {
      return user;
    }
    throw new BusinessException(
      'auth',
      'invalid-credentials',
      'Invalid credentials',
      HttpStatus.UNAUTHORIZED,
    );
  }

  private async addToBlacklist(
    token: string,
    jti: string,
    type: 'access' | 'refresh',
    expiryConfigKey: string,
  ): Promise<void> {
    const expiryTime = this.calculateExpiry(
      this.configService.get<string>(expiryConfigKey),
    );
    await this.tokenBlacklistService.addToBlacklist(
      token,
      jti,
      type,
      expiryTime,
    );
  }

  private calculateExpiry(expiry: string): Date {
    let expiresInMilliseconds = 0;

    if (expiry.endsWith('d')) {
      const days = parseInt(expiry.slice(0, -1), 10);
      expiresInMilliseconds = days * 24 * 60 * 60 * 1000;
    } else if (expiry.endsWith('h')) {
      const hours = parseInt(expiry.slice(0, -1), 10);
      expiresInMilliseconds = hours * 60 * 60 * 1000;
    } else if (expiry.endsWith('m')) {
      const minutes = parseInt(expiry.slice(0, -1), 10);
      expiresInMilliseconds = minutes * 60 * 1000;
    } else if (expiry.endsWith('s')) {
      const seconds = parseInt(expiry.slice(0, -1), 10);
      expiresInMilliseconds = seconds * 1000;
    } else {
      throw new BusinessException(
        'auth',
        'invalid-expiry',
        'Invalid expiry time',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new Date(Date.now() + expiresInMilliseconds);
  }

  async getUserIdFromToken(token: string): Promise<string> {
    try {
      const decoded = this.jwtService.verify(token);
      console.log('뜨냐?', decoded);
      return decoded.sub;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1];
    const disposableDomainList = Object.values(disposableDomains) as string[]; // 배열로 변환
    return disposableDomainList.includes(domain);
  }

  async sendVerificationCode(email: string): Promise<void> {
    if (this.isDisposableEmail(email)) {
      throw new Error('Disposable email addresses are not allowed.');
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    await this.redisService.set(`verification:${email}`, verificationCode, 300); // 5분간 유효
    await this.mailService.sendVerificationEmail(email, verificationCode);
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const storedCode = await this.redisService.get(`verification:${email}`);
    return storedCode === code;
  }
}
