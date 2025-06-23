import { Injectable } from '@nestjs/common';
import { IUsuarioRepository } from '../../../domain/usuario.repository';

@Injectable()
export class RestaurarUsuarioUseCase {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar que el usuario existe
    const usuario = await this.usuarioRepository.findOneById(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el usuario esté eliminado
    if (usuario.isActive()) {
      throw new Error('El usuario ya está activo');
    }

    // Restaurar el usuario
    await this.usuarioRepository.restore(id);
  }
} 