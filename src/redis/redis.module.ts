// src/redis/redis.module.ts
// NestJS 관련 라이브러리 및 데코레이터
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Redis 서비스 및 클라이언트 라이브러리
import { RedisService } from './redis.service';
import { createClient } from 'redis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      /**
       * Redis 클라이언트 생성 팩토리 함수
       * @param configService 환경 설정 서비스
       * @returns 연결된 Redis 클라이언트 인스턴스
       */
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          url: `redis://${configService.get<string>('REDIS_HOST')}:${configService.get<number>('REDIS_PORT')}`,
          password: configService.get<string>('REDIS_PW'),
        });

        client.on('error', (err) => console.error('Redis Client Error', err));
        await client.connect();

        return client;
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
