import { ActualizarUsuarioDto } from '../dtos/actualizar/actualizar-usuario.dto';
import { Usuario } from '../../domain/usuario.entity';
import { IUsuarioRepository } from '../../domain/usuario.repository';
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PasswordService } from '../../../shared/services/password.service';
import { HistorialService } from '../../../shared/services/historial.service';
import { TipoEntidad, TipoAccion } from '../../../shared/entities/historial.entity';

@Injectable()
export class ActualizarUsuarioUseCase {
  constructor(
    @Inject('IUsuarioRepository') private readonly usuarioRepo: IUsuarioRepository,
    private readonly passwordService: PasswordService,
    private readonly historialService: HistorialService,
  ) {}

  async execute(id: string, dto: ActualizarUsuarioDto, userId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findOneById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // Detectar cambios antes de actualizar
    const cambios = await this.detectarCambios(usuario, dto);

    // Si se está actualizando la contraseña, encriptarla
    const updateData = { ...dto };
    if (dto.password) {
      updateData.password = await this.passwordService.hashPassword(dto.password);
    }

    const updatedUsuario = usuario.actualizarCon({ ...updateData, updatedBy: userId });
    await this.usuarioRepo.actualizar(id, updatedUsuario);

    // Registrar cada cambio en el historial
    await this.registrarCambiosEnHistorial(id, cambios, userId, usuario);

    return updatedUsuario;
  }

  private async detectarCambios(usuarioActual: Usuario, dto: ActualizarUsuarioDto): Promise<Array<{
    campo: string;
    valorAnterior: any;
    valorNuevo: any;
  }>> {
    const cambios: Array<{ campo: string; valorAnterior: any; valorNuevo: any }> = [];

    // Lista de campos que pueden cambiar
    const camposAComparar = ['nombre', 'apellido', 'telefono', 'rol'];

    camposAComparar.forEach(campo => {
      if (dto[campo] !== undefined) {
        const valorActual = usuarioActual[campo];
        const valorNuevo = dto[campo];

        if (valorActual !== valorNuevo) {
          cambios.push({
            campo,
            valorAnterior: valorActual,
            valorNuevo: valorNuevo,
          });
        }
      }
    });

    // Manejo especial para la contraseña
    if (dto.password !== undefined) {
      cambios.push({
        campo: 'password',
        valorAnterior: '[PROTEGIDO]',
        valorNuevo: '[ACTUALIZADO]',
      });
    }

    return cambios;
  }

  private async registrarCambiosEnHistorial(
    usuarioId: string,
    cambios: Array<{ campo: string; valorAnterior: any; valorNuevo: any }>,
    usuarioActualizadorId: string,
    usuarioOriginal: Usuario
  ): Promise<void> {
    // Si no hay cambios, no registrar nada
    if (cambios.length === 0) return;

    // Registrar todos los cambios en paralelo para mejor performance
    const promesasHistorial = cambios.map(cambio =>
      this.historialService.registrarCambio({
        entidadId: usuarioId,
        tipoEntidad: TipoEntidad.USUARIO,
        tipoAccion: TipoAccion.ACTUALIZAR,
        campoAfectado: cambio.campo,
        valorAnterior: this.formatearValor(cambio.valorAnterior),
        valorNuevo: this.formatearValor(cambio.valorNuevo),
        observaciones: `Campo '${cambio.campo}' actualizado`,
        usuarioId: usuarioActualizadorId,
        metadata: {
          usuarioNombre: usuarioOriginal.nombre,
          usuarioApellido: usuarioOriginal.apellido,
          usuarioEmail: usuarioOriginal.email,
          usuarioRol: usuarioOriginal.rol,
          tipoActualizacion: 'campo_individual',
          campo: cambio.campo,
          esAutoActualizacion: usuarioId === usuarioActualizadorId,
        },
      })
    );

    await Promise.all(promesasHistorial);
  }

  private formatearValor(valor: any): string {
    if (valor === null || valor === undefined) return 'null';
    if (typeof valor === 'object') return JSON.stringify(valor);
    return String(valor);
  }
} 