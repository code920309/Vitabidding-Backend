// src/auth/entities/access-token.entity.ts
import { Column, Entity, ManyToOne, Relation, Index } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { User } from './user.entity';

@Entity()
@Index('accesstoken_userid_index', ['user'])
export class AccessToken extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // User 삭제 시 AccessToken도 삭제
  user: Relation<User>;

  @Column()
  jti: string;

  @Column()
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  isRevoked: boolean;
}
