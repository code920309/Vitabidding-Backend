// src/auth/dto/signup-res.dto.ts
// 역할(Role) 정의를 위한 Enum import
// import { UserRole } from '../entities';

/**
 * 회원가입 완료 시 반환되는 사용자 데이터 전송 객체
 */
export type SignupResDto = {
  id: string;
  name: string;
  email: string;
  role: string;
  realName?: string; // 선택적 필드로 설정
  phone?: string; // 선택적 필드로 설정
};
