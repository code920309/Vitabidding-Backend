// src/auth/repositories/address.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Address } from '../entities';

@Injectable()
export class AddressRepository extends Repository<Address> {
  constructor(
    @InjectRepository(Address)
    private readonly repo: Repository<Address>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

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
