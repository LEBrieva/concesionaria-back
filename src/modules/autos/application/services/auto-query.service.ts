import { Injectable, Inject } from '@nestjs/common';
import { Auto } from '@autos/domain/auto.entity';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { AutoFilters } from '@autos/domain/interfaces/auto-filters.interface';
import { PaginationService } from '@shared/services/pagination.service';
import { AutoPaginationDto } from '@autos/application/dtos/pagination/auto-pagination.dto';
import { MarcasDisponiblesResponseDto } from '@autos/application/dtos/marcas/marcas-disponibles.dto';
import { PaginatedResponseDto, BasePaginationDto } from '@shared/dtos/pagination.dto';

@Injectable()
export class AutoQueryService {
  constructor(
    @Inject('IAutoRepository') private readonly autoRepo: IAutoRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(): Promise<Auto[]> {
    return this.autoRepo.findAll();
  }

  async findAllActive(): Promise<Auto[]> {
    return this.autoRepo.findAllActive();
  }

  async findById(id: string): Promise<Auto | null> {
    return this.autoRepo.findOneById(id);
  }

  // Paginación básica (usando el servicio genérico)
  async findWithBasicPagination(
    paginationDto: BasePaginationDto
  ): Promise<PaginatedResponseDto<Auto>> {
    return this.paginationService.paginate(this.autoRepo, paginationDto);
  }

  // Paginación con filtros avanzados específicos de autos
  async findWithAdvancedFilters(
    filters: AutoPaginationDto
  ): Promise<PaginatedResponseDto<Auto>> {
    const {
      page = 1,
      limit = 15,
      orderBy = 'createdAt',
      orderDirection = 'desc',
      fechaCreacionDesde,
      fechaCreacionHasta,
      ...restFilters
    } = filters;

    // Convertir fechas string a Date si están presentes
    const autoFilters: AutoFilters = {
      ...restFilters,
      fechaCreacionDesde: fechaCreacionDesde ? new Date(fechaCreacionDesde) : undefined,
      fechaCreacionHasta: fechaCreacionHasta ? new Date(fechaCreacionHasta) : undefined,
    };

    const result = await this.autoRepo.findWithAdvancedFilters(
      page,
      limit,
      autoFilters,
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

  async getMarcasDisponibles(): Promise<MarcasDisponiblesResponseDto> {
    const marcas = await this.autoRepo.getMarcasDisponibles();
    return new MarcasDisponiblesResponseDto(marcas);
  }
} 