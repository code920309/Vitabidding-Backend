// src/redis/redis.service.ts
// NestJS 관련 라이브러리 및 데코레이터
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

// Redis 클라이언트 타입 및 생성 함수
import { RedisClientType, createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
  constructor(
    @Inject('REDIS_CLIENT') private readonly client: RedisClientType,
  ) {}

  /**
   * 모듈 초기화 시 Redis 연결 테스트
   */
  async onModuleInit() {
    await this.testConnection();
  }

  /**
   * Redis 연결 테스트
   * 연결 성공 시 "test-key"를 설정하고 해당 값을 출력
   */
  private async testConnection() {
    try {
      await this.client.set('test-key', 'test-value');
      const value = await this.client.get('test-key');
      console.log('✅ Redis connection test successful, test-key:', value);
    } catch (error) {
      console.error('Redis connection test failed:', error);
    }
  }

  /**
   * Redis에 데이터 저장
   * @param key 데이터의 키
   * @param value 저장할 값
   * @param ttl 선택적 TTL(초 단위)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Redis에서 데이터 조회
   * @param key 조회할 데이터의 키
   * @returns 조회된 데이터 값 또는 null
   */
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * Redis에서 데이터 삭제
   * @param key 삭제할 데이터의 키
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
