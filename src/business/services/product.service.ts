// src/business/services/product.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transactional } from 'typeorm-transactional';
import { plainToInstance } from 'class-transformer';
import { ProductRepository, ProductImagesRepository } from '../repositories';
import { CreateProductDto, UpdateProductDto } from '../dto';
import { Product } from '../entities';
import { OCIStorageService } from '../../common/services';
import { Readable } from 'stream';

@Injectable()
export class ProductService {
  private readonly bucketName: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly productRepository: ProductRepository,
    private readonly productImagesRepository: ProductImagesRepository,
    private readonly ociStorageService: OCIStorageService,
  ) {
    this.bucketName = this.configService.get<string>('OCI_BUCKET_NAME');
  }

  /**
   * 새로운 상품을 생성하는 메서드
   * - 상품 데이터를 저장하고 업로드된 이미지를 처리합니다.
   * - 트랜잭션 처리를 통해 데이터 일관성을 유지합니다.
   * @param sellerId 판매자 ID
   * @param createProductDto 상품 생성 DTO
   * @param files 업로드된 파일 목록
   * @returns 생성된 상품 엔티티
   */
  @Transactional()
  async createProduct(
    sellerId: string,
    createProductDto: CreateProductDto,
    files: Array<Express.Multer.File>,
  ): Promise<Product> {
    console.log('===[Service] Received Seller ID===', sellerId); // Seller ID 확인
    console.log('===[Service] Received DTO===', createProductDto); // DTO 확인
    console.log('===[Service] Uploaded Files===', files); // 업로드된 파일 확인

    // 1. 상품 데이터 준비 및 저장
    const productData = {
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price,
      stock: createProductDto.stock,
      startDay: createProductDto.startDay,
      startTime: createProductDto.startTime,
      category: createProductDto.category,
      status: createProductDto.status,
      seller: { id: sellerId },
    };

    console.log('===[Service] Prepared Product Data===', productData);
    const product = this.productRepository.create(productData);

    // 2. 이미지 업로드 및 저장
    const savedProduct = await this.productRepository.save(product);
    console.log('===[Service] Saved Product===', savedProduct);

    const productImages = [];
    for (const file of files) {
      console.log('===[Service] Processing File===', file.originalname); // 처리 중인 파일명
      const fileStream = Readable.from(file.buffer);
      const objectName = `products/${savedProduct.id}/${file.originalname}`;
      const imageUrl = await this.ociStorageService.uploadObject(
        this.bucketName,
        objectName,
        fileStream,
        file.mimetype,
      );

      console.log('===[Service] Uploaded Image URL===', imageUrl);
      productImages.push(
        this.productImagesRepository.create({
          product: savedProduct,
          imageUrl,
          isThumbnail: createProductDto.images.some(
            (img) => img.imageUrl === file.originalname,
          ),
        }),
      );
    }

    console.log('===[Service] Saved Product Images===', productImages);
    await this.productImagesRepository.save(productImages);

    // 3. 최종 상품 데이터 반환 (이미지 포함)
    // return this.productRepository.findProductWithImages(savedProduct.id);
    const finalProduct = await this.productRepository.findProductWithImages(
      savedProduct.id,
    );
    console.log('===[Service] Final Product with Images===', finalProduct);
    return finalProduct;
  }

  /**
   * 기존 상품 정보를 수정하는 메서드
   * - 기존 데이터를 검증하고 새로운 이미지로 업데이트합니다.
   * @param sellerId 판매자 ID
   * @param updateProductDto 상품 수정 DTO
   * @param files 업로드된 파일 목록
   * @returns 수정된 상품 엔티티
   */
  @Transactional()
  async updateProduct(
    sellerId: string,
    updateProductDto: UpdateProductDto,
    files: Array<Express.Multer.File>,
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

    // 2. 기존 이미지 삭제 (DB 및 원본 파일)
    const bucketName = this.bucketName;
    console.log('---[DEBUG] Deleting Existing Images---');
    for (const image of existingProduct.images) {
      const objectName = new URL(image.imageUrl).pathname
        .split('/')
        .slice(3)
        .join('/');
      console.log('Deleting Object:', objectName);

      // 클라우드 버킷에서 이미지 삭제
      try {
        await this.ociStorageService.deleteObject(bucketName, image.imageUrl);
      } catch (error) {
        console.warn(
          'Failed to delete object. Skipping:',
          image.imageUrl,
          error,
        );
      }
    }

    // DB에서 기존 이미지 URL 삭제
    await this.productImagesRepository.deleteImagesByProductId(productId);
    console.log('---[DEBUG] Deleted Images from Database---');

    // 3. 상품 정보 업데이트
    Object.assign(existingProduct, productData);
    const updatedProduct = await this.productRepository.save(existingProduct);

    // 4. 새로운 이미지 업로드 및 DB 저장
    const newImages = [];
    for (const file of files) {
      console.log('Processing New File:', file.originalname);
      const fileStream = Readable.from(file.buffer);
      const objectName = `products/${updatedProduct.id}/${file.originalname}`;
      const imageUrl = await this.ociStorageService.uploadObject(
        bucketName,
        objectName,
        fileStream,
        file.mimetype,
      );

      console.log('Uploaded New Image URL:', imageUrl);

      newImages.push(
        this.productImagesRepository.create({
          product: updatedProduct,
          imageUrl,
          isThumbnail: images.some(
            (img) => img.imageUrl === file.originalname && img.isThumbnail,
          ),
        }),
      );
    }

    await this.productImagesRepository.save(newImages);
    console.log('---[DEBUG] Saved New Images to Database---');

    return this.productRepository.findProductWithImages(updatedProduct.id);
  }

  /**
   * 특정 상품을 삭제하는 메서드
   * - 상품과 연관된 이미지를 삭제하고 데이터베이스에서 제거합니다.
   * @param productId 삭제할 상품 ID
   * @param sellerId 판매자 ID
   */
  async deleteProduct(productId: string, sellerId: string): Promise<void> {
    const existingProduct = await this.productRepository.findOne({
      where: { id: productId, seller: { id: sellerId } },
      relations: ['images'],
    });

    if (!existingProduct) {
      throw new NotFoundException(
        '상품을 찾을 수 없거나 삭제 권한이 없습니다.',
      );
    }

    const bucketName = this.bucketName;
    console.log('---[DEBUG] Deleting Product---', existingProduct);

    for (const image of existingProduct.images) {
      try {
        await this.ociStorageService.deleteObject(bucketName, image.imageUrl);
      } catch (error) {
        console.warn(
          'Failed to delete image from Object Storage:',
          image.imageUrl,
          error,
        );
      }
    }

    try {
      await this.productRepository.remove(existingProduct);
      console.log(
        '---[DEBUG] Product and Related Data Deleted Successfully---',
        productId,
      );
    } catch (error) {
      console.error(
        'Failed to delete product from the database:',
        productId,
        error,
      );
      throw error;
    }
  }

  /**
   * 특정 상품을 ID로 조회하는 메서드
   * @param productId 조회할 상품 ID
   * @returns 조회된 상품 엔티티 (이미지 포함)
   */
  async getProductById(productId: string): Promise<Product> {
    const product =
      await this.productRepository.findProductWithImages(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    return product;
  }

  /**
   * 특정 판매자가 등록한 모든 상품을 조회하는 메서드
   * @param sellerId 판매자 ID
   * @returns 해당 판매자가 등록한 상품 목록
   */
  async getProductsBySeller(sellerId: string): Promise<Product[]> {
    return this.productRepository.findProductsBySeller(sellerId);
  }

  /**
   * 모든 상품을 조회하는 메서드
   * @returns 모든 상품 목록
   */
  async getAllProducts(): Promise<Product[]> {
    return this.productRepository.findAllProducts();
  }
}
