// src/common/decorators/current-seller.decorator.ts
import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const CurrentSeller = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authorization = request.headers['authorization'];

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증 토큰이 존재하지 않습니다.');
    }

    const token = authorization.split(' ')[1];
    const jwtService = new JwtService({
      secret: new ConfigService().get('JWT_SECRET'),
    });

    try {
      const payload = await jwtService.verifyAsync(token);
      if (!payload.sub) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      return payload.sub; // `sub` contains the seller ID
    } catch (err) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  },
);
