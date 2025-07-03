import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUsuarioRepository } from '../../domain/usuario.repository';
import { HistorialService } from '../../../shared/services/historial.service';
import { TipoEntidad, TipoAccion } from '../../../shared/entities/historial.entity';

@Injectable()
export class EliminarUsuarioUseCase {
  constructor(
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly historialService: HistorialService,
  ) {}

  async execute(id: string, usuarioEliminadorId: string, observaciones?: string): Promise<void> {
    // Verificar que el usuario existe
    const usuario = await this.usuarioRepository.findOneById(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que el usuario no esté ya eliminado
    if (usuario.isDeleted()) {
      throw new BadRequestException('El usuario ya está eliminado');
    }

    // Realizar eliminación lógica
    await this.usuarioRepository.softDelete(id);

    // Registrar en historial
    await this.historialService.registrarEliminacion(
      id,
      TipoEntidad.USUARIO,
      usuarioEliminadorId,
      observaciones || `Usuario eliminado: ${usuario.nombre} ${usuario.apellido} - ${usuario.email}`,
      {
        usuarioNombre: usuario.nombre,
        usuarioApellido: usuario.apellido,
        usuarioEmail: usuario.email,
        usuarioTelefono: usuario.telefono,
        usuarioRol: usuario.rol,
        motivoEliminacion: observaciones || 'Sin motivo especificado',
        eliminadoPor: usuarioEliminadorId,
        esAutoEliminacion: id === usuarioEliminadorId,
        fechaCreacion: usuario.createdAt,
      }
    );
  }
} 