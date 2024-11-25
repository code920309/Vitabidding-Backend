// src/common/decorators/token.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Token = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authorizationHeader = request.headers['authorization'];
    if (!authorizationHeader) return undefined;

    const token = authorizationHeader.split(' ')[1];
    return token;
  },
);
