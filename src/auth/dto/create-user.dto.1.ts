// src/auth/dto/create-user.dto.1.ts
// 역할(Role) 정의를 위한 Enum import
import { UserRole } from '../entities';

/**
 * 회원가입 1단계에 필요한 사용자 데이터 전송 객체
 */
export type CreateUserDto1 = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};
