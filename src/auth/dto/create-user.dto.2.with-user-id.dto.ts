// src/auth/dto/create-user.dto.2.with-user-id.dto.ts
import { CreateUserDto2 } from './create-user.dto.2';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 회원가입 2단계에 userId를 포함한 추가 사용자 정보 전송 객체
 */
export class CreateUserDto2WithUserIdDto extends CreateUserDto2 {
  @IsNotEmpty({ message: '사용자 ID는 필수 항목입니다.' })
  @IsString({ message: '사용자 ID는 문자열 형식이어야 합니다.' })
  userId: string;
}
