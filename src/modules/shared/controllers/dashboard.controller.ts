import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MultiEntityService, EntitySummary } from '../services/multi-entity.service';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { RolUsuario } from '../../usuarios/domain/usuario.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
export class DashboardController {
  constructor(private readonly multiEntityService: MultiEntityService) {}

  /**
   * Endpoint que muestra un resumen del sistema usando métodos genéricos
   */
  @Get('summary')
  async getSystemSummary(): Promise<{
    summary: EntitySummary[];
    totalEntities: number;
    totalActive: number;
  }> {
    const summary = await this.multiEntityService.getSystemSummary();
    
    const totalEntities = summary.reduce((acc, item) => acc + item.total, 0);
    const totalActive = summary.reduce((acc, item) => acc + item.active, 0);

    return {
      summary,
      totalEntities,
      totalActive,
    };
  }

  /**
   * Endpoint genérico para obtener entidades activas por tipo
   */
  @Get('entities/:type/active')
  async getActiveEntitiesByType(@Param('type') type: 'auto' | 'usuario') {
    const entities = await this.multiEntityService.getAllActiveByType(type);
    
    return {
      entityType: type,
      count: entities.length,
      data: entities,
    };
  }

  /**
   * Endpoint genérico para buscar por ID en cualquier entidad
   */
  @Get('entities/:type/:id')
  async findEntityById(
    @Param('type') type: 'auto' | 'usuario',
    @Param('id') id: string
  ) {
    const entity = await this.multiEntityService.findEntityById(type, id);
    
    if (!entity) {
      return {
        found: false,
        message: `${type} con ID ${id} no encontrado`,
      };
    }

    return {
      found: true,
      entityType: type,
      data: entity,
    };
  }
} 