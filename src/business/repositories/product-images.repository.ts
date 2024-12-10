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

  async saveImages(product: Product, images: Partial<ProductImages>[]) {
    const imageEntities = images.map((img) =>
      this.repo.create({
        product,
        imageUrl: img.imageUrl,
        thumbnailUrl: img.thumbnailUrl,
      }),
    );
    console.log('[saveImages] Image Entities to Save:', imageEntities); // 생성된 이미지 엔티티 확인
    await this.repo.save(imageEntities);
    console.log('[saveImages] Images Saved'); // 이미지 저장 완료 확인
  }

  async deleteImagesByProductId(productId: string): Promise<void> {
    console.log('딜리트', productId);
    if (!productId) {
      throw new Error('Invalid product ID for deleting images.');
    }

    await this.repo.delete({ product: { id: productId } });
  }
}
