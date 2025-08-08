import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { ActualizarPerfilDto } from '../dtos/perfil/actualizar-perfil.dto';
import { Cliente } from '../../domain/cliente.entity';

@Injectable()
export class ActualizarPerfilUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(clienteId: string, dto: ActualizarPerfilDto): Promise<Cliente> {
    // Buscar cliente existente
    const cliente = await this.clienteRepository.findById(clienteId);

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!cliente.active) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Validar rangos de presupuesto
    const presupuestoMin =
      dto.rangoPresupuestoMin ?? cliente.rangoPresupuestoMin;
    const presupuestoMax =
      dto.rangoPresupuestoMax ?? cliente.rangoPresupuestoMax;

    if (presupuestoMin && presupuestoMax && presupuestoMax < presupuestoMin) {
      throw new BadRequestException(
        'El presupuesto máximo debe ser mayor al mínimo',
      );
    }

    // Actualizar campos si se proporcionan
    if (dto.nombre !== undefined) {
      cliente.nombre = dto.nombre;
    }

    if (dto.apellido !== undefined) {
      cliente.apellido = dto.apellido;
    }

    if (dto.telefono !== undefined) {
      cliente.telefono = dto.telefono;
    }

    if (dto.fechaNacimiento !== undefined) {
      cliente.fechaNacimiento = new Date(dto.fechaNacimiento);
    }

    if (dto.rangoPresupuestoMin !== undefined) {
      cliente.rangoPresupuestoMin = dto.rangoPresupuestoMin;
    }

    if (dto.rangoPresupuestoMax !== undefined) {
      cliente.rangoPresupuestoMax = dto.rangoPresupuestoMax;
    }

    if (dto.marcasInteres !== undefined) {
      cliente.marcasInteres = dto.marcasInteres;
    }

    if (dto.tipoAutoInteres !== undefined) {
      cliente.tipoAutoInteres = dto.tipoAutoInteres;
    }

    if (dto.suscritoNewsletter !== undefined) {
      cliente.suscritoNewsletter = dto.suscritoNewsletter;
    }

    if (dto.aceptaMarketing !== undefined) {
      cliente.aceptaMarketing = dto.aceptaMarketing;
    }

    if (dto.preferenciaContacto !== undefined) {
      cliente.preferenciaContacto = dto.preferenciaContacto;
    }

    // Actualizar última actividad
    cliente.actualizarUltimaActividad();

    // Guardar cambios
    return await this.clienteRepository.update(clienteId, cliente);
  }
}
