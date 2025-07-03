import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUsuarioRepository } from '../../domain/usuario.repository';
import { HistorialService } from '../../../shared/services/historial.service';
import { TipoEntidad, TipoAccion } from '../../../shared/entities/historial.entity';

@Injectable()
export class RestaurarUsuarioUseCase {
  constructor(
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly historialService: HistorialService,
  ) {}

  async execute(id: string, usuarioRestauradorId: string, observaciones?: string): Promise<void> {
    // Verificar que el usuario existe
    const usuario = await this.usuarioRepository.findOneById(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que el usuario esté eliminado
    if (usuario.isActive()) {
      throw new BadRequestException('El usuario ya está activo');
    }

    // Restaurar el usuario
    await this.usuarioRepository.restore(id);

    // Registrar en historial
    await this.historialService.registrarRestauracion(
      id,
      TipoEntidad.USUARIO,
      usuarioRestauradorId,
      observaciones || `Usuario restaurado: ${usuario.nombre} ${usuario.apellido} - ${usuario.email}`,
      {
        usuarioNombre: usuario.nombre,
        usuarioApellido: usuario.apellido,
        usuarioEmail: usuario.email,
        usuarioTelefono: usuario.telefono,
        usuarioRol: usuario.rol,
        motivoRestauracion: observaciones || 'Sin motivo especificado',
        restauradoPor: usuarioRestauradorId,
        esAutoRestauracion: id === usuarioRestauradorId,
        fechaCreacion: usuario.createdAt,
        transicionEstado: 'eliminado → activo',
      }
    );
  }
} 