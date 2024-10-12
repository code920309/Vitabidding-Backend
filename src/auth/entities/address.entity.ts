// src/auth/entities/address.entity.ts
import { Entity, Column, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { User } from './user.entity';

@Entity()
export class Address extends BaseEntity {
  @ManyToOne(() => User)
  user: Relation<User>;

  @Column()
  zipCode: string;

  @Column()
  streetAddress1: string;

  @Column()
  streetAddress2: string;

  @Column()
  state: string;
}