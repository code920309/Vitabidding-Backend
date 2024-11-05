// src/auth/repositories/user.repository.ts
// NestJS 및 TypeORM 관련 라이브러리
import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';

// 엔티티 및 DTO
import { User } from '../entities';
import { CreateUserDto1 } from '../dto';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,

    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    // 부모 클래스인 Repository의 생성자 호출
    super(repo.target, repo.manager, repo.queryRunner);
  }

  /**
   * 이메일로 사용자 검색
   * @param email 사용자 이메일
   * @returns 해당 이메일을 가진 사용자 또는 undefined
   */
  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.repo.findOne({ where: { email } });
  }

  /**
   * ID로 사용자 검색
   * @param id 사용자 ID
   * @returns 해당 ID를 가진 사용자 또는 undefined
   */
  async findOneById(id: string): Promise<User | undefined> {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * 이름으로 사용자 검색
   * @param name 사용자 이름
   * @returns 해당 이름을 가진 사용자 또는 undefined
   */
  async findOneByName(name: string): Promise<User | undefined> {
    return this.repo.findOne({ where: { name } });
  }

  /**
   * 새로운 사용자 생성
   * @param dto 사용자 생성에 필요한 데이터 객체
   * @param hashedPassword 해시된 사용자 비밀번호
   * @returns 생성된 사용자 엔티티
   */
  async createUser(dto: CreateUserDto1, hashedPassword: string): Promise<User> {
    const user = this.repo.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
      provider: 'local',
    });

    return this.repo.save(user);
  }
}
