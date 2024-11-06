// src/exception/BusinessException.ts
// NestJS 관련 라이브러리
import { HttpStatus } from '@nestjs/common';

/**
 * Error Domain 타입
 * 비즈니스 로직에서 발생하는 오류의 도메인 구분
 */
export type ErrorDomain =
  | 'generic'
  | 'auth'
  | 'user'
  | 'payment'
  | 'investment'
  | 'validation';

/**
 * 비즈니스 예외 클래스
 * 사용자 및 로깅을 위한 예외 정보를 포함
 */
export class BusinessException extends Error {
  public readonly id: string;
  public readonly timestamp: Date;

  /**
   * @param domain 오류 도메인
   * @param message 로깅에 사용되는 내부 메시지
   * @param apiMessage 사용자에게 반환되는 API 메시지
   * @param status HTTP 상태 코드
   */
  constructor(
    public readonly domain: ErrorDomain,
    public readonly message: string,
    public readonly apiMessage: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
    this.id = BusinessException.genId();
    this.timestamp = new Date();
  }

  /**
   * 고유 ID 생성
   * @param length 생성할 ID의 길이 (기본값: 12)
   * @returns 무작위 문자열 ID
   */
  private static genId(length = 12): string {
    const p = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return [...Array(length)].reduce(
      (a) => a + p[Math.floor(Math.random() * p.length)],
      '',
    );
  }
}
