// src/business/controllers/product.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from '../services';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentSeller } from '../../common/decorators';
import { CreateProductDto, UpdateProductDto } from '../dto';

@Controller('business/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(
    @CurrentSeller() sellerId: string,
    @Body() dto: CreateProductDto,
  ): Promise<{ message: string }> {
    await this.productService.createProduct(sellerId, dto);
    return { message: '상품이 성공적으로 등록되었습니다.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-products')
  async getMyProducts(@CurrentSeller() sellerId: string) {
    return this.productService.getProductsBySeller(sellerId);
  }

  @Post('details')
  async getProduct(@Body('productId') productId: string) {
    return this.productService.getProductById(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async updateProduct(
    @CurrentSeller() sellerId: string,
    @Body() dto: UpdateProductDto & { productId: string },
  ) {
    return this.productService.updateProduct(dto.productId, sellerId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
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
