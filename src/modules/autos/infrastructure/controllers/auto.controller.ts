import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CrearAutoDTO } from '@autos/application/dtos/autos/crear/crear-auto.dto';
import { CrearAutoUseCase } from '@autos/application/use-cases/autos/crear-auto.use-case';
import { AutoMapper } from '@autos/application/mappers/auto-to-http.mapper';
import { AutoResponseDTO } from '@autos/application/dtos/autos/crear/crear-auto-response.dto';
import { ActualizarAutoDTO } from '@autos/application/dtos/autos/actualizar/actualizar-auto.dto';
import { ActualizarAutoUseCase } from '@autos/application/use-cases/autos/actualizar-auto.use-case';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../auth/domain/interfaces/authenticated-user.interface';
import { RolUsuario } from '../../../usuarios/domain/usuario.enum';

@Controller('autos')
@UseGuards(JwtAuthGuard)
export class AutoController {
  constructor(
    private readonly crearAutoUseCase: CrearAutoUseCase,
    private readonly actualizarAutoUseCase: ActualizarAutoUseCase,
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
}
