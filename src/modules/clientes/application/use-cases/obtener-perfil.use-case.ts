import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { Cliente } from '../../domain/cliente.entity';

@Injectable()
export class ObtenerPerfilUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(clienteId: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findById(clienteId);

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!cliente.active) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Actualizar última actividad
    await this.clienteRepository.actualizarUltimaActividad(clienteId);

    return cliente;
  }
}
