import { Injectable } from '@nestjs/common';
import { BaseEntity } from '../entities/base.entity';
import { IBaseRepository, BaseFilters } from '../interfaces';
import { BasePaginationDto, PaginatedResponseDto } from '../dtos/pagination.dto';

@Injectable()
export class PaginationService {
  async paginate<T extends BaseEntity>(
    repository: IBaseRepository<T>,
    paginationDto: BasePaginationDto,
    filters: BaseFilters = {}
  ): Promise<PaginatedResponseDto<T>> {
    const {
      page = 1,
      limit = 15,
      orderBy = 'createdAt',
      orderDirection = 'desc'
    } = paginationDto;

    const result = await repository.findWithPagination(
      page,
      limit,
      filters,
      orderBy,
      orderDirection
    );

    return new PaginatedResponseDto(
      result.data,
      page,
      limit,
      result.total
    );
  }
} 