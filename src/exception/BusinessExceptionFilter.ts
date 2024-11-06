import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException, ErrorDomain } from './BusinessException';

// 에러 응답 형식을 정의한 인터페이스
export interface ApiError {
  id: string;
  domain: ErrorDomain;
  message: string;
  timestamp: string;
  status: number; // status 필드 사용
}

// 한국 시간(KST, UTC+9)으로 변환하는 함수
function getKstTimestamp(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // UTC+9 시간 차이
  const kstTime = new Date(now.getTime() + kstOffset);
  return kstTime.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:MM:SS 형식으로 반환
}

// Error 객체를 잡아서 처리하는 필터
@Catch(Error)
export class BusinessExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessExceptionFilter.name);

  // 예외를 처리하는 메서드
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const timestamp = getKstTimestamp(); // KST 타임스탬프 생성
    let status: HttpStatus;
    let body: any;

    // 1. BusinessException 처리
    if (exception instanceof BusinessException) {
      status = exception.status;
      body = {
        id: exception.id,
        domain: exception.domain,
        message: exception.apiMessage,
        timestamp,
        status, // status 필드 사용
      };
    }
    // 2. HttpException 처리 (예: ValidationPipe 에러)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();

      // responseBody가 객체인 경우 (예: ValidationPipe 에러 메시지) 그대로 포함하면서 statusCode 제거
      body =
        typeof responseBody === 'object'
          ? {
              ...responseBody,
              id: new BusinessException('generic', '', '', status).id,
              timestamp,
              status,
            }
          : {
              id: new BusinessException('generic', '', '', status).id,
              domain: 'generic',
              message: responseBody,
              timestamp,
              status,
            };

      // statusCode가 포함된 경우 status로 덮어쓰기 처리
      delete body.statusCode;
    }
    // 3. 그 외 일반적인 에러 처리
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = {
        id: new BusinessException('generic', '', '', status).id,
        domain: 'generic',
        message: `Internal server error: ${exception.message}`,
        timestamp,
        status,
      };
    }

    // 서버 디버깅을 위한 에러 로그 (스택 트레이스 포함)
    this.logger.error(
      `Exception occurred: ${JSON.stringify({
        path: request.url,
        ...body,
      })}`,
      exception.stack,
    );

    // 클라이언트에게 포맷된 에러 응답 전송
    response.status(status).json(body);
  }
}
