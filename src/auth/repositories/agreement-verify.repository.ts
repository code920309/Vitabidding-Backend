// src/auth/repositories/agreement-verify.repository.ts
// NestJS 및 TypeORM 관련 라이브러리
import { Injectable } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';

// 엔티티
import { AgreementVerify } from '../entities';

@Injectable()
export class AgreementVerifyRepository extends Repository<AgreementVerify> {
  constructor(
    @InjectRepository(AgreementVerify)
    private readonly repo: Repository<AgreementVerify>,

    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    // 부모 클래스인 Repository의 생성자 호출
    super(repo.target, repo.manager, repo.queryRunner);
  }

  /**
   * 사용자 약관 동의 정보 생성
   * @param user 약관 동의와 연관된 사용자 정보
   * @param agreementDto 약관 동의 정보 객체
   * @returns 생성된 약관 동의 엔티티
   */
  async createAgreement(
    user: any,
    agreementDto: any,
  ): Promise<AgreementVerify> {
    const agreement = this.repo.create({
      user,
      usagePolicyV: agreementDto.usagePolicyV,
      personalInformationV: agreementDto.personalInformationV,
    });

    return this.repo.save(agreement);
  }
}
