// src/business/business.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './controllers';
import { ProductService } from './services';
import { ProductRepository, ProductImagesRepository } from './repositories';
import { Product, ProductImages } from './entities';
import { OCIModule } from '../common/modules/oci.module'; // OCIModule import

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImages]), OCIModule],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, ProductImagesRepository],
})
export class BusinessModule {}
