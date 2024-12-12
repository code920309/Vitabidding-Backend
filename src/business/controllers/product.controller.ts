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

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async createProduct(
    @CurrentSeller() sellerId: string,
    @UploadedFiles() files: Express.Multer.File[], // Files from client
    @Body('createProductDto') createProductDtoRaw: string, // CreateProductDto 직접 받음
  ) {
    console.log('===[Controller] Seller ID===', sellerId); // Seller ID 확인
    console.log('===[Controller] Uploaded Files===', files); // 업로드된 파일 목록
    console.log('===[Controller] Raw DTO===', createProductDtoRaw); // Body에서 받은 DTO

    const createProductDto: CreateProductDto = JSON.parse(createProductDtoRaw); // JSON 파싱
    console.log('Parsed DTO:', createProductDto);

    // Pass DTO and files to the service
    const product = await this.productService.createProduct(
      sellerId,
      createProductDto,
      files,
    );

    console.log('===[Controller] Created Product===', product); // 결과 확인
    return { message: '상품이 성공적으로 생성되었습니다.', product };
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async updateProduct(
    @CurrentSeller() sellerId: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const updatedProduct = await this.productService.updateProduct(
      sellerId,
      updateProductDto,
    );
    return { message: '상품이 성공적으로 수정되었습니다.', updatedProduct };
  }

  @Get('my-products')
  @UseGuards(JwtAuthGuard)
  async getMyProducts(@CurrentSeller() sellerId: string) {
    return this.productService.getProductsBySeller(sellerId);
  }

  @Post('details')
  async getProduct(@Body('productId') productId: string) {
    return this.productService.getProductById(productId);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async deleteProduct(
    @CurrentSeller() sellerId: string,
    @Body('productId') productId: string,
  ) {
    await this.productService.deleteProduct(productId, sellerId);
    return { message: '상품이 성공적으로 삭제되었습니다.' };
  }

  @Get()
  async getAllProducts() {
    return this.productService.getAllProducts();
  }
}
