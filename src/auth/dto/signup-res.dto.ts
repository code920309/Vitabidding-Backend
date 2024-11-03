// src/auth/dto/signup-res.dto.ts
// import { UserRole } from '../entities';

export type SignupResDto = {
  id: string;
  name: string;
  email: string;
  role: string;
  realName?: string; // 선택적 필드로 설정
  phone?: string; // 선택적 필드로 설정
};
