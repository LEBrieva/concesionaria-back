import { Body, Controller, Post } from '@nestjs/common';
import { CrearUsuarioDto } from '../../application/dtos/usuarios/crear/crear-usuario.dto';
import { CrearUsuarioResponseDto } from '../../application/dtos/usuarios/crear/crear-usuario-response.dto';
import { CrearUsuarioUseCase } from '../../application/use-cases/usuarios/crear-usuario.use-case';
import { UsuarioToHttpMapper } from '../../application/mappers/usuario-to-http.mapper';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly crearUsuarioUseCase: CrearUsuarioUseCase) {}

  @Post()
  async crear(@Body() dto: CrearUsuarioDto): Promise<CrearUsuarioResponseDto> {
    const usuario = await this.crearUsuarioUseCase.ejecutar(dto);
    return UsuarioToHttpMapper.toCrearUsuarioResponse(usuario);
  }
} 