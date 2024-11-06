// src/auth/dto/create-user.dto.2.ts
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 회원가입 2단계에 필요한 추가 사용자 정보 전송 객체
 */
class AddressDto {
  @IsNotEmpty({ message: '우편번호는 필수 입력 항목입니다.' })
  @IsString()
  zipCode: string;

  @IsNotEmpty({ message: '도로명 주소는 필수 입력 항목입니다.' })
  @IsString()
  streetAddress1: string;

  @IsOptional()
  @IsString()
  streetAddress2?: string;

  @IsNotEmpty({ message: '도/시 정보는 필수 입력 항목입니다.' })
  @IsString()
  state: string;
}

class AgreementDto {
  @IsBoolean({ message: '이용 약관 동의는 필수 항목입니다.' })
  usagePolicyV: boolean;

  @IsBoolean({ message: '개인정보 수집 동의는 필수 항목입니다.' })
  personalInformationV: boolean;
}

export class CreateUserDto2 {
  @IsNotEmpty({ message: '실명은 필수 입력 항목입니다.' })
  @IsString()
  realName: string;

  @IsNotEmpty({ message: '전화번호는 필수 입력 항목입니다.' })
  @IsString()
  phone: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ValidateNested()
  @Type(() => AgreementDto)
  agreement: AgreementDto;
}
