// src/business/repositories/product-images.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductImages } from '../entities';

@Injectable()
export class ProductImagesRepository extends Repository<ProductImages> {
  constructor(
    @InjectRepository(ProductImages)
    private readonly repo: Repository<ProductImages>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async findImagesByProductId(productId: string): Promise<ProductImages[]> {
    return this.repo.find({
      where: { product: { id: productId } },
    });
  }

  async deleteImagesByProductId(productId: string): Promise<void> {
    await this.repo.delete({ product: { id: productId } });
  }

  async saveImages(images: Array<Partial<ProductImages>>): Promise<void> {
    const imageEntities = this.repo.create(images);
    await this.repo.save(imageEntities);
  }
}
