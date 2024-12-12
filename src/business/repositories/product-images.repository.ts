// src/business/repositories/product-images.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product, ProductImages } from '../entities';

@Injectable()
export class ProductImagesRepository extends Repository<ProductImages> {
  constructor(
    @InjectRepository(ProductImages)
    private readonly repo: Repository<ProductImages>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async saveImages(images: Array<Partial<ProductImages>>): Promise<void> {
    const imageEntities = this.repo.create(images);
    await this.repo.save(imageEntities);
  }

  async deleteImagesByProductId(productId: string): Promise<void> {
    console.log('딜리트', productId);
    if (!productId) {
      throw new Error('Invalid product ID for deleting images.');
    }

    await this.repo.delete({ product: { id: productId } });
  }
}
