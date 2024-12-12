// src/business/dto/create-product.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProductImageDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsBoolean()
  isThumbnail?: boolean;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  price: string;

  @IsString()
  stock: string;

  @IsString()
  startDay: string;

  @IsString()
  startTime: string;

  @IsString()
  category: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}
