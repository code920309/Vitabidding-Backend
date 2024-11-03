// src/auth/services/user.service.ts
import {
  AccessTokenRepository,
  UserRepository,
  AddressRepository,
  AgreementVerifyRepository,
} from '../repositories';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { User } from '../entities';
import { CreateUserDto, Signup2Dto, Signup2WithUserIdDto } from '../dto';
import { BusinessException } from '../../exception';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly accessTokenRepo: AccessTokenRepository,
    private readonly addressRepo: AddressRepository,
    private readonly agreementVerifyRepo: AgreementVerifyRepository,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const normalizedEmail = dto.email.trim().toLowerCase(); // 이메일 정규화

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

  async updateAdditionalUserInfo(dto: Signup2WithUserIdDto): Promise<void> {
    const user = await this.userRepo.findOneById(dto.userId);
    if (!user) {
      throw new BusinessException(
        'user',
        'User not found',
        'User not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 중복 업데이트 방지
    if (user.realName || user.phone) {
      throw new BusinessException(
        'user',
        'Additional information already exists',
        'Additional information already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 추가 정보를 업데이트
    user.realName = dto.realName;
    user.phone = dto.phone;
    await this.userRepo.save(user);

    // Address 정보 저장
    await this.addressRepo.createAddress(user, dto.address);

    // AgreementVerify 정보 저장
    await this.agreementVerifyRepo.createAgreement(user, dto.agreement);
  }

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

  async validateUser(id: string, jti: string): Promise<User> {
    const [user, token] = await Promise.all([
      this.userRepo.findOneBy({ id }),
      this.accessTokenRepo.findOneByJti(jti),
    ]);
    if (!user) {
      this.logger.error(`user ${id} not found`);
      throw new BusinessException(
        'user',
        `user not found`,
        `user not found`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!token) {
      this.logger.error(`jti ${jti} token is revoked`);
      throw new BusinessException(
        'user',
        `revoked token`,
        `revoked token`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }
}
