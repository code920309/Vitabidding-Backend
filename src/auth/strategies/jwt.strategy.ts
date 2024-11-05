// src/auth/strategies/jwt.strategy.ts

// NestJS 관련 라이브러리 및 데코레이터
import { Injectable, HttpStatus } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

// 외부 라이브러리
import { ExtractJwt, Strategy } from 'passport-jwt';

// 내부 모듈 및 서비스
import { UserService, TokenBlacklistService } from '../services';
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

  /**
   * JWT 토큰을 검증하고 블랙리스트 여부 확인
   * @param payload JWT 토큰의 페이로드
   * @returns 유효한 사용자 엔티티
   * @throws 토큰이 블랙리스트에 있거나 유효하지 않은 경우 예외 발생
   */
  async validate(payload: TokenPayload): Promise<User> {
    const { sub, jti } = payload;

    // 토큰이 블랙리스트에 있는지 검사
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
