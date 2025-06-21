import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Usuario } from 'src/modules/usuarios/domain/usuario.entity';
import { UsuarioRepository } from 'src/modules/usuarios/domain/usuario.repository';
import { ActualizarPasswordDto } from '../../dtos/usuarios/actualizar/actualizar-password.dto';
import { PasswordService } from 'src/modules/shared/services/password.service';

@Injectable()
export class ActualizarPasswordUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async ejecutar(usuarioId: string, dto: ActualizarPasswordDto, updatedBy: string): Promise<Usuario> {
    // Obtener el usuario
    const usuario = await this.usuarioRepository.obtenerPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar la contraseña actual
    const isCurrentPasswordValid = await this.passwordService.verifyPassword(
      dto.currentPassword,
      usuario.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await this.passwordService.hashPassword(dto.newPassword);

    // Actualizar el usuario con la nueva contraseña
    const usuarioActualizado = usuario.actualizarCon({
      password: hashedNewPassword,
      updatedBy: updatedBy,
    });

    return await this.usuarioRepository.actualizar(usuarioId, usuarioActualizado);
  }
} 