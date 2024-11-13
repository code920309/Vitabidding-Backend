// src/naver/naver.module.ts
import { Module } from '@nestjs/common';
import { NaverService } from './naver.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [NaverService],
  exports: [NaverService],
})
export class NaverModule {}
