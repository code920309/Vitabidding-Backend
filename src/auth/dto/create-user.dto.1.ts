// src/auth/dto/create-user.dto.1.ts
import { UserRole } from '../entities';
import { IsEmail, IsIn, IsNotEmpty, Matches, MinLength } from 'class-validator';

/**
 * 회원가입 1단계에 필요한 사용자 데이터 전송 객체
 */
export class CreateUserDto1 {
  @IsNotEmpty({ message: '이름은 필수 입력 항목입니다.' })
  name: string;

  @IsEmail({}, { message: '유효한 이메일 형식을 입력해야 합니다.' })
  email: string;

  @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다.' })
  @Matches(/^(?=.*\d)(?=.*[a-zA-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: '비밀번호는 최소 8자, 숫자, 영문, 특수문자를 포함해야 합니다.',
  })
  password: string;

  @IsIn(['admin', 'user'], { message: '유효한 사용자 역할을 선택해야 합니다.' })
  role: UserRole;
}
