import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { IUsuarioRepository } from '../../../usuarios/domain/usuario.repository';
import { AuthenticatedUser } from '../../domain/interfaces/authenticated-user.interface';

@Injectable()
export class ValidarUsuarioJwtUseCase {
  constructor(
    @Inject('IUsuarioRepository') private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(userId: string): Promise<AuthenticatedUser> {
    // Validación básica del ID
    if (!userId) {
      throw new UnauthorizedException('ID de usuario inválido');
    }

    // Verificar si el usuario existe y está activo
    const usuario = await this.usuarioRepository.obtenerPorId(userId);
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    // Validación adicional de estado activo (redundante pero explícita)
    if (!usuario.active) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Retornar solo los datos necesarios para la autenticación
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };
  }
} 