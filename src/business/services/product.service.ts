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
    dto: CreateProductDto,
  ): Promise<Product> {
    console.log('[createProduct] DTO:', dto);

    // 상품 생성 및 저장
    const product = this.productRepository.create({
      ...dto,
      seller: { id: sellerId },
    });
    console.log('[createProduct] Created Product Entity:', product);

    const savedProduct = await this.productRepository.save(product);
    console.log('[createProduct] Saved Product:', savedProduct);

    // 이미지 저장
    if (dto.images && dto.images.length > 0) {
      const uniqueImages = dto.images.filter(
        (img, index, self) =>
          index ===
          self.findIndex(
            (i) =>
              i.imageUrl === img.imageUrl &&
              i.thumbnailUrl === img.thumbnailUrl,
          ),
      );
      console.log('[createProduct] Unique Images:', uniqueImages);

      // 명시적으로 이미지 저장
      await this.productImagesRepository.saveImages(savedProduct, uniqueImages);
      console.log('[createProduct] Images Saved');
    }

    return savedProduct;
  }

  @Transactional()
  async updateProduct(
    productId: string,
    sellerId: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    console.log('[updateProduct] Fetched productId:', productId);

    const product =
      await this.productRepository.findProductWithImages(productId);

    console.log('[updateProduct] Fetched Product:', product);

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    if (!product.images) {
      throw new Error('Product images are not loaded. Check database query.');
    }

    if (product.seller.id !== sellerId) {
      throw new NotFoundException('권한이 없습니다.');
    }

    // 업데이트 로직
    Object.assign(product, dto);

    // 기존 이미지 처리
    if (dto.images) {
      const existingImages = product.images;
      const newImages = dto.images;

      const imagesToAdd = newImages.filter(
        (newImg) =>
          !existingImages.some(
            (oldImg) =>
              oldImg.imageUrl === newImg.imageUrl &&
              oldImg.thumbnailUrl === newImg.thumbnailUrl,
          ),
      );

      const imagesToDelete = existingImages.filter(
        (oldImg) =>
          !newImages.some(
            (newImg) =>
              newImg.imageUrl === oldImg.imageUrl &&
              newImg.thumbnailUrl === oldImg.thumbnailUrl,
          ),
      );

      console.log('[updateProduct] Images to Add:', imagesToAdd);
      console.log('[updateProduct] Images to Delete:', imagesToDelete);

      // 삭제 작업
      if (imagesToDelete.length > 0) {
        const deleteIds = imagesToDelete.map((img) => img.id);
        console.log('[updateProduct] Image IDs to Delete:', deleteIds);
        await this.productImagesRepository.delete(deleteIds);
      }

      // 추가 작업
      if (imagesToAdd.length > 0) {
        const newImageEntities = imagesToAdd.map((img) =>
          this.productImagesRepository.create({
            product,
            imageUrl: img.imageUrl,
            thumbnailUrl: img.thumbnailUrl,
          }),
        );

        console.log('[updateProduct] Image Entities to Add:', newImageEntities);
        await this.productImagesRepository.save(newImageEntities);
      }
    }

    const updatedProduct = await this.productRepository.save(product);

    console.log('[updateProduct] Updated Product:', updatedProduct);

    return updatedProduct;
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
