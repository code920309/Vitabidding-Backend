// src/product/entities/auction.entity.ts
import { Entity, Column, ManyToOne, Relation, Index } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { Product } from './product.entity';

@Entity()
@Index('auction_productid_index', ['product'])
export class Auction extends BaseEntity {
  @ManyToOne(() => Product)
  product: Relation<Product>;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ default: '0.00' })
  currentHighestBid: string;

  @Column({ type: 'enum', enum: ['active', 'closed'] })
  status: 'active' | 'closed';
}
