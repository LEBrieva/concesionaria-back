import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Patch, 
  Post, 
  Put, 
  UseGuards, 
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CrearAutoDTO } from '@autos/application/dtos/crear/crear-auto.dto';
import { CrearAutoUseCase } from '@autos/application/use-cases/autos/crear-auto.use-case';
import { AutoMapper } from '@autos/application/mappers/auto-to-http.mapper';
import { AutoResponseDTO } from '@autos/application/dtos/crear/crear-auto-response.dto';
import { ActualizarAutoDTO } from '@autos/application/dtos/actualizar/actualizar-auto.dto';
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
import { CambiarEstadoAutoDto, CambiarEstadoAutoResponseDto } from '../../application/dtos/cambio-estado/cambiar-estado-auto.dto';
import { GestionarFavoritoDto } from '../../application/dtos/favoritos/gestionar-favorito.dto';
import { AutoPaginationDto } from '../../application/dtos/pagination/auto-pagination.dto';
import { MarcasDisponiblesResponseDto } from '../../application/dtos/marcas/marcas-disponibles.dto';
import { PaginatedResponseDto } from '../../../shared/dtos/pagination.dto';
import { SubirImagenesAutoUseCase } from '../../application/use-cases/autos/subir-imagenes-auto.use-case';
import { EliminarImagenAutoUseCase } from '../../application/use-cases/autos/eliminar-imagen-auto.use-case';
import { 
  SubirImagenesResponseDto, 
  EliminarImagenDto 
} from '../../application/dtos/imagenes/imagenes-response.dto';

@Controller('autos')
@UseGuards(JwtAuthGuard)
export class AutoController {
  private readonly logger = new Logger(AutoController.name);

  constructor(
    private readonly crearAutoUseCase: CrearAutoUseCase,
    private readonly actualizarAutoUseCase: ActualizarAutoUseCase,
    private readonly eliminarAutoUseCase: EliminarAutoUseCase,
    private readonly restaurarAutoUseCase: RestaurarAutoUseCase,
    private readonly cambiarEstadoAutoUseCase: CambiarEstadoAutoUseCase,
    private readonly gestionarFavoritoUseCase: GestionarFavoritoUseCase,
    private readonly obtenerFavoritosUseCase: ObtenerFavoritosUseCase,
    private readonly autoQueryService: AutoQueryService,
    private readonly subirImagenesUseCase: SubirImagenesAutoUseCase,
    private readonly eliminarImagenUseCase: EliminarImagenAutoUseCase,
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

  // 📸 ENDPOINTS DE IMÁGENES

  /**
   * Subir imágenes para un auto específico
   * Las imágenes se organizan automáticamente en carpetas por matrícula
   */
  @Post(':id/imagenes')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  @UseInterceptors(FilesInterceptor('imagenes', 10, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB límite máximo absoluto (seguridad)
    },
    fileFilter: (req, file, callback) => {
      // Validar tipos de archivo permitidos
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return callback(
          new BadRequestException('Solo se permiten archivos de imagen (JPEG, PNG, WebP)'),
          false
        );
      }
      callback(null, true);
    },
  }))
  async subirImagenes(
    @Param('id', ParseUUIDPipe) autoId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SubirImagenesResponseDto> {
    this.logger.log(`Recibidas ${files?.length || 0} imágenes para auto ${autoId}`);
    
    // El exception filter maneja automáticamente cualquier error
    return await this.subirImagenesUseCase.execute(autoId, files, user.id);
  }

  /**
   * Eliminar una imagen específica de un auto
   * Solo requiere el nombre del archivo, el path se construye automáticamente
   */
  @Delete(':id/imagenes')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async eliminarImagen(
    @Param('id', ParseUUIDPipe) autoId: string,
    @Body() dto: EliminarImagenDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ mensaje: string }> {
    // El exception filter maneja automáticamente cualquier error
    return await this.eliminarImagenUseCase.execute(autoId, dto.fileName, user.id);
  }
}
