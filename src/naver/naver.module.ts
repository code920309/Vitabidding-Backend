// src/naver/naver.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NaverService } from './naver.service';

@Module({
  imports: [ConfigModule], // ConfigModule을 사용
  providers: [NaverService], // NaverService를 providers에 추가
  exports: [NaverService], // 외부에서 사용할 수 있도록 exports에 추가
})
export class NaverModule {}
