import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';

@Injectable()
export class VerificarEmailUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Token de verificación requerido');
    }

    // Buscar cliente por token
    const clientes = await this.clienteRepository.findByFilters({
      tokenVerificacion: token,
    });

    if (!clientes || clientes.length === 0) {
      throw new BadRequestException(
        'Token de verificación inválido o expirado',
      );
    }

    const cliente = clientes[0];

    if (cliente.emailVerificado) {
      return { message: 'El email ya ha sido verificado anteriormente' };
    }

    // Verificar email
    const verificado = await this.clienteRepository.verificarEmail(
      cliente.id,
      token,
    );

    if (!verificado) {
      throw new BadRequestException('No se pudo verificar el email');
    }

    return { message: 'Email verificado exitosamente' };
  }
}
