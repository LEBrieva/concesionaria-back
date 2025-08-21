import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Put,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { RolUsuario } from '../../../usuarios/domain/usuario.enum';
import { ClientePaginationDto } from '../../application/dtos/pagination/cliente-pagination.dto';
import { PaginationService } from '../../../shared/services/pagination.service';
import { ClienteToHttpMapper } from '../../application/mappers/cliente-to-http.mapper';
import { ClienteHttpResponseSafe } from '../../application/interfaces/cliente-http.interface';

@Controller('admin/clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN)
export class ClientesAdminController {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
    private readonly paginationService: PaginationService,
  ) {}

  @Get()
  async listarClientes(@Query() paginationDto: ClientePaginationDto) {
    const {
      active,
      emailVerificado,
      suscritoNewsletter,
      aceptaMarketing,
      marcasInteres,
      tipoAutoInteres,
      ...filters
    } = paginationDto;

    const clientes = await this.clienteRepository.findByFilters({
      active,
      emailVerificado,
      suscritoNewsletter,
      aceptaMarketing,
      marcasInteres,
      tipoAutoInteres,
      ...filters,
    });

    // Por ahora retornamos sin paginación hasta implementar correctamente
    return {
      data: ClienteToHttpMapper.toHttpList(clientes),
      total: clientes.length,
      page: 1,
      limit: clientes.length,
      totalPages: 1,
    };
  }

  @Get(':id')
  async obtenerCliente(
    @Param('id') id: string,
  ): Promise<ClienteHttpResponseSafe> {
    const cliente = await this.clienteRepository.findById(id);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    return ClienteToHttpMapper.toHttpWithoutSensitive(cliente);
  }

  @Get(':id/actividad')
  async obtenerActividadCliente(@Param('id') id: string) {
    const cliente = await this.clienteRepository.findById(id);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    // TODO: Implementar obtención de actividad detallada del cliente
    // Por ahora solo retornamos los contadores
    return {
      ultimaActividad: cliente.ultimaActividad,
      totalVistasAutos: cliente.totalVistasAutos,
      totalClicksAutos: cliente.totalClicksAutos,
      totalConsultas: cliente.totalConsultas,
    };
  }

  @Put(':id/estado')
  async cambiarEstado(
    @Param('id') id: string,
    @Body() body: { active: boolean },
  ) {
    const cliente = await this.clienteRepository.findById(id);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    if (body.active) {
      await this.clienteRepository.restore(id);
      const clienteRestaurado = await this.clienteRepository.findById(id);
      return {
        message: 'Cliente activado exitosamente',
        cliente: clienteRestaurado
          ? ClienteToHttpMapper.toHttpWithoutSensitive(clienteRestaurado)
          : null,
      };
    } else {
      await this.clienteRepository.delete(id);
      return { message: 'Cliente desactivado exitosamente' };
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminarCliente(@Param('id') id: string) {
    await this.clienteRepository.delete(id);
  }
}
