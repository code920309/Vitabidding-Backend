// src/auth/services/user.service.ts
// NestJS 관련 라이브러리 및 데코레이터
import { HttpStatus, Injectable, Logger } from '@nestjs/common';

// 외부 라이브러리
import * as argon2 from 'argon2';

// 내부 모듈 및 리포지토리
import { User } from '../entities';
import { BusinessException } from '../../exception';
import {
  AccessTokenRepository,
  UserRepository,
  AddressRepository,
  AgreementVerifyRepository,
} from '../repositories';

// DTO
import { CreateUserDto1, CreateUserDto2WithUserIdDto } from '../dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly accessTokenRepo: AccessTokenRepository,
    private readonly addressRepo: AddressRepository,
    private readonly agreementVerifyRepo: AgreementVerifyRepository,
  ) {}

  /**
   * 사용자 생성
   * @param dto 사용자 생성에 필요한 데이터 전송 객체
   * @returns 생성된 사용자 엔티티
   */
  async createUser(dto: CreateUserDto1): Promise<User> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.userRepo.findOneByEmail(normalizedEmail);
    if (user) {
      throw new BusinessException(
        'user',
        `${dto.email} already exists`,
        `${dto.email} already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await argon2.hash(dto.password);
    return this.userRepo.createUser(
      { ...dto, email: normalizedEmail },
      hashedPassword,
    );
  }

  /**
   * 사용자 추가 정보 업데이트
   * @param dto 추가 사용자 정보 업데이트를 위한 데이터 전송 객체
   */
  async updateAdditionalUserInfo(
    dto: CreateUserDto2WithUserIdDto,
  ): Promise<void> {
    const user = await this.userRepo.findOneById(dto.userId);
    if (!user) {
      throw new BusinessException(
        'user',
        'User not found',
        'User not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.realName || user.phone) {
      throw new BusinessException(
        'user',
        'Additional information already exists',
        'Additional information already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.realName = dto.realName;
    user.phone = dto.phone;
    await this.userRepo.save(user);

    // Address 정보 저장
    await this.addressRepo.createAddress(user, dto.address);

    // AgreementVerify 정보 저장
    await this.agreementVerifyRepo.createAgreement(user, dto.agreement);
  }

  /**
   * ID로 사용자 조회
   * @param userId 사용자 ID
   * @returns 조회된 사용자 엔티티
   */
  async findUserById(userId: string): Promise<User> {
    const user = await this.userRepo.findOneById(userId);
    if (!user) {
      throw new BusinessException(
        'user',
        'User not found',
        'User not found',
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  /**
   * 사용자 및 토큰 유효성 검사
   * @param id 사용자 ID
   * @param jti 토큰 식별자
   * @returns 유효한 사용자 엔티티
   */
  async validateUser(id: string, jti: string): Promise<User> {
    const [user, token] = await Promise.all([
      this.userRepo.findOneBy({ id }),
      this.accessTokenRepo.findOneByJti(jti),
    ]);

    if (!user) {
      this.logger.error(`User ${id} not found`);
      throw new BusinessException(
        'user',
        'User not found',
        'User not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!token) {
      this.logger.error(`Token with jti ${jti} is revoked`);
      throw new BusinessException(
        'user',
        'Revoked token',
        'Revoked token',
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }
}
