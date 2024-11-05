// src/auth/repositories/token-blacklist.repository.ts
// NestJS 및 TypeORM 관련 라이브러리
import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';

// 엔티티
import { TokenBlacklist } from '../entities';

@Injectable()
export class TokenBlacklistRepository extends Repository<TokenBlacklist> {
  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly repo: Repository<TokenBlacklist>,

    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    // 부모 클래스인 Repository의 생성자 호출
    super(repo.target, repo.manager, repo.queryRunner);
  }

  /**
   * 토큰 블랙리스트에 추가
   * @param token 블랙리스트에 추가할 토큰 문자열
   * @param jti 토큰 식별자
   * @param tokenType 토큰 유형 (액세스 또는 리프레시)
   * @param expiresAt 만료 날짜
   */
  async addToken(
    token: string,
    jti: string,
    tokenType: 'access' | 'refresh',
    expiresAt: Date,
  ): Promise<void> {
    const blacklistedToken = new TokenBlacklist();
    blacklistedToken.token = token;
    blacklistedToken.jti = jti;
    blacklistedToken.tokenType = tokenType;
    blacklistedToken.expiresAt = expiresAt;

    await this.save(blacklistedToken);
  }

  /**
   * 블랙리스트에 토큰 존재 여부 확인
   * @param jti 토큰 식별자
   * @returns 토큰이 블랙리스트에 있는지 여부
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const foundToken = await this.findOne({ where: { jti } });
    return !!foundToken;
  }

  /**
   * 만료된 토큰 제거
   * 만료 날짜가 현재 시간 이전인 블랙리스트의 토큰들을 삭제
   */
  async removeExpiredTokens(): Promise<void> {
    await this.createQueryBuilder()
      .delete()
      .from(TokenBlacklist)
      .where('expiresAt < NOW()')
      .execute();
  }
}
