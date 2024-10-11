// src/auth/dto/login-res.dto.ts
export type LoginResDto = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
};
