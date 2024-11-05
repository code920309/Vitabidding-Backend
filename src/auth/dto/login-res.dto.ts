// src/auth/dto/login-res.dto.ts
/**
 * 로그인 응답 시 반환되는 데이터 전송 객체
 */
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
