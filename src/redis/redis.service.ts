// src/redis/redis.service.ts
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { RedisClientType, createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
  constructor(
    @Inject('REDIS_CLIENT') private readonly client: RedisClientType,
  ) {}

  async onModuleInit() {
    await this.testConnection();
  }

  private async testConnection() {
    try {
      await this.client.set('test-key', 'test-value');
      const value = await this.client.get('test-key');
      console.log('✅ Redis connection test successful, test-key:', value); // 성공 시 콘솔 출력
    } catch (error) {
      console.error('Redis connection test failed:', error);
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
