// src/business/controllers/product.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from '../services';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentSeller } from '../../common/decorators';
import { CreateProductDto, UpdateProductDto } from '../dto';

@Controller('business/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * 새로운 상품을 생성하는 메서드
   * - 인증된 판매자만 접근 가능 (JwtAuthGuard 사용)
   * - 파일 업로드 처리 (FilesInterceptor 사용)
   * - DTO를 JSON 파싱 후 서비스에 전달
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async createProduct(
    @CurrentSeller() sellerId: string, // 현재 로그인한 판매자 ID
    @UploadedFiles() files: Express.Multer.File[], // 업로드된 파일 목록
    @Body('createProductDto') createProductDtoRaw: string, // 클라이언트에서 전달된 DTO (JSON 문자열 형태)
  ) {
    console.log('===[Controller] Seller ID===', sellerId); // Seller ID 확인
    console.log('===[Controller] Uploaded Files===', files); // 업로드된 파일 목록
    console.log('===[Controller] Raw DTO===', createProductDtoRaw); // Body에서 받은 DTO

    // JSON 문자열을 DTO로 변환
    const createProductDto: CreateProductDto = JSON.parse(createProductDtoRaw); // JSON 파싱
    console.log('Parsed DTO:', createProductDto);

    // 서비스 계층에 DTO와 파일 전달
    const product = await this.productService.createProduct(
      sellerId,
      createProductDto,
      files,
    );

    console.log('===[Controller] Created Product===', product);
    return { message: '상품이 성공적으로 생성되었습니다.', product };
  }

  /**
   * 상품 정보를 수정하는 메서드
   * - 인증된 판매자만 접근 가능 (JwtAuthGuard 사용)
   * - 파일 업로드 처리 (FilesInterceptor 사용)
   * - DTO를 JSON 파싱 후 서비스에 전달
   */
  @Put()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async updateProduct(
    @CurrentSeller() sellerId: string, // 현재 로그인한 판매자 ID
    @UploadedFiles() files: Express.Multer.File[], // 업로드된 파일 목록
    @Body('updateProductDto') updateProductDtoRaw: string, // 클라이언트에서 전달된 DTO (JSON 문자열 형태)
  ) {
    console.log('===[Controller] Seller ID===', sellerId);
    console.log('===[Controller] Uploaded Files===', files);
    console.log('===[Controller] Raw DTO===', updateProductDtoRaw);

    // JSON 문자열을 DTO로 변환
    const updateProductDto: UpdateProductDto = JSON.parse(updateProductDtoRaw);
    console.log('Parsed DTO:', updateProductDto);

    // 서비스 계층에 DTO와 파일 전달
    const updatedProduct = await this.productService.updateProduct(
      sellerId,
      updateProductDto,
      files,
    );

    console.log('===[Controller] Updated Product===', updatedProduct);
    return { message: '상품이 성공적으로 수정되었습니다.', updatedProduct };
  }

  /**
   * 현재 판매자가 등록한 모든 상품을 조회하는 메서드
   * - 인증된 판매자만 접근 가능 (JwtAuthGuard 사용)
   */
  @Get('my-products')
  @UseGuards(JwtAuthGuard)
  async getMyProducts(@CurrentSeller() sellerId: string) {
    return this.productService.getProductsBySeller(sellerId);
  }

  /**
   * 특정 상품의 상세 정보를 조회하는 메서드
   * - 인증 필요 없음
   * - 클라이언트에서 상품 ID를 전달받아 서비스 계층에 요청
   */
  @Post('details')
  async getProduct(@Body('productId') productId: string) {
    return this.productService.getProductById(productId);
  }

  /**
   * 특정 상품을 삭제하는 메서드
   * - 인증된 판매자만 접근 가능 (JwtAuthGuard 사용)
   * - 삭제하려는 상품 ID와 판매자 ID를 서비스에 전달
   */
  @Delete()
  @UseGuards(JwtAuthGuard)
  async deleteProduct(
    @CurrentSeller() sellerId: string, // 현재 로그인한 판매자 ID
    @Body('productId') productId: string, // 삭제할 상품 ID
  ) {
    await this.productService.deleteProduct(productId, sellerId);
    return { message: '상품이 성공적으로 삭제되었습니다.' };
  }

  /**
   * 모든 상품을 조회하는 메서드
   * - 인증 필요 없음
   * - 모든 상품 데이터를 서비스 계층에서 반환
   */
  @Get()
  async getAllProducts() {
    return this.productService.getAllProducts();
  }
}
