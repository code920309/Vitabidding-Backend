// src/auth/services/token-blacklist.service.ts
// NestJS 및 내부 모듈
import { Injectable } from '@nestjs/common';
import { TokenBlacklistRepository } from '../repositories';

@Injectable()
export class TokenBlacklistService {
  constructor(
    private readonly tokenBlacklistRepository: TokenBlacklistRepository,
  ) {}

  /**
   * 토큰 블랙리스트 추가
   * @param token 블랙리스트에 추가할 토큰
   * @param jti 토큰 식별자
   * @param type 토큰 유형 ('access' | 'refresh')
   * @param expiresAt 만료 날짜
   */
  async addToBlacklist(
    token: string,
    jti: string,
    type: 'access' | 'refresh',
    expiresAt: Date,
  ): Promise<void> {
    await this.tokenBlacklistRepository.addToken(token, jti, type, expiresAt);
  }

  /**
   * 토큰이 블랙리스트에 있는지 확인
   * @param jti 토큰 식별자
   * @returns 블랙리스트 존재 여부
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    return await this.tokenBlacklistRepository.isTokenBlacklisted(jti);
  }

  /**
   * 만료된 블랙리스트 토큰 제거
   */
  async removeExpiredTokens(): Promise<void> {
    await this.tokenBlacklistRepository.removeExpiredTokens();
  }
}
