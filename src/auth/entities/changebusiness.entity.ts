// src/auth/entities/changebusiness.entity.ts
import { Entity, Column, ManyToOne, Relation, Index } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { User } from './user.entity';

@Entity()
@Index('changebusiness_userid_index', ['user'])
export class ChangeBusiness extends BaseEntity {
  @ManyToOne(() => User)
  user: Relation<User>;

  @Column()
  businessRegistrationNumber: string;

  @Column()
  businessImage: string;
}
