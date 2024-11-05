// src/auth/dto/refresh-req.dto.ts
/**
 * 액세스 토큰 갱신 요청 시 필요한 데이터 전송 객체
 */
export type RefreshReqDto = {
  refreshToken: string;
};
