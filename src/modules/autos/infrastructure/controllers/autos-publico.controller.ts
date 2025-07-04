import { Controller, Get } from '@nestjs/common';
import { ObtenerFavoritosUseCase } from '../../application/use-cases/obtener-favoritos.use-case';
import { AutoMapper } from '@autos/application/mappers/auto-to-http.mapper';
import { AutoResponseDTO } from '@autos/application/dtos/crear/crear-auto-response.dto';
import { AutoQueryService } from '@autos/application/services/auto-query.service';

@Controller('publico/autos')
export class AutosPublicoController {
  constructor(
    private readonly obtenerFavoritosUseCase: ObtenerFavoritosUseCase,
    private readonly autoQueryService: AutoQueryService,
  ) {}

  /**
   * Endpoint público para obtener todos los autos activos
   * Los clientes pueden ver el catálogo completo sin autenticación
   * Solo muestra autos en estado DISPONIBLE (no eliminados, no por ingresar)
   */
  @Get()
  async obtenerAutosActivos(): Promise<{
    message: string;
    total: number;
    autos: AutoResponseDTO[];
  }> {
    const autos = await this.autoQueryService.findAllActive();
    
    return {
      message: 'Catálogo de autos obtenido exitosamente',
      total: autos.length,
      autos: autos.map(AutoMapper.toHttp),
    };
  }

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