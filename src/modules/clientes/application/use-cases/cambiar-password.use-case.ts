import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { PasswordService } from '../../../shared/services/password.service';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { CambiarPasswordDto } from '../dtos/perfil/cambiar-password.dto';

@Injectable()
export class CambiarPasswordUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(
    clienteId: string,
    dto: CambiarPasswordDto,
  ): Promise<{ message: string }> {
    // Buscar cliente
    const cliente = await this.clienteRepository.findById(clienteId);

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!cliente.active) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!cliente.password) {
      throw new UnauthorizedException(
        'Este cliente no tiene contraseña configurada',
      );
    }

    // Verificar contraseña actual
    const passwordValida = await this.passwordService.verifyPassword(
      dto.passwordActual,
      cliente.password,
    );

    if (!passwordValida) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await this.passwordService.hashPassword(
      dto.passwordNueva,
    );

    // Actualizar contraseña
    cliente.password = hashedPassword;
    cliente.actualizarUltimaActividad();

    await this.clienteRepository.update(clienteId, cliente);

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
