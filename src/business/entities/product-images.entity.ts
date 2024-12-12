// src/business/entities/product-images.entity.ts
import { Entity, Column, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { Product } from './product.entity';

@Entity()
export class ProductImages extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  product: Relation<Product>;

  @Column()
  imageUrl: string;

  @Column({ default: false })
  isThumbnail: boolean;
}
