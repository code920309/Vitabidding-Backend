// src/auth/dto/update-user.dto.ts

import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateAddressDto {
  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  streetAddress1?: string;

  @IsOptional()
  @IsString()
  streetAddress2?: string;

  @IsOptional()
  @IsString()
  state?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto;
}
