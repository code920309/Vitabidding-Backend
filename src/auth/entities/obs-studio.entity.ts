import { Entity, Column, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { User } from './user.entity';

@Entity()
export class ObsStudio extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // User 삭제 시 RefreshToken도 삭제
  user: Relation<User>;

  @Column()
  obsUrl: string;

  @Column()
  auctionUrl: string;

  @Column()
  videoLiveUrl: string;
}
