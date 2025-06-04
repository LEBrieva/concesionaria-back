import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { CrearAutoDTO } from '@autos/infrastructure/presentation/dtos/autos/crear/crear-auto.dto';
import { CrearAutoUseCase } from '@autos/application/use-cases/autos/crear-auto.use-case';
import { AutoMapper } from '@autos/application/mappers/auto-to-http.mapper';
import { AutoResponseDTO } from '@autos/infrastructure/presentation/dtos/autos/crear/crear-auto-response.dto';
import { ActualizarAutoDTO } from '@autos/infrastructure/presentation/dtos/autos/actualizar/actualizar-auto.dto';
import { ActualizarAutoUseCase } from '@autos/application/use-cases/autos/actualizar-auto.use-case';

@Controller('autos')
export class AutoController {
  constructor(
    private readonly crearAutoUseCase: CrearAutoUseCase,
    private readonly actualizarAutoUseCase: ActualizarAutoUseCase,
  ) {}

  @Post()
  async create(@Body() body: CrearAutoDTO): Promise<AutoResponseDTO> {
    return AutoMapper.toHttp(await this.crearAutoUseCase.execute(body));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: ActualizarAutoDTO,
  ): Promise<AutoResponseDTO> {
    return AutoMapper.toHttp(
      await this.actualizarAutoUseCase.execute(id, body),
    );
  }
}
