// src/auth/strategies/jwt.strategy.ts
import { Injectable, HttpStatus } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService, TokenBlacklistService } from '../services';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../types';
import { User } from '../entities';
import { BusinessException } from '../../exception';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: TokenPayload): Promise<User> {
    const { sub, jti } = payload;

    // 블랙리스트에 있는지 검사하고, 있다면 401 Unauthorized를 반환
    const isBlacklisted =
      await this.tokenBlacklistService.isTokenBlacklisted(jti);
    if (isBlacklisted) {
      console.log(`Token ${jti} is blacklisted. Returning 401 Unauthorized.`);
      throw new BusinessException(
        'auth',
        'token-revoked',
        'This token has been revoked',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 블랙리스트에 없는 경우에만 사용자 인증
    return this.userService.validateUser(sub, jti);
  }
}
