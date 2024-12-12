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
    // 부모 클래스 Repository의 생성자 호출
    super(repo.target, repo.manager, repo.queryRunner);
  }

  /**
   * 새로운 상품을 생성하고 저장하는 메서드
   * @param data 생성할 상품 데이터 (Partial<Product> 형태)
   * @returns 생성된 상품 엔티티
   */
  async createProduct(data: Partial<Product>): Promise<Product> {
    const product = this.repo.create(data); // 메모리 상에서 새로운 상품 엔티티 생성
    return this.repo.save(product); // 데이터베이스에 저장
  }

  /**
   * 특정 상품과 관련된 이미지를 포함한 데이터를 조회하는 메서드
   * @param productId 조회할 상품의 ID
   * @returns 상품 엔티티 또는 null (이미지 관계 포함)
   */
  async findProductWithImages(productId: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { id: productId },
      relations: ['images'], // 이미지 관계를 포함하여 조회
    });
  }

  /**
   * 특정 판매자가 등록한 모든 상품을 조회하는 메서드
   * @param sellerId 판매자의 ID
   * @returns 해당 판매자가 등록한 상품 목록 (이미지 관계 포함)
   */
  async findProductsBySeller(sellerId: string): Promise<Product[]> {
    return this.repo.find({
      where: { seller: { id: sellerId } }, // 판매자 ID 기준으로 조회
      relations: ['images'], // 이미지 관계를 포함하여 조회
    });
  }

  /**
   * 모든 상품을 조회하는 메서드
   * @returns 모든 상품 목록 (이미지 관계 포함)
   */
  async findAllProducts(): Promise<Product[]> {
    return this.repo.find({
      relations: ['images'], // 이미지 관계를 포함하여 조회
    });
  }

  /**
   * 특정 상품을 삭제하는 메서드
   * - 상품이 존재하지 않거나 판매자 ID가 일치하지 않으면 NotFoundException 발생
   * @param productId 삭제할 상품의 ID
   * @param sellerId 삭제를 요청한 판매자의 ID
   */
  async deleteProduct(productId: string, sellerId: string): Promise<void> {
    const product = await this.repo.findOne({
      where: { id: productId, seller: { id: sellerId } }, // 상품 ID와 판매자 ID를 기준으로 조회
    });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없거나 권한이 없습니다.');
    }
    await this.repo.remove(product); // 상품 삭제
  }
}
