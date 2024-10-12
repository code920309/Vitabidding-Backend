// src/product/entities/product.entity.ts
import { Entity, Column, ManyToOne, Relation, Index } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { User } from '../../auth/entities/user.entity';

@Entity()
@Index('product_sellerid_index', ['seller'])
export class Product extends BaseEntity {
  @ManyToOne(() => User)
  seller: Relation<User>;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  price: string;

  @Column()
  stock: string;

  @Column()
  startDay: string;

  @Column()
  startTime: string;

  @Column()
  category: string;

  @Column()
  status: string;
}
