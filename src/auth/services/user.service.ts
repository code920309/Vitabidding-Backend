// src/auth/services/user.service.ts
// NestJS 관련 라이브러리 및 데코레이터
import {
  HttpStatus,
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';

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
  ObsStudioRepository,
} from '../repositories';

import { generateRandomString } from '../../util';

// DTO
import {
  CreateUserDto1,
  CreateUserDto2WithUserIdDto,
  UpdateUserDto,
  ConvertToBusinessDto,
} from '../dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly accessTokenRepo: AccessTokenRepository,
    private readonly addressRepo: AddressRepository,
    private readonly agreementVerifyRepo: AgreementVerifyRepository,
    private readonly obsStudioRepo: ObsStudioRepository,
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

  async updateUserProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<void> {
    const user = await this.userRepo.findOneById(userId);
    if (!user) {
      throw new BusinessException(
        'user',
        '사용자를 찾을 수 없습니다.',
        '해당 사용자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 사용자 정보 업데이트
    if (updateUserDto.name) user.name = updateUserDto.name;

    // 비밀번호가 포함되어 있다면 해싱하여 업데이트
    if (updateUserDto.password) {
      user.password = await argon2.hash(updateUserDto.password);
    }

    await this.userRepo.save(user);

    // 주소 정보 업데이트
    if (updateUserDto.address) {
      const existingAddress = user.addresses?.[0];
      if (existingAddress) {
        // 이미 등록된 주소가 있으면 수정
        await this.addressRepo.updateAddress(
          existingAddress.id,
          updateUserDto.address,
        );
      } else {
        // 주소가 없는 경우 새로 추가
        await this.addressRepo.createAddress(user, updateUserDto.address);
      }
    }
  }

  /**
   * 사용자 계정을 삭제하고 관련 데이터를 모두 제거합니다.
   * @param userId 삭제할 사용자 ID
   */
  async deleteUserAccount(userId: string): Promise<void> {
    const user = await this.userRepo.findOneById(userId);
    if (!user) {
      throw new BusinessException(
        'user',
        '사용자를 찾을 수 없습니다.',
        '해당 사용자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.userRepo.delete(userId);
  }

  /**
   * 사업자 계정으로 전환
   * @param userId 사용자 ID
   * @param dto 사업자 전환 정보 DTO
   */
  @Transactional()
  async convertToBusiness(
    userId: string,
    dto: ConvertToBusinessDto,
  ): Promise<void> {
    // 사용자 확인
    const user = await this.userRepo.findOneById(userId);
    if (!user) {
      throw new BusinessException(
        'user',
        '사용자를 찾을 수 없습니다.',
        '유효하지 않은 사용자 ID입니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // AgreementVerify 확인 및 업데이트
    const agreement = await this.agreementVerifyRepo.findOneBy({
      user: { id: userId },
    });
    if (!agreement) {
      throw new BusinessException(
        'agreement',
        '약관 동의 정보를 찾을 수 없습니다.',
        '약관 동의가 필요합니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (agreement.businessChk) {
      throw new BusinessException(
        'agreement',
        '사업자 계정 전환 정보가 존재합니다.',
        '사업자 계정으로 이미 전환된 계정입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.agreementVerifyRepo.updateAgreement(userId, {
      usagePolicyC: dto.usagePolicyC,
      personalInformationC: dto.personalInformationC,
      businessChk: true,
    });

    // OBS Studio 생성
    const obsStudio = this.obsStudioRepo.create({
      user,
      obsUrl: generateRandomString(20), // 고유 엔드포인트
      auctionUrl: user.id, // 사용자 ID
      videoLiveUrl: '', // 초기값은 빈 문자열
    });

    await this.obsStudioRepo.createObsStudio(obsStudio);
  }
}
