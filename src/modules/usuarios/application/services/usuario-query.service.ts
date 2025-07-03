import { Injectable, Inject } from '@nestjs/common';
import { Usuario } from '../../domain/usuario.entity';
import { IUsuarioRepository } from '../../domain/usuario.repository';
import { UsuarioFilters } from '../../domain/interfaces/usuario-filters.interface';
import { PaginationService } from '../../../shared/services/pagination.service';
import { UsuarioPaginationDto } from '../dtos/pagination/usuario-pagination.dto';
import { PaginatedResponseDto, BasePaginationDto } from '../../../shared/dtos/pagination.dto';

@Injectable()
export class UsuarioQueryService {
  constructor(
    @Inject('IUsuarioRepository') private readonly usuarioRepo: IUsuarioRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepo.findAll();
  }

  async findAllActive(): Promise<Usuario[]> {
    return this.usuarioRepo.findAllActive();
  }

  async findById(id: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOneById(id);
  }

  // Paginación básica (usando el servicio genérico)
  async findWithBasicPagination(
    paginationDto: BasePaginationDto
  ): Promise<PaginatedResponseDto<Usuario>> {
    return this.paginationService.paginate(this.usuarioRepo, paginationDto);
  }

  // Paginación con filtros avanzados específicos de usuarios
  async findWithAdvancedFilters(
    filters: UsuarioPaginationDto
  ): Promise<PaginatedResponseDto<Usuario>> {
    const {
      page = 1,
      limit = 15,
      orderBy = 'createdAt',
      orderDirection = 'desc',
      ...restFilters
    } = filters;

    // Convertir a UsuarioFilters
    const usuarioFilters: UsuarioFilters = {
      ...restFilters,
    };

    const result = await this.usuarioRepo.findWithAdvancedFilters(
      page,
      limit,
      usuarioFilters,
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