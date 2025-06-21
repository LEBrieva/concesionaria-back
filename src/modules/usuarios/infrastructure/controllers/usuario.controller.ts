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
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../auth/domain/interfaces/authenticated-user.interface';

@Controller('usuarios')
export class UsuarioController {
  constructor(
    private readonly crearUsuarioUseCase: CrearUsuarioUseCase,
    private readonly actualizarPasswordUseCase: ActualizarPasswordUseCase,
    private readonly actualizarUsuarioUseCase: ActualizarUsuarioUseCase,
  ) {}

  @Post()
  async crear(@Body() dto: CrearUsuarioDto): Promise<CrearUsuarioResponseDto> {
    const usuario = await this.crearUsuarioUseCase.ejecutar(dto);
    return UsuarioToHttpMapper.toCrearUsuarioResponse(usuario);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/password')
  async actualizarPassword(
    @Param('id') id: string,
    @Body() dto: ActualizarPasswordDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.actualizarPasswordUseCase.ejecutar(id, dto, user.id);
    return { message: 'Contraseña actualizada exitosamente' };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarUsuarioDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CrearUsuarioResponseDto> {
    const usuario = await this.actualizarUsuarioUseCase.ejecutar(id, dto, user.id);
    return UsuarioToHttpMapper.toCrearUsuarioResponse(usuario);
  }
} 