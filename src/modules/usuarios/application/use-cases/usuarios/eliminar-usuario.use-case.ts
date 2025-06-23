import { Injectable, Inject } from '@nestjs/common';
import { IUsuarioRepository } from '../../../domain/usuario.repository';

@Injectable()
export class EliminarUsuarioUseCase {
  constructor(
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository
  ) {}

  async execute(id: string): Promise<void> {
    // Verificar que el usuario existe
    const usuario = await this.usuarioRepository.findOneById(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el usuario no esté ya eliminado
    if (usuario.isDeleted()) {
      throw new Error('El usuario ya está eliminado');
    }

    // Realizar eliminación lógica
    await this.usuarioRepository.softDelete(id);
  }
} 