// src/auth/dto/create-user.dto.ts
import { UserRole } from '../entities';

export type CreateUserDto = {
  name: string;
  realName: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
};
