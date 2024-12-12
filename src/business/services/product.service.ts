// src/business/services/product.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { ProductRepository, ProductImagesRepository } from '../repositories';
import { CreateProductDto, UpdateProductDto } from '../dto';
import { Product } from '../entities';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productImagesRepository: ProductImagesRepository,
  ) {}

  @Transactional()
  async createProduct(
    sellerId: string,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    const { images, ...productData } = createProductDto;

    // 1. 상품 생성
    const product = await this.productRepository.createProduct({
      ...productData,
      seller: { id: sellerId },
    });

    // 2. 이미지 저장
    if (images && images.length > 0) {
      const productImages = images.map((image) => ({
        product,
        imageUrl: image.imageUrl,
        isThumbnail: !!image.thumbnailUrl,
      }));
      await this.productImagesRepository.saveImages(productImages);
    }

    // 3. 저장된 상품 반환
    return this.productRepository.findProductWithImages(product.id);
  }

  @Transactional()
  async updateProduct(
    sellerId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const { images, productId, ...productData } = updateProductDto;

    // 1. 기존 상품 확인
    const existingProduct = await this.productRepository.findOne({
      where: { id: productId, seller: { id: sellerId } },
      relations: ['images'],
    });

    if (!existingProduct) {
      throw new NotFoundException(
        '상품을 찾을 수 없거나 수정 권한이 없습니다.',
      );
    }

    // 2. 상품 정보 업데이트
    Object.assign(existingProduct, productData);
    const updatedProduct = await this.productRepository.save(existingProduct);

    // 3. 이미지 업데이트
    if (images && images.length > 0) {
      // 기존 이미지 삭제
      await this.productImagesRepository.deleteImagesByProductId(productId);

      // 새 이미지 추가
      const newImages = images.map((image) =>
        this.productImagesRepository.create({
          product: updatedProduct,
          imageUrl: image.imageUrl,
          isThumbnail: !!image.thumbnailUrl,
        }),
      );
      await this.productImagesRepository.save(newImages);
    }

    // 4. 업데이트된 상품 반환
    return this.productRepository.findProductWithImages(updatedProduct.id);
  }

  async deleteProduct(productId: string, sellerId: string): Promise<void> {
    await this.productRepository.deleteProduct(productId, sellerId);
  }

  async getProductById(productId: string): Promise<Product> {
    const product =
      await this.productRepository.findProductWithImages(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    return product;
  }

  async getProductsBySeller(sellerId: string): Promise<Product[]> {
    return this.productRepository.findProductsBySeller(sellerId);
  }

  async getAllProducts(): Promise<Product[]> {
    return this.productRepository.findAllProducts();
  }
}
