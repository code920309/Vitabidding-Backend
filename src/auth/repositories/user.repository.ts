// src/auth/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities';
import { CreateUserDto } from '../dto';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.repo.findOne({ where: { email } });
  }

  async findOneById(id: string): Promise<User | undefined> {
    return this.repo.findOne({ where: { id } });
  }

  async createUser(dto: CreateUserDto, hashedPassword: string): Promise<User> {
    const user = this.repo.create({
      name: dto.name,
      // realName: dto.realName || '',
      email: dto.email,
      password: hashedPassword,
      // phone: dto.phone,
      role: dto.role,
      provider: 'local',
    });
    return this.repo.save(user);
  }
}
