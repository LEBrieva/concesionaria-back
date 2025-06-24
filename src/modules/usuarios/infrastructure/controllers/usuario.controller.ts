import { Body, Controller, Delete, Get, Patch, Post, Put, Param, UseGuards, Query } from '@nestjs/common';
import { CrearUsuarioDto } from '../../application/dtos/usuarios/crear/crear-usuario.dto';
import { CrearUsuarioResponseDto } from '../../application/dtos/usuarios/crear/crear-usuario-response.dto';
import { ActualizarPasswordDto } from '../../application/dtos/usuarios/actualizar/actualizar-password.dto';
import { ActualizarUsuarioDto } from '../../application/dtos/usuarios/actualizar/actualizar-usuario.dto';
import { CrearUsuarioUseCase } from '../../application/use-cases/usuarios/crear-usuario.use-case';
import { ActualizarPasswordUseCase } from '../../application/use-cases/usuarios/actualizar-password.use-case';
import { ActualizarUsuarioUseCase } from '../../application/use-cases/usuarios/actualizar-usuario.use-case';
import { EliminarUsuarioUseCase } from '../../application/use-cases/usuarios/eliminar-usuario.use-case';
import { RestaurarUsuarioUseCase } from '../../application/use-cases/usuarios/restaurar-usuario.use-case';
import { UsuarioQueryService } from '../../application/services/usuario-query.service';
import { UsuarioToHttpMapper } from '../../application/mappers/usuario-to-http.mapper';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../auth/domain/interfaces/authenticated-user.interface';
import { RolUsuario } from '../../domain/usuario.enum';
import { UsuarioPaginationDto } from '../../application/dtos/usuarios/pagination/usuario-pagination.dto';
import { PaginatedResponseDto, BasePaginationDto } from '../../../shared/dtos/pagination.dto';

@Controller('usuarios')
export class UsuarioController {
  constructor(
    private readonly crearUsuarioUseCase: CrearUsuarioUseCase,
    private readonly actualizarPasswordUseCase: ActualizarPasswordUseCase,
    private readonly actualizarUsuarioUseCase: ActualizarUsuarioUseCase,
    private readonly eliminarUsuarioUseCase: EliminarUsuarioUseCase,
    private readonly restaurarUsuarioUseCase: RestaurarUsuarioUseCase,
    private readonly usuarioQueryService: UsuarioQueryService,
  ) {}

  // Endpoint público para registro de clientes (sin autenticación)
  @Post()
  async crear(@Body() dto: CrearUsuarioDto): Promise<CrearUsuarioResponseDto> {
    const usuario = await this.crearUsuarioUseCase.execute(dto);
    return UsuarioToHttpMapper.toCrearUsuarioResponse(usuario);
  }

  // Endpoint protegido para que solo ADMIN y VENDEDOR creen usuarios
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR) // Solo ADMIN y VENDEDOR
  @Post('admin')
  async crearConRoles(
    @Body() dto: CrearUsuarioDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CrearUsuarioResponseDto> {
    const usuario = await this.crearUsuarioUseCase.execute(dto, user);
    return UsuarioToHttpMapper.toCrearUsuarioResponse(usuario);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR) // Solo ADMIN y VENDEDOR pueden cambiar contraseñas de otros
  @Put(':id/password')
  async actualizarPassword(
    @Param('id') id: string,
    @Body() dto: ActualizarPasswordDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.actualizarPasswordUseCase.execute(id, dto, user.id);
    return { message: 'Contraseña actualizada exitosamente' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR) // Solo ADMIN y VENDEDOR pueden actualizar otros usuarios
  @Put(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarUsuarioDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CrearUsuarioResponseDto> {
    const usuario = await this.actualizarUsuarioUseCase.execute(id, dto, user.id);
    return UsuarioToHttpMapper.toCrearUsuarioResponse(usuario);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN) // Solo ADMIN puede eliminar usuarios
  @Delete(':id')
  async softDelete(
    @Param('id') id: string,
    @Body() body: { observaciones?: string },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.eliminarUsuarioUseCase.execute(id, user.id, body.observaciones);
    return { message: 'Usuario eliminado correctamente' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN) // Solo ADMIN puede restaurar usuarios
  @Patch(':id/restaurar')
  async restore(
    @Param('id') id: string,
    @Body() body: { observaciones?: string },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.restaurarUsuarioUseCase.execute(id, user.id, body.observaciones);
    return { message: 'Usuario restaurado correctamente' };
  }

  // 🚀 NUEVOS ENDPOINTS QUE USAN MÉTODOS GENÉRICOS

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  @Get()
  async findAll(): Promise<CrearUsuarioResponseDto[]> {
    const usuarios = await this.usuarioQueryService.findAll();
    return usuarios.map(UsuarioToHttpMapper.toCrearUsuarioResponse);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  @Get('activos')
  async findAllActive(): Promise<CrearUsuarioResponseDto[]> {
    const usuarios = await this.usuarioQueryService.findAllActive();
    return usuarios.map(UsuarioToHttpMapper.toCrearUsuarioResponse);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  @Get(':id')
  async findById(@Param('id') id: string): Promise<CrearUsuarioResponseDto> {
    const usuario = await this.usuarioQueryService.findById(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
    return UsuarioToHttpMapper.toCrearUsuarioResponse(usuario);
  }

  // 📊 NUEVOS ENDPOINTS DE PAGINACIÓN Y FILTROS

  /**
   * Endpoint para paginación básica de usuarios (sin filtros específicos)
   * Usa el sistema genérico de paginación
   */
  @Get('paginated/basic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async findWithBasicPagination(
    @Query() paginationDto: BasePaginationDto
  ): Promise<PaginatedResponseDto<CrearUsuarioResponseDto>> {
    const result = await this.usuarioQueryService.findWithBasicPagination(paginationDto);
    
    return new PaginatedResponseDto(
      result.data.map(UsuarioToHttpMapper.toCrearUsuarioResponse),
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total
    );
  }

  /**
   * Endpoint para paginación con filtros avanzados específicos de usuarios
   * Usado por el dashboard administrativo
   */
  @Get('paginated/advanced')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async findWithAdvancedFilters(
    @Query() filters: UsuarioPaginationDto
  ): Promise<PaginatedResponseDto<CrearUsuarioResponseDto>> {
    const result = await this.usuarioQueryService.findWithAdvancedFilters(filters);
    
    return new PaginatedResponseDto(
      result.data.map(UsuarioToHttpMapper.toCrearUsuarioResponse),
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total
    );
  }
} 