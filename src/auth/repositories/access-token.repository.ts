// src/auth/repositories/access-token.repository.ts
// NestJS 및 TypeORM 관련 라이브러리
import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';

// 엔티티
import { AccessToken, User } from '../entities';

@Injectable()
export class AccessTokenRepository extends Repository<AccessToken> {
  constructor(
    @InjectRepository(AccessToken)
    private readonly repo: Repository<AccessToken>,

    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    // 부모 클래스인 Repository의 생성자 호출
    super(repo.target, repo.manager, repo.queryRunner);
  }

  /**
   * 액세스 토큰 저장
   * @param jti 토큰 식별자
   * @param user 사용자 정보
   * @param token 액세스 토큰 문자열
   * @param expiresAt 만료 날짜
   * @returns 저장된 액세스 토큰 엔티티
   */
  async saveAccessToken(
    jti: string,
    user: User,
    token: string,
    expiresAt: Date,
  ): Promise<AccessToken> {
    const accessToken = new AccessToken();
    accessToken.jti = jti;
    accessToken.user = user;
    accessToken.token = token;
    accessToken.expiresAt = expiresAt;
    accessToken.isRevoked = false;

    return this.save(accessToken);
  }

  /**
   * JTI로 액세스 토큰 검색
   * @param jti 토큰 식별자
   * @returns 해당 JTI를 가진 액세스 토큰 (미해지된 상태)
   */
  async findOneByJti(jti: string): Promise<AccessToken> {
    return this.findOneBy({ jti, isRevoked: false });
  }
}
