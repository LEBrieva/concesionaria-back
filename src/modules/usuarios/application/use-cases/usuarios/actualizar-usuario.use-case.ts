import { ActualizarUsuarioDto } from '../../dtos/usuarios/actualizar/actualizar-usuario.dto';
import { Usuario } from '../../../domain/usuario.entity';
import { UsuarioRepository } from '../../../domain/usuario.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PasswordService } from '../../../../shared/services/password.service';

@Injectable()
export class ActualizarUsuarioUseCase {
  constructor(
    private readonly usuarioRepo: UsuarioRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async ejecutar(id: string, dto: ActualizarUsuarioDto, userId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepo.obtenerPorId(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // Si se está actualizando la contraseña, encriptarla
    const updateData = { ...dto };
    if (dto.password) {
      updateData.password = await this.passwordService.hashPassword(dto.password);
    }

    const updatedUsuario = usuario.actualizarCon({ ...updateData, updatedBy: userId });
    await this.usuarioRepo.actualizar(id, updatedUsuario);

    return updatedUsuario;
  }
} 