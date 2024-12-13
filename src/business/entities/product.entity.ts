// src/business/entities/product.entity.ts
import { Entity, Column, ManyToOne, Relation, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { User } from '../../auth/entities/user.entity';
import { ProductImages } from './product-images.entity';

@Entity()
@Index('product_sellerid_index', ['seller'])
export class Product extends BaseEntity {
  @ManyToOne(() => User, (user) => user.id, { eager: false })
  seller: Relation<User>; // 'Relation<User> | { id: string }'에서 'Relation<User>'로 변경

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

  @OneToMany(() => ProductImages, (image) => image.product, { cascade: false })
  images: Relation<ProductImages[]>;
}
