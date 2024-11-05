// src/auth/types/index.ts
/**
 * JWT 토큰의 페이로드 데이터 타입
 */
export type TokenPayload = {
  sub: string;
  iat: number;
  jti: string;
};

/**
 * OAuth 제공자 타입
 */
export type OauthProvider = 'kakao' | 'naver';

/**
 * 요청 정보 타입
 */
export type RequestInfo = {
  ip: string;
  ua: string;
  endpoint: string;
};

/**
 * OAuth 사용자 정보 타입
 */
export type OauthUserInfo = {
  name: string;
  email: string;
  phone: string;
  provider: OauthProvider;
  providerId: string;
};

/**
 * 토큰 페이로드 생성 입력 타입
 */
export type CreateTokenPayloadInput = {
  sub: string;
  iat: number;
  jti: string;
};

/**
 * 사용자 생성 입력 타입
 */
export type CreateUserInput = {
  name: string;
  email: string;
};

/**
 * 카카오 OAuth 요청 입력 타입
 */
export type KakaoRequestInput = {
  code: string;
};

/**
 * 네이버 OAuth 요청 입력 타입
 */
export type NaverRequestInput = {
  code: string;
  state: string;
};
