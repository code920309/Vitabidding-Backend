// src/common/response.dto.ts
// NestJS Swagger 데코레이터
import { ApiProperty } from '@nestjs/swagger';

/**
 * 공통 응답 데이터 전송 객체 (DTO)
 * @template T 응답 데이터의 타입
 */
export class ResponseDto<T> {
  @ApiProperty({
    description: 'Status code of the response',
    example: 200,
    type: 'number',
  })
  statusCode: number;

  @ApiProperty({
    description: '응답 메시지',
    example: 'insert success',
    type: 'string',
  })
  message: string;

  @ApiProperty({
    description: '응답 데이터',
    example: 'insert success',
    type: () => ResponseDto['data'],
  })
  data: T;

  /**
   * ResponseDto 생성자
   * @param code 응답 상태 코드
   * @param message 응답 메시지
   * @param data 응답 데이터 (optional)
   */
  constructor(code: number, message: string, data?: T) {
    this.statusCode = code;
    this.message = message;
    this.data = data;
  }
}
