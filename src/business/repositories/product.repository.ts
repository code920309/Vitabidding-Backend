// src/business/repositories/product.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities';

@Injectable()
export class ProductRepository extends Repository<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async findProductWithImages(productId: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { id: productId },
      relations: ['images'],
    });
  }

  async findProductsBySeller(sellerId: string): Promise<Product[]> {
    return this.repo.find({
      where: { seller: { id: sellerId } },
      relations: ['images'],
    });
  }

  async findAllProducts(): Promise<Product[]> {
    return this.repo.find({
      relations: ['images'],
    });
  }

  async deleteProduct(productId: string, sellerId: string): Promise<void> {
    const product = await this.repo.findOne({
      where: { id: productId, seller: { id: sellerId } },
    });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없거나 권한이 없습니다.');
    }
    await this.repo.remove(product);
  }
}
