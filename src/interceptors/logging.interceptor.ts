// src/interceptors/logging.interceptor.ts
// NestJS 관련 라이브러리 및 데코레이터
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';

// RxJS 관련 연산자
import { catchError, Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';

// 내부 모듈
import { AccessLogRepository } from '../auth/repositories';
import { User } from '../auth/entities';

// Express 관련 타입
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly accessLogRepository: AccessLogRepository) {}

  /**
   * 요청을 가로채고, 액세스 로그를 기록
   * @param context 현재 실행 중인 컨텍스트
   * @param next 다음 핸들러
   * @returns Observable 처리 후 반환
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const { ip, method, originalUrl } = request;
    const userAgent = request.headers['user-agent'] || '';
    const user = request.user as User; // AuthGuard가 이 값을 설정할 것

    return next.handle().pipe(
      // 요청 성공 시 액세스 로그 기록
      tap(async () => {
        try {
          if (
            !userAgent.includes('ELB-HealthChecker') &&
            originalUrl !== '/auth/login'
          ) {
            await this.accessLogRepository.createAccessLog(
              user,
              userAgent,
              `${method} ${originalUrl}`,
              ip,
            );
          }
        } catch (err) {
          this.logger.error('Failed to create access log');
        }
      }),
      // 요청 실패 시 에러 로깅
      catchError((err) => {
        this.logger.error(`Error in request: ${err}`);
        return throwError(err);
      }),
    );
  }
}
