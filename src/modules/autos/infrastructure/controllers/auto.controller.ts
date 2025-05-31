import { Body, Controller, Post } from '@nestjs/common';
import { CrearAutoDTO } from '@autos/application/dtos/autos/crear/crear-auto.dto';
import { CrearAutoUseCase } from '@autos/application/use-cases/autos/crear-auto.use-case';
import { AutoMapper } from '@autos/application/mappers/auto-to-http.mapper';
import { AutoResponseDTO } from '@autos/application/dtos/autos/crear/crear-auto-response.dto';

@Controller('autos')
export class AutoController {
  constructor(private readonly crearAutoUseCase: CrearAutoUseCase) {}

  @Post()
  async create(@Body() body: CrearAutoDTO): Promise<AutoResponseDTO> {
    return AutoMapper.toHttp(await this.crearAutoUseCase.execute(body));
  }
}
