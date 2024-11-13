// src/auth/strategies/jwt.strategy.ts

// NestJS 관련 라이브러리 및 데코레이터
import {
  Injectable,
  HttpStatus,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
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
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * JWT 토큰을 검증하고 블랙리스트 여부 확인 및 사용자 유효성 검사
   * @param payload JWT 토큰의 페이로드
   * @returns 유효한 사용자 엔티티
   * @throws 토큰이 블랙리스트에 있거나 유효하지 않은 경우 예외 발생
   */
  async validate(payload: TokenPayload): Promise<User> {
    const { sub, jti } = payload;

    try {
      // 1. 토큰이 블랙리스트에 있는지 검사
      const isBlacklisted =
        await this.tokenBlacklistService.isTokenBlacklisted(jti);
      if (isBlacklisted) {
        throw new BusinessException(
          'auth',
          '블랙리스트에 등록된 토큰입니다.',
          '해당 토큰은 무효화되었습니다.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 2. 유효한 사용자 확인
      const user = await this.userService.findUserById(sub);
      if (!user) {
        throw new UnauthorizedException('유효하지 않은 사용자입니다.');
      }

      return user;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '토큰 검증 중 예기치 않은 오류가 발생했습니다.',
      );
    }
  }
}
