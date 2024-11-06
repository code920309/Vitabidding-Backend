// src/auth/dto/refresh-req.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 액세스 토큰 갱신 요청 시 필요한 데이터 전송 객체
 */
export class RefreshReqDto {
  @IsNotEmpty({ message: '리프레시 토큰은 필수 입력 항목입니다.' })
  @IsString({ message: '리프레시 토큰은 문자열 형식이어야 합니다.' })
  refreshToken: string;
}
