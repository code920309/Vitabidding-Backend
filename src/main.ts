// src/main.js

// Node.js 기본 모듈
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

// NestJS 관련 라이브러리
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

// 애플리케이션 모듈 및 설정
import { AppModule } from './app.module';
import { corsOption, getNestOptions } from './app.options';

// 초기화 및 Swagger 설정
import { initializeTransactionalContext } from 'typeorm-transactional';
import { setSwagger } from './app.swagger';

// 예외 필터
import { BusinessExceptionFilter } from './exception';

async function bootstrap() {
  // 트랜잭션 컨텍스트 초기화
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule, getNestOptions());
  app.useGlobalFilters(new BusinessExceptionFilter());

  // 전역 유효성 검사 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 요청 데이터를 DTO 인스턴스로 자동 변환
      whitelist: true, // DTO에 정의된 속성만 허용하고 나머지는 무시
      forbidNonWhitelisted: true, // 정의되지 않은 속성이 있으면 예외 처리
      exceptionFactory: (errors) => {
        // 첫 번째 에러의 첫 번째 메시지를 추출
        const firstErrorMessage = errors[0]?.constraints
          ? Object.values(errors[0].constraints)[0]
          : 'Validation failed';

        return new BadRequestException(firstErrorMessage);
      },
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT');
  const env = configService.get<string>('SERVER_RUNTIME');
  const serviceName = configService.get<string>('SERVER_SERVICE_NAME');

  const keyPath = path.join(__dirname, '..', 'key.pem');
  const certPath = path.join(__dirname, '..', 'cert.pem');

  // Swagger 설정 적용
  setSwagger(app);

  // CORS 설정 활성화
  app.enableCors(corsOption(env));

  // HTTPS 서버 설정 (키와 인증서가 있는 경우)
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    await app.init();
    https
      .createServer(httpsOptions, app.getHttpAdapter().getInstance())
      .listen(port);
    console.log(
      `✅ HTTPS server running on\n✅ runtime: ${env}\n✅ port: ${port}\n✅ serviceName: ${serviceName}`,
    );
  } else {
    await app.listen(port);
    console.log(
      `✅ HTTP server running on\n✅ runtime: ${env}\n✅ port: ${port}\n✅ serviceName: ${serviceName}`,
    );
  }
}

// 애플리케이션 부트스트랩 실행
bootstrap();
