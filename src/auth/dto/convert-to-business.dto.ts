// src/auth/dto/convert-to-business.dto.ts
import { IsBoolean } from 'class-validator';

export class ConvertToBusinessDto {
  @IsBoolean({ message: '판매자 이용 약관 동의는 필수입니다.' })
  usagePolicyC: boolean;

  @IsBoolean({ message: '판매자 개인정보 수집 동의는 필수입니다.' })
  personalInformationC: boolean;
}
