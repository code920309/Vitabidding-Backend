// src/app.module.ts
// NestJS 모듈 및 데코레이터
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// 애플리케이션 컨트롤러 및 서비스
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 환경 설정 스키마 및 검증
import { validationSchema } from './config/validation.schema';

// 모듈
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';

// 글로벌 인터셉터
import { LoggingInterceptor } from './interceptors';

// 예외 처리 필터
import { BusinessExceptionFilter } from './exception';

// TypeORM 트랜잭션 지원 추가
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    // 환경 설정 모듈
    ConfigModule.forRoot({
      envFilePath: `.env`, // 환경 변수 파일 로드
      validationSchema, // 환경 변수 검증
      isGlobal: true, // ConfigModule을 전역으로 설정
    }),
    // TypeORM 모듈 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // 데이터베이스 설정 로직
      useFactory: (configService: ConfigService) => ({
        type: 'postgres', // PostgreSQL 데이터베이스 타입
        host: configService.get<string>('DB_HOST'), // 데이터베이스 호스트
        port: configService.get<number>('DB_PORT'), // 데이터베이스 포트
        username: configService.get<string>('DB_ID'), // 데이터베이스 사용자명
        password: configService.get<string>('DB_PW'), // 데이터베이스 비밀번호
        database: configService.get<string>('DB_NAME'), // 데이터베이스 이름
        autoLoadEntities: true, // 엔티티 자동 로드
        synchronize: configService.get<string>('SERVER_RUNTIME') !== 'prod', // 개발 환경에서만 동기화
        logging: configService.get<string>('SERVER_RUNTIME') !== 'prod', // 개발 환경에서만 로깅 활성화
      }),
      // 트랜잭션 데이터 소스 초기화
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    // 인증 모듈
    AuthModule,
    // Redis 모듈
    RedisModule,
  ],
  controllers: [AppController], // 애플리케이션 컨트롤러
  providers: [
    AppService, // 애플리케이션 서비스
    {
      provide: APP_INTERCEPTOR, // 글로벌 로깅 인터셉터 등록
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER, // 글로벌 예외 처리 필터 등록
      useClass: BusinessExceptionFilter,
    },
  ],
})
export class AppModule {}
