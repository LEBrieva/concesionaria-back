import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { ObtenerPerfilUseCase } from '../../application/use-cases/obtener-perfil.use-case';
import { ActualizarPerfilUseCase } from '../../application/use-cases/actualizar-perfil.use-case';
import { CambiarPasswordUseCase } from '../../application/use-cases/cambiar-password.use-case';
import { ActualizarPerfilDto } from '../../application/dtos/perfil/actualizar-perfil.dto';
import { CambiarPasswordDto } from '../../application/dtos/perfil/cambiar-password.dto';
import { ClienteToHttpMapper } from '../../application/mappers/cliente-to-http.mapper';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(
    private readonly obtenerPerfilUseCase: ObtenerPerfilUseCase,
    private readonly actualizarPerfilUseCase: ActualizarPerfilUseCase,
    private readonly cambiarPasswordUseCase: CambiarPasswordUseCase,
  ) {}

  @Get('perfil')
  async obtenerPerfil(@Request() req: any) {
    const clienteId = req.user.sub;
    const cliente = await this.obtenerPerfilUseCase.execute(clienteId);
    return ClienteToHttpMapper.toHttpWithoutSensitive(cliente);
  }

  @Put('perfil')
  async actualizarPerfil(
    @Request() req: any,
    @Body() dto: ActualizarPerfilDto,
  ) {
    const clienteId = req.user.sub;
    const cliente = await this.actualizarPerfilUseCase.execute(clienteId, dto);
    return ClienteToHttpMapper.toHttpWithoutSensitive(cliente);
  }

  @Put('cambiar-password')
  async cambiarPassword(@Request() req: any, @Body() dto: CambiarPasswordDto) {
    const clienteId = req.user.sub;
    return await this.cambiarPasswordUseCase.execute(clienteId, dto);
  }

  @Delete('perfil')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminarCuenta(@Request() req: any) {
    const clienteId = req.user.sub;
    // TODO: Implementar caso de uso para eliminar cuenta
    // Por ahora solo desactivamos la cuenta
    return { message: 'Función no implementada aún' };
  }
}
