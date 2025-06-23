import { Controller, Get } from '@nestjs/common';
import { ObtenerFavoritosUseCase } from '../../application/use-cases/autos/obtener-favoritos.use-case';
import { AutoMapper } from '@autos/application/mappers/auto-to-http.mapper';
import { AutoResponseDTO } from '@autos/application/dtos/autos/crear/crear-auto-response.dto';

@Controller('publico/autos')
export class AutosPublicoController {
  constructor(
    private readonly obtenerFavoritosUseCase: ObtenerFavoritosUseCase,
  ) {}

  /**
   * Endpoint público para obtener los autos favoritos
   * Este endpoint es accesible sin autenticación para que los clientes
   * puedan ver el banner de autos destacados
   */
  @Get('favoritos')
  async obtenerFavoritos(): Promise<{
    message: string;
    total: number;
    favoritos: AutoResponseDTO[];
  }> {
    const favoritos = await this.obtenerFavoritosUseCase.execute();
    
    return {
      message: 'Autos destacados obtenidos exitosamente',
      total: favoritos.length,
      favoritos: favoritos.map(AutoMapper.toHttp),
    };
  }
} 