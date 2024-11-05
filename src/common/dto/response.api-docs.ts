// src/common/response.api-docs.ts
// NestJS 관련 라이브러리
import { HttpStatus } from '@nestjs/common';

/**
 * 공통 API 응답 문서 생성 함수
 * @param status 응답 상태 코드
 * @param message 응답 메시지
 * @returns 상태 코드와 메시지 예시가 포함된 응답 객체
 */
export const createCommonResponseDocs = (
  status: HttpStatus,
  message: string,
) => {
  return {
    properties: {
      statusCode: { example: status },
      message: { example: message },
    },
  };
};
