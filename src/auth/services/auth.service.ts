// src/auth/services/auth.service.ts
// NestJS 관련 라이브러리 및 데코레이터
import {
  HttpStatus,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// 외부 라이브러리
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import * as disposableDomains from 'disposable-email-domains';

// 내부 모듈 및 서비스
import { BusinessException } from '../../exception';
import {
  AccessLogRepository,
  AccessTokenRepository,
  RefreshTokenRepository,
  UserRepository,
} from '../repositories';
import { TokenBlacklistService } from './token-blacklist.service';
import { RedisService } from '../../redis/redis.service';
import { MailService } from '../../mail/mail.service';
import { NaverService } from '../../naver/naver.service';

// DTO 및 타입
import { LoginResDto } from '../dto';
import { RequestInfo, TokenPayload } from '../types';
import { User } from '../entities';

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
    private readonly naverService: NaverService,
  ) {}

  /**
   * 로그인 처리
   * @param email 사용자 이메일
   * @param plainPassword 사용자 비밀번호 (일반 텍스트)
   * @param req 요청 정보
   * @returns 사용자 정보와 액세스 및 리프레시 토큰
   */
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

  /**
   * OAuth 로그인 처리
   * @param user OAuth로 인증된 사용자 객체
   * @param req 요청 정보
   * @returns 사용자 정보와 액세스 및 리프레시 토큰
   */
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

  /**
   * 로그아웃 처리
   * @param accessToken 액세스 토큰
   * @returns 성공 메시지
   */
  async logout(accessToken: string): Promise<{ message: string }> {
    try {
      const { sub: userId, jti: jtiAccess } = await this.jwtService.verifyAsync(
        accessToken,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );

      const isBlacklisted =
        await this.tokenBlacklistService.isTokenBlacklisted(jtiAccess);
      if (isBlacklisted) {
        throw new BusinessException(
          'auth',
          'token-revoked',
          '이미 무효화된 토큰입니다.',
          HttpStatus.UNAUTHORIZED,
        );
      }

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

      await this.accessTokenRepository.save(activeAccessTokens);
      await this.refreshTokenRepository.save(activeRefreshTokens);

      return { message: '모든 활성 세션에서 로그아웃 완료되었습니다.' };
    } catch (error) {
      throw new InternalServerErrorException('로그아웃 처리에 실패했습니다.');
    }
  }

  /**
   * 리프레시 토큰으로 새로운 액세스 토큰 발급
   * @param refreshToken 리프레시 토큰
   * @returns 새로 발급된 액세스 토큰
   */
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
          '사용자를 찾을 수 없습니다.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return this.createAccessToken(user, payload as TokenPayload);
    } catch (error) {
      throw new BusinessException(
        'auth',
        'invalid-refresh-token',
        '유효하지 않은 리프레시 토큰입니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * 이메일 인증 코드 전송
   * @param email 사용자 이메일
   */
  async sendVerificationCode(email: string): Promise<void> {
    if (this.isDisposableEmail(email)) {
      throw new BusinessException(
        'auth',
        'disposable-email',
        '일회용 이메일은 사용할 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    await this.redisService.set(`verification:${email}`, verificationCode, 180);
    await this.mailService.sendVerificationEmail(email, verificationCode);
  }

  /**
   * 인증 코드 검증
   * @param email 사용자 이메일
   * @param code 입력된 인증 코드
   * @returns 인증 결과
   */
  async verifyCode(email: string, code: string): Promise<boolean> {
    const storedCode = await this.redisService.get(`verification:${email}`);
    if (!storedCode) {
      throw new BusinessException(
        'auth',
        'code-expired',
        '인증 코드가 만료되었습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return storedCode === code;
  }

  /**
   * 닉네임 중복 여부 확인
   * @param name 닉네임
   * @returns 중복 여부
   */
  async checkNicknameAvailability(name: string): Promise<boolean> {
    const existingUser = await this.userRepository.findOneByName(name);
    if (existingUser) {
      throw new BusinessException(
        'auth',
        'nickname-taken',
        '이미 사용 중인 닉네임입니다.',
        HttpStatus.CONFLICT,
      );
    }
    return true;
  }

  /**
   * 액세스 토큰에서 사용자 ID 추출
   * @param token 액세스 토큰
   * @returns 사용자 ID
   */
  async getUserIdFromToken(token: string): Promise<string> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return decoded.sub;
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 액세스 토큰입니다.');
    }
  }

  /**
   * 토큰 페이로드 생성
   * @param userId 사용자 ID
   * @returns 토큰 페이로드
   */
  private createTokenPayload(userId: string): TokenPayload {
    return {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      jti: uuidv4(),
    };
  }

  /**
   * 새로운 액세스 토큰 생성
   * @param user 사용자 객체
   * @param payload 토큰 페이로드
   * @returns 액세스 토큰
   */
  private async createAccessToken(
    user: User,
    payload: TokenPayload,
  ): Promise<string> {
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

  /**
   * 새로운 리프레시 토큰 생성
   * @param user 사용자 객체
   * @param payload 토큰 페이로드
   * @returns 리프레시 토큰
   */
  private async createRefreshToken(
    user: User,
    payload: TokenPayload,
  ): Promise<string> {
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

  /**
   * 사용자 인증 정보 검증
   * @param email 사용자 이메일
   * @param plainPassword 사용자 비밀번호
   * @returns 인증된 사용자
   */
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
      '이메일 또는 비밀번호가 유효하지 않습니다.',
      HttpStatus.UNAUTHORIZED,
    );
  }

  /**
   * 토큰 블랙리스트 추가
   * @param token 블랙리스트에 추가할 토큰
   * @param jti 토큰 식별자
   * @param type 토큰 유형
   * @param expiryConfigKey 만료 설정 키
   */
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

  /**
   * 만료 시간 계산
   * @param expiry 만료 설정 문자열
   * @returns 만료 날짜
   */
  private calculateExpiry(expiry: string): Date {
    let expiresInMilliseconds = 0;

    if (expiry.endsWith('d')) {
      expiresInMilliseconds =
        parseInt(expiry.slice(0, -1), 10) * 24 * 60 * 60 * 1000;
    } else if (expiry.endsWith('h')) {
      expiresInMilliseconds =
        parseInt(expiry.slice(0, -1), 10) * 60 * 60 * 1000;
    } else if (expiry.endsWith('m')) {
      expiresInMilliseconds = parseInt(expiry.slice(0, -1), 10) * 60 * 1000;
    } else if (expiry.endsWith('s')) {
      expiresInMilliseconds = parseInt(expiry.slice(0, -1), 10) * 1000;
    } else {
      throw new BusinessException(
        'auth',
        'invalid-expiry',
        '유효하지 않은 만료 시간 형식입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new Date(Date.now() + expiresInMilliseconds);
  }

  /**
   * 이메일이 일회용 이메일인지 확인
   * @param email 이메일 주소
   * @returns 일회용 이메일 여부
   */
  private isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1];
    // 2차원 배열을 1차원 배열로 변환
    const disposableDomainList = (
      Object.values(disposableDomains) as string[][]
    ).flat();
    return disposableDomainList.includes(domain);
  }

  async sendPhoneVerificationCode(phoneNumber: string): Promise<void> {
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    await this.redisService.set(
      `verification:phone:${phoneNumber}`,
      verificationCode,
      180,
    ); // 3분간 유효

    await this.naverService.sendVerificationCode(phoneNumber, verificationCode);
  }

  async verifyPhoneCode(phoneNumber: string, code: string): Promise<boolean> {
    const storedCode = await this.redisService.get(
      `verification:phone:${phoneNumber}`,
    );
    return storedCode === code;
  }
}
