// src/auth/dto/create-user.dto.2.with-user-id.dto.ts
// 2단계 사용자 DTO import
import { CreateUserDto2 } from './create-user.dto.2';

/**
 * 회원가입 2단계에 userId를 포함한 추가 사용자 정보 전송 객체
 */
export interface CreateUserDto2WithUserIdDto extends CreateUserDto2 {
  userId: string;
}
