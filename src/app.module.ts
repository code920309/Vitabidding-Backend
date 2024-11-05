// src/app.module.ts
// NestJS 관련 라이브러리 및 데코레이터
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';

// 애플리케이션 컨트롤러 및 서비스
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 설정 및 유효성 검사 스키마
import { validationSchema } from './config/validation.schema';

// 모듈
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';

// 인터셉터
import { LoggingInterceptor } from './interceptors';

// TypeORM 관련 설정
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env`,
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      /**
       * TypeORM 설정 팩토리 함수
       * @param configService 환경 설정 서비스
       * @returns 데이터베이스 연결 설정
       */
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_ID'),
        password: configService.get<string>('DB_PW'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('SERVER_RUNTIME') !== 'prod',
        logging: configService.get<string>('SERVER_RUNTIME') !== 'prod',
      }),
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    AuthModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
