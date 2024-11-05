// src/auth/repositories/address.repository.ts
// NestJS 및 TypeORM 관련 라이브러리
import { Injectable } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';

// 엔티티
import { Address } from '../entities';

@Injectable()
export class AddressRepository extends Repository<Address> {
  constructor(
    @InjectRepository(Address)
    private readonly repo: Repository<Address>,

    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    // 부모 클래스인 Repository의 생성자 호출
    super(repo.target, repo.manager, repo.queryRunner);
  }

  /**
   * 사용자 주소 생성
   * @param user 주소와 연결할 사용자 정보
   * @param addressDto 주소 정보 객체
   * @returns 생성된 주소 엔티티
   */
  async createAddress(user: any, addressDto: any): Promise<Address> {
    const address = this.repo.create({
      user,
      zipCode: addressDto.zipCode,
      streetAddress1: addressDto.streetAddress1,
      streetAddress2: addressDto.streetAddress2,
      state: addressDto.state,
    });

    return this.repo.save(address);
  }
}
