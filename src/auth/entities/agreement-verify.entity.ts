// src/auth/entities/agreement-verify.entity.ts
import { Entity, Column, ManyToOne, Relation, Index } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { User } from './user.entity';

@Entity()
@Index('agreementverify_userid_index', ['user'])
export class AgreementVerify extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // User 삭제 시 AgreementVerify도 삭제
  user: Relation<User>;

  @Column({
    nullable: true,
    comment: '구매자 이용 약관: 1: 인증, 0: 인증해제, null: 미인증',
  })
  usagePolicyV: boolean | null;

  @Column({
    nullable: true,
    comment: '구매자 개인정보 수집: 1: 인증, 0: 인증해제, null: 미인증',
  })
  personalInformationV: boolean | null;

  @Column({
    nullable: true,
    comment: '판매자 이용 약관: 1: 인증, 0: 인증해제, null: 미인증',
  })
  usagePolicyC: boolean | null;

  @Column({
    nullable: true,
    comment: '판매자 개인정보 수집: 1: 인증, 0: 인증해제, null: 미인증',
  })
  personalInformationC: boolean | null;

  @Column({
    nullable: true,
    comment: '휴대전화 인증: 1: 인증, 0: 인증해제, null: 미인증',
  })
  phoneChk: boolean | null;

  @Column({
    nullable: true,
    comment: 'OTP 인증: 1: 인증, 0: 인증해제, null: 미인증',
  })
  otpChk: boolean | null;

  @Column({ default: false, comment: '비즈니스 계정 전환' })
  businessChk: boolean;
}
