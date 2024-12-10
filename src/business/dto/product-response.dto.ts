// src/business/dto/product-response.dto.ts
export class ProductResponseDto {
  productId: string;
  name: string;
  description?: string;
  price: string;
  stock: string;
  startDay: string;
  startTime: string;
  category: string;
  status: string;
  images: { imageUrl: string; isThumbnail: boolean }[];
}
