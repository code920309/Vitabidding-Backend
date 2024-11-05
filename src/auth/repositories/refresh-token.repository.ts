// src/auth/repositories/refresh-token.repository.ts
// NestJS 및 TypeORM 관련 라이브러리
import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';

// 엔티티
import { RefreshToken, User } from '../entities';

@Injectable()
export class RefreshTokenRepository extends Repository<RefreshToken> {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,

    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    // 부모 클래스인 Repository의 생성자 호출
    super(repo.target, repo.manager, repo.queryRunner);
  }

  /**
   * 리프레시 토큰 저장
   * @param jti 토큰 식별자
   * @param user 토큰과 연관된 사용자 정보
   * @param token 리프레시 토큰 문자열
   * @param expiresAt 만료 날짜
   * @returns 저장된 리프레시 토큰 엔티티
   */
  async saveRefreshToken(
    jti: string,
    user: User,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const refreshToken = new RefreshToken();
    refreshToken.jti = jti;
    refreshToken.user = user;
    refreshToken.token = token;
    refreshToken.expiresAt = expiresAt;
    refreshToken.isRevoked = false;

    return this.save(refreshToken);
  }
}
