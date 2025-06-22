import { Body, Controller, Post, Put, Param, UseGuards } from '@nestjs/common';
import { CrearUsuarioDto } from '../../application/dtos/usuarios/crear/crear-usuario.dto';
import { CrearUsuarioResponseDto } from '../../application/dtos/usuarios/crear/crear-usuario-response.dto';
import { ActualizarPasswordDto } from '../../application/dtos/usuarios/actualizar/actualizar-password.dto';
import { ActualizarUsuarioDto } from '../../application/dtos/usuarios/actualizar/actualizar-usuario.dto';
import { CrearUsuarioUseCase } from '../../application/use-cases/usuarios/crear-usuario.use-case';
import { ActualizarPasswordUseCase } from '../../application/use-cases/usuarios/actualizar-password.use-case';
import { ActualizarUsuarioUseCase } from '../../application/use-cases/usuarios/actualizar-usuario.use-case';
import { UsuarioToHttpMapper } from '../../application/mappers/usuario-to-http.mapper';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../auth/domain/interfaces/authenticated-user.interface';
import { RolUsuario } from '../../domain/usuario.enum';

@Controller('usuarios')
export class UsuarioController {
  constructor(
    private readonly crearUsuarioUseCase: CrearUsuarioUseCase,
    private readonly actualizarPasswordUseCase: ActualizarPasswordUseCase,
    private readonly actualizarUsuarioUseCase: ActualizarUsuarioUseCase,
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
} 