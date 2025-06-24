import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BasePaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 15;

  @IsOptional()
  @IsString()
  orderBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  orderDirection?: 'asc' | 'desc' = 'desc';
}

export class PaginatedResponseDto<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(data: T[], page: number, limit: number, total: number) {
    this.data = data;
    this.pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }
}

export interface BasePaginationResult<T> {
  data: T[];
  total: number;
} 