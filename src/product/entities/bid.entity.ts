// src/product/entities/bid.entity.ts
import { Entity, Column, ManyToOne, Relation, Index } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { User } from '../../auth/entities/user.entity';
import { Auction } from './auction.entity';

@Entity()
@Index('bid_auctionid_index', ['auction'])
@Index('bid_userid_index', ['user'])
export class Bid extends BaseEntity {
  @ManyToOne(() => Auction)
  auction: Relation<Auction>;

  @ManyToOne(() => User)
  user: Relation<User>;

  @Column()
  bidAmount: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  bidTime: Date;
}
