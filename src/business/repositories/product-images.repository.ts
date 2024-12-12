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
    // 부모 클래스 Repository의 생성자 호출
    super(repo.target, repo.manager, repo.queryRunner);
  }

  /**
   * 특정 상품 ID와 관련된 모든 이미지를 조회하는 메서드
   * @param productId 조회할 상품의 ID
   * @returns 해당 상품의 이미지 목록
   */
  async findImagesByProductId(productId: string): Promise<ProductImages[]> {
    return this.repo.find({
      where: { product: { id: productId } }, // 상품 ID 기준으로 조회
    });
  }

  /**
   * 특정 상품 ID와 관련된 이미지를 삭제하는 메서드
   * @param productId 삭제할 상품의 ID
   */
  async deleteImagesByProductId(productId: string): Promise<void> {
    await this.repo.delete({ product: { id: productId } }); // 상품 ID 기준으로 이미지 삭제
  }

  /**
   * 여러 이미지를 저장하는 메서드
   * @param images 저장할 이미지 데이터 배열
   */
  async saveImages(images: Array<Partial<ProductImages>>): Promise<void> {
    // 이미지 데이터를 엔티티로 변환
    const imageEntities = this.repo.create(images);
    // 변환된 엔티티를 데이터베이스에 저장
    await this.repo.save(imageEntities);
  }
}
