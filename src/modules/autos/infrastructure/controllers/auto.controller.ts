import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards, Query } from '@nestjs/common';
import { CrearAutoDTO } from '@autos/application/dtos/autos/crear/crear-auto.dto';
import { CrearAutoUseCase } from '@autos/application/use-cases/autos/crear-auto.use-case';
import { AutoMapper } from '@autos/application/mappers/auto-to-http.mapper';
import { AutoResponseDTO } from '@autos/application/dtos/autos/crear/crear-auto-response.dto';
import { ActualizarAutoDTO } from '@autos/application/dtos/autos/actualizar/actualizar-auto.dto';
import { ActualizarAutoUseCase } from '@autos/application/use-cases/autos/actualizar-auto.use-case';
import { EliminarAutoUseCase } from '@autos/application/use-cases/autos/eliminar-auto.use-case';
import { RestaurarAutoUseCase } from '@autos/application/use-cases/autos/restaurar-auto.use-case';
import { CambiarEstadoAutoUseCase } from '../../application/use-cases/autos/cambiar-estado-auto.use-case';
import { GestionarFavoritoUseCase } from '../../application/use-cases/autos/gestionar-favorito.use-case';
import { ObtenerFavoritosUseCase } from '../../application/use-cases/autos/obtener-favoritos.use-case';
import { AutoQueryService } from '@autos/application/services/auto-query.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../auth/domain/interfaces/authenticated-user.interface';
import { RolUsuario } from '../../../usuarios/domain/usuario.enum';
import { CambiarEstadoAutoDto, CambiarEstadoAutoResponseDto } from '../../application/dtos/autos/cambio-estado/cambiar-estado-auto.dto';
import { GestionarFavoritoDto } from '../../application/dtos/autos/favoritos/gestionar-favorito.dto';
import { AutoPaginationDto } from '../../application/dtos/autos/pagination/auto-pagination.dto';
import { MarcasDisponiblesResponseDto } from '../../application/dtos/autos/marcas/marcas-disponibles.dto';
import { PaginatedResponseDto, BasePaginationDto } from '../../../shared/dtos/pagination.dto';

@Controller('autos')
@UseGuards(JwtAuthGuard)
export class AutoController {
  constructor(
    private readonly crearAutoUseCase: CrearAutoUseCase,
    private readonly actualizarAutoUseCase: ActualizarAutoUseCase,
    private readonly eliminarAutoUseCase: EliminarAutoUseCase,
    private readonly restaurarAutoUseCase: RestaurarAutoUseCase,
    private readonly cambiarEstadoAutoUseCase: CambiarEstadoAutoUseCase,
    private readonly gestionarFavoritoUseCase: GestionarFavoritoUseCase,
    private readonly obtenerFavoritosUseCase: ObtenerFavoritosUseCase,
    private readonly autoQueryService: AutoQueryService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async create(
    @Body() body: CrearAutoDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AutoResponseDTO> {
    return AutoMapper.toHttp(await this.crearAutoUseCase.execute(body, user.id));
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async update(
    @Param('id') id: string,
    @Body() body: ActualizarAutoDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AutoResponseDTO> {
    return AutoMapper.toHttp(
      await this.actualizarAutoUseCase.execute(id, body, user.id),
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async softDelete(
    @Param('id') id: string,
    @Body() body: { observaciones?: string } = {},
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.eliminarAutoUseCase.execute(id, user.id, body.observaciones);
    return { message: 'Auto eliminado correctamente' };
  }

  @Patch(':id/restaurar')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async restore(
    @Param('id') id: string,
    @Body() body: { observaciones?: string } = {},
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.restaurarAutoUseCase.execute(id, user.id, body.observaciones);
    return { message: 'Auto restaurado correctamente' };
  }

  @Patch(':id/cambiar-estado')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async cambiarEstado(
    @Param('id') id: string,
    @Body() body: CambiarEstadoAutoDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CambiarEstadoAutoResponseDto> {
    return await this.cambiarEstadoAutoUseCase.execute(id, body, user.id);
  }

  // 🌟 ENDPOINT DE FAVORITOS - SOLO ADMIN

  /**
   * Endpoint para gestionar favoritos desde el dashboard admin
   * Solo administradores pueden marcar/desmarcar autos como favoritos
   * Este endpoint será usado por la estrella en la interfaz del dashboard
   */
  @Patch(':id/favorito')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN) // Solo ADMIN puede gestionar favoritos
  async gestionarFavorito(
    @Param('id') id: string,
    @Body() body: GestionarFavoritoDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ 
    message: string; 
    esFavorito: boolean;
    totalFavoritos: number;
  }> {
    await this.gestionarFavoritoUseCase.execute(id, body, user.id);
    
    // Obtener el total actual de favoritos para la respuesta
    const totalFavoritos = await this.obtenerFavoritosUseCase.execute();
    
    return { 
      message: body.esFavorito 
        ? 'Auto marcado como favorito para el banner destacado' 
        : 'Auto removido del banner destacado',
      esFavorito: body.esFavorito,
      totalFavoritos: totalFavoritos.length
    };
  }

  /**
   * Endpoint para obtener favoritos (solo para admin)
   * Usado en el dashboard para mostrar qué autos están marcados como favoritos
   */
  @Get('favoritos')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async obtenerFavoritosAdmin(): Promise<{
    message: string;
    total: number;
    maxFavoritos: number;
    favoritos: AutoResponseDTO[];
  }> {
    const favoritos = await this.obtenerFavoritosUseCase.execute();
    return {
      message: 'Autos favoritos obtenidos exitosamente',
      total: favoritos.length,
      maxFavoritos: 6,
      favoritos: favoritos.map(AutoMapper.toHttp)
    };
  }

  // 🚀 ENDPOINTS GENERALES

  @Get()
  async findAll(): Promise<AutoResponseDTO[]> {
    const autos = await this.autoQueryService.findAll();
    return autos.map(AutoMapper.toHttp);
  }

  @Get('activos')
  async findAllActive(): Promise<AutoResponseDTO[]> {
    const autos = await this.autoQueryService.findAllActive();
    return autos.map(AutoMapper.toHttp);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<AutoResponseDTO> {
    const auto = await this.autoQueryService.findById(id);
    if (!auto) {
      throw new Error('Auto no encontrado');
    }
    return AutoMapper.toHttp(auto);
  }

  // 📊 NUEVOS ENDPOINTS DE PAGINACIÓN Y FILTROS
  /**
   * Endpoint para paginación con filtros avanzados específicos de autos
   * Usado por el dashboard administrativo
   */
  @Get('paginated/advanced')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async findWithAdvancedFilters(
    @Query() filters: AutoPaginationDto
  ): Promise<PaginatedResponseDto<AutoResponseDTO>> {
    const result = await this.autoQueryService.findWithAdvancedFilters(filters);
    
    return new PaginatedResponseDto(
      result.data.map(AutoMapper.toHttp),
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total
    );
  }

  /**
   * Endpoint para obtener marcas disponibles
   * Usado para llenar dropdowns de filtros
   */
  @Get('marcas/disponibles')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async getMarcasDisponibles(): Promise<MarcasDisponiblesResponseDto> {
    return this.autoQueryService.getMarcasDisponibles();
  }
}
