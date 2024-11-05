// src/exception/BusinessExceptionFilter.ts
// NestJS 관련 라이브러리 및 데코레이터
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

// Express 관련 타입
import { Request, Response } from 'express';

// 내부 예외 처리 및 타입
import { BusinessException, ErrorDomain } from './BusinessException';

/**
 * API 에러 응답 형식 인터페이스
 */
export interface ApiError {
  id: string;
  domain: ErrorDomain;
  message: string;
  timestamp: Date;
}

/**
 * 비즈니스 예외 필터
 * 비즈니스 로직 예외 및 기타 에러에 대한 일관된 응답 형식을 제공
 */
@Catch(Error)
export class BusinessExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessExceptionFilter.name);

  /**
   * 예외를 캐치하고, HTTP 응답을 형성하여 반환
   * @param exception 발생한 예외 객체
   * @param host 현재 요청과 응답을 포함하는 호스트 객체
   */
  catch(exception: Error, host: ArgumentsHost) {
    let body: ApiError;
    let status: HttpStatus;
    const stack: string =
      exception.stack || (Error.captureStackTrace(exception), exception.stack);

    // 비즈니스 예외 처리
    if (exception instanceof BusinessException) {
      status = exception.status;
      body = {
        id: exception.id,
        domain: exception.domain,
        message: exception.message,
        timestamp: exception.timestamp,
      };
    }
    // HTTP 예외 처리
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      body = new BusinessException(
        'generic',
        exception.message,
        exception.message,
        exception.getStatus(),
      );
    }
    // 일반 예외 처리
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = new BusinessException(
        'generic',
        `Internal server error: ${exception.message}`,
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    this.logger.error(
      `Exception occurred: ${JSON.stringify({
        path: request.url,
        ...body,
      })}`,
      stack,
    );

    response.status(status).json(body);
  }
}
