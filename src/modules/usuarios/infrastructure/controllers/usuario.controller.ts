import { Body, Controller, Post, Put, Param } from '@nestjs/common';
import { CrearUsuarioDto } from '../../application/dtos/usuarios/crear/crear-usuario.dto';
import { CrearUsuarioResponseDto } from '../../application/dtos/usuarios/crear/crear-usuario-response.dto';
import { ActualizarPasswordDto } from '../../application/dtos/usuarios/actualizar/actualizar-password.dto';
import { CrearUsuarioUseCase } from '../../application/use-cases/usuarios/crear-usuario.use-case';
import { ActualizarPasswordUseCase } from '../../application/use-cases/usuarios/actualizar-password.use-case';
import { UsuarioToHttpMapper } from '../../application/mappers/usuario-to-http.mapper';

@Controller('usuarios')
export class UsuarioController {
  constructor(
    private readonly crearUsuarioUseCase: CrearUsuarioUseCase,
    private readonly actualizarPasswordUseCase: ActualizarPasswordUseCase,
  ) {}

  @Post()
  async crear(@Body() dto: CrearUsuarioDto): Promise<CrearUsuarioResponseDto> {
    const usuario = await this.crearUsuarioUseCase.ejecutar(dto);
    return UsuarioToHttpMapper.toCrearUsuarioResponse(usuario);
  }

  @Put(':id/password')
  async actualizarPassword(
    @Param('id') id: string,
    @Body() dto: ActualizarPasswordDto,
  ): Promise<{ message: string }> {
    await this.actualizarPasswordUseCase.ejecutar(id, dto);
    return { message: 'Contraseña actualizada exitosamente' };
  }
} 