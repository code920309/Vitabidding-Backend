// src/main.ts
// Node.js 기본 모듈
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

// NestJS 관련 라이브러리
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

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

  // NestJS 애플리케이션 생성
  const app = await NestFactory.create(AppModule, getNestOptions());

  // 글로벌 예외 필터 등록
  app.useGlobalFilters(new BusinessExceptionFilter());

  // 글로벌 유효성 검사 파이프 등록
  app.useGlobalPipes(
    new ValidationPipe({
      // DTO 인스턴스로 변환
      transform: true,
      // DTO에 정의된 속성만 허용
      whitelist: true,
      // 정의되지 않은 속성 포함 시 예외 처리
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        // 첫 번째 유효성 검사 에러 메시지 반환
        const firstErrorMessage = errors[0]?.constraints
          ? Object.values(errors[0].constraints)[0]
          : '유효성 검사 실패';
        return new BadRequestException(firstErrorMessage);
      },
    }),
  );

  // 환경 변수 및 설정 서비스 가져오기
  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT');
  const env = configService.get<string>('SERVER_RUNTIME');
  const serviceName = configService.get<string>('SERVER_SERVICE_NAME');

  // SSL 키와 인증서 경로
  const keyPath = path.join(__dirname, '..', 'key.pem');
  const certPath = path.join(__dirname, '..', 'cert.pem');

  // Swagger 설정 적용
  setSwagger(app);

  // CORS 설정 활성화
  app.enableCors(corsOption(env));

  // HTTPS 서버 설정
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    // HTTPS 서버 실행
    await app.init();
    https
      .createServer(httpsOptions, app.getHttpAdapter().getInstance())
      .listen(port);
    console.log(
      `✅ HTTPS 서버 실행 중\n✅ 런타임: ${env}\n✅ 포트: ${port}\n✅ 서비스명: ${serviceName}`,
    );
  } else {
    // HTTP 서버 실행
    await app.listen(port);
    console.log(
      `✅ HTTP 서버 실행 중\n✅ 런타임: ${env}\n✅ 포트: ${port}\n✅ 서비스명: ${serviceName}`,
    );
  }
}

// 애플리케이션 부트스트랩 실행
bootstrap();
