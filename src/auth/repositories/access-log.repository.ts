// src/auth/repositories/access-log.repository.ts
// NestJS 및 TypeORM 관련 라이브러리
import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';

// 엔티티
import { AccessLog, User } from '../entities';

@Injectable()
export class AccessLogRepository extends Repository<AccessLog> {
  constructor(
    @InjectRepository(AccessLog)
    private readonly repo: Repository<AccessLog>,

    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    // 부모 클래스인 Repository의 생성자 호출
    super(repo.target, repo.manager, repo.queryRunner);
  }

  /**
   * 접근 로그 생성
   * @param user 접근 로그를 생성할 사용자 정보
   * @param ua 사용자 에이전트 정보
   * @param endpoint 접근한 엔드포인트
   * @param ip 접근한 IP 주소
   */
  async createAccessLog(user: User, ua: string, endpoint: string, ip: string) {
    const accessLog = new AccessLog();
    accessLog.user = user;
    accessLog.ua = ua;
    accessLog.endpoint = endpoint;
    accessLog.ip = ip;
    accessLog.accessedAt = new Date();

    await this.save(accessLog);
  }
}
