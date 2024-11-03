// src/auth/repositories/agreement-verify.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { AgreementVerify } from '../entities';

@Injectable()
export class AgreementVerifyRepository extends Repository<AgreementVerify> {
  constructor(
    @InjectRepository(AgreementVerify)
    private readonly repo: Repository<AgreementVerify>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

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
