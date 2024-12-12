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

  @Transactional()
  async createProduct(
    sellerId: string,
    createProductDto: CreateProductDto,
    files: Array<Express.Multer.File>,
  ): Promise<Product> {
    console.log('===[Service] Received Seller ID===', sellerId); // Seller ID 확인
    console.log('===[Service] Received DTO===', createProductDto); // DTO 확인
    console.log('===[Service] Uploaded Files===', files); // 업로드된 파일 확인

    // 1. 상품 데이터 생성
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

    // 2. 상품 저장
    const savedProduct = await this.productRepository.save(product);
    console.log('===[Service] Saved Product===', savedProduct);

    // 3. 이미지 업로드 및 저장
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

    await this.productImagesRepository.save(productImages);
    console.log('===[Service] Saved Product Images===', productImages);

    // 4. 저장된 상품 반환
    // return this.productRepository.findProductWithImages(savedProduct.id);
    const finalProduct = await this.productRepository.findProductWithImages(
      savedProduct.id,
    );
    console.log('===[Service] Final Product with Images===', finalProduct);
    return finalProduct;
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
          isThumbnail: !!image.isThumbnail,
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
