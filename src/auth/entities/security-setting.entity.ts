// src/auth/entities/security-setting.entity.ts
import { Entity } from 'typeorm';
import { BaseEntity } from '../../common/entity';

@Entity()
export class SecuritySetting extends BaseEntity {
  // 별도의 컬럼 추가 없음 (관리자 계정 테이블)
}
