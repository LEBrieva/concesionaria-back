import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { CrearAutoDTO } from '@autos/application/dtos/autos/crear/crear-auto.dto';
import { CrearAutoUseCase } from '@autos/application/use-cases/autos/crear-auto.use-case';
import { AutoMapper } from '@autos/application/mappers/auto-to-http.mapper';
import { AutoResponseDTO } from '@autos/application/dtos/autos/crear/crear-auto-response.dto';
import { ActualizarAutoDTO } from '@autos/application/dtos/autos/actualizar/actualizar-auto.dto';
import { ActualizarAutoUseCase } from '@autos/application/use-cases/autos/actualizar-auto.use-case';
import { EliminarAutoUseCase } from '@autos/application/use-cases/autos/eliminar-auto.use-case';
import { RestaurarAutoUseCase } from '@autos/application/use-cases/autos/restaurar-auto.use-case';
import { CambiarEstadoAutoUseCase } from '../../application/use-cases/autos/cambiar-estado-auto.use-case';
import { AutoQueryService } from '@autos/application/services/auto-query.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../auth/domain/interfaces/authenticated-user.interface';
import { RolUsuario } from '../../../usuarios/domain/usuario.enum';
import { CambiarEstadoAutoDto, CambiarEstadoAutoResponseDto } from '../../application/dtos/autos/cambio-estado/cambiar-estado-auto.dto';

@Controller('autos')
@UseGuards(JwtAuthGuard)
export class AutoController {
  constructor(
    private readonly crearAutoUseCase: CrearAutoUseCase,
    private readonly actualizarAutoUseCase: ActualizarAutoUseCase,
    private readonly eliminarAutoUseCase: EliminarAutoUseCase,
    private readonly restaurarAutoUseCase: RestaurarAutoUseCase,
    private readonly cambiarEstadoAutoUseCase: CambiarEstadoAutoUseCase,
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

  // 🚀 NUEVOS ENDPOINTS QUE USAN MÉTODOS GENÉRICOS

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
}
