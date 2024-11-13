// src/auth/services/user.service.ts
// NestJS 관련 라이브러리 및 데코레이터
import {
  HttpStatus,
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';

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
        '이미 존재하는 이메일입니다.',
        '해당 이메일은 이미 사용 중입니다.',
        HttpStatus.CONFLICT,
      );
    }

    try {
      const hashedPassword = await argon2.hash(dto.password);
      return this.userRepo.createUser(
        { ...dto, email: normalizedEmail },
        hashedPassword,
      );
    } catch (error) {
      this.logger.error('사용자 생성 중 오류 발생:', error);
      throw new InternalServerErrorException('사용자 생성에 실패했습니다.');
    }
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
        '사용자를 찾을 수 없습니다.',
        '해당 사용자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.realName || user.phone) {
      throw new BusinessException(
        'user',
        '이미 추가 정보가 존재합니다.',
        '이미 추가 정보가 등록되어 있습니다.',
        HttpStatus.CONFLICT,
      );
    }

    try {
      user.realName = dto.realName;
      user.phone = dto.phone;
      await this.userRepo.save(user);

      // Address 정보 저장
      await this.addressRepo.createAddress(user, dto.address);

      // AgreementVerify 정보 저장
      await this.agreementVerifyRepo.createAgreement(user, dto.agreement);
    } catch (error) {
      this.logger.error('사용자 추가 정보 업데이트 중 오류 발생:', error);
      throw new InternalServerErrorException(
        '추가 정보 업데이트에 실패했습니다.',
      );
    }
  }

  /**
   * ID로 사용자 조회
   * @param userId 사용자 ID
   * @returns 조회된 사용자 엔티티
   */
  async findUserById(userId: string): Promise<User> {
    try {
      const user = await this.userRepo.findOneById(userId);
      if (!user) {
        throw new BusinessException(
          'user',
          '사용자를 찾을 수 없습니다.',
          '해당 사용자를 찾을 수 없습니다.',
          HttpStatus.NOT_FOUND,
        );
      }
      return user;
    } catch (error) {
      this.logger.error('사용자 조회 중 오류 발생:', error);
      throw new InternalServerErrorException('사용자 조회에 실패했습니다.');
    }
  }

  /**
   * 사용자 및 토큰 유효성 검사
   * @param id 사용자 ID
   * @param jti 토큰 식별자
   * @returns 유효한 사용자 엔티티
   */
  async validateUser(id: string, jti: string): Promise<User> {
    try {
      const [user, token] = await Promise.all([
        this.userRepo.findOneBy({ id }),
        this.accessTokenRepo.findOneByJti(jti),
      ]);

      if (!user) {
        this.logger.error(`User ${id} not found`);
        throw new BusinessException(
          'user',
          '사용자를 찾을 수 없습니다.',
          '해당 사용자를 찾을 수 없습니다.',
          HttpStatus.NOT_FOUND,
        );
      }

      if (!token) {
        this.logger.error(`Token with jti ${jti} is revoked`);
        throw new BusinessException(
          'user',
          '토큰이 무효화되었습니다.',
          '유효하지 않은 토큰입니다.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      return user;
    } catch (error) {
      this.logger.error('사용자 및 토큰 유효성 검사 중 오류 발생:', error);
      throw new InternalServerErrorException(
        '사용자 및 토큰 유효성 검사에 실패했습니다.',
      );
    }
  }

  async findUserWithAddressById(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['addresses'], // Address 테이블 포함
    });

    if (!user) {
      throw new BusinessException(
        'user',
        '사용자를 찾을 수 없습니다.',
        '해당 사용자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }
}
