// src/app.swagger.ts
// NestJS 관련 라이브러리 및 타입
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Express 및 미들웨어
import basicAuth from 'express-basic-auth';
import { NextFunction, Request, Response } from 'express';

/**
 * Swagger 기본 인증 미들웨어 설정
 * @param id Swagger 접근 아이디
 * @param pw Swagger 접근 비밀번호
 * @returns Express Basic Auth 미들웨어
 */
export const swaggerAuthMiddleware = (id: string, pw: string) =>
  basicAuth({
    users: { [id]: pw },
    challenge: true,
    unauthorizedResponse: 'Unauthorized',
  });

/**
 * Swagger 설정 함수
 * @param app Nest 애플리케이션 인스턴스
 */
export function setSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const serviceName = configService.get<string>('SERVER_SERVICE_NAME');
  const swaggerId = configService.get<string>('SWAGGER_ID');
  const swaggerPw = configService.get<string>('SWAGGER_PW');

  const config = new DocumentBuilder()
    .setTitle(`${serviceName} API Docs`)
    .setDescription(`${serviceName} API 문서입니다.`)
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // 환경변수 NODE_ENV가 'plain'이 아닌 경우 Swagger 접근에 Basic Auth 적용
  if (process.env.NODE_ENV !== 'plain') {
    app.use(
      '/api-docs',
      swaggerAuthMiddleware(swaggerId, swaggerPw),
      (req: Request, res: Response, next: NextFunction) => {
        next();
      },
    );
  }

  SwaggerModule.setup('api-docs', app, document);
}
