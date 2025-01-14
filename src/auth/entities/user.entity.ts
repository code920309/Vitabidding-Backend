// src/auth/entities/user.entity.ts
import { Column, Entity, OneToMany, Relation } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { RefreshToken } from './refresh-token.entity';
import { AccessToken } from './access-token.entity';
import { AccessLog } from './access-log.entity';
import { Address } from './address.entity';
import { AgreementVerify } from './agreement-verify.entity';

export type UserRole = 'admin' | 'user';

@Entity()
export class User extends BaseEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  realName: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  provider: string;

  @Column({ type: 'varchar', nullable: true })
  providerId: string;

  @Column({ type: 'varchar', length: 50 })
  role: UserRole;

  @Column({ nullable: true })
  regNo: string;

  @Column({ default: false })
  isPersonalInfoVerified: boolean;

  @OneToMany(() => AccessToken, (token) => token.user)
  accessToken: Relation<AccessToken[]>;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshToken: Relation<RefreshToken[]>;

  @OneToMany(() => AccessLog, (log) => log.user)
  accessLogs: Relation<AccessLog[]>;

  @OneToMany(() => Address, (address) => address.user)
  addresses: Relation<Address[]>;

  @OneToMany(() => AgreementVerify, (agreement) => agreement.user)
  agreements: Relation<AgreementVerify[]>;
}
