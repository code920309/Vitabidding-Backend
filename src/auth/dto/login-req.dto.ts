// src/auth/dto/login-req.dto.ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

/**
 * 로그인 요청 시 필요한 데이터 전송 객체
 */
export class LoginReqDto {
  @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
  @IsEmail({}, { message: '유효한 이메일 형식을 입력해야 합니다.' })
  email: string;

  @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password: string;
}
