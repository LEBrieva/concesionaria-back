import { Injectable, ConflictException, ForbiddenException, Inject } from '@nestjs/common';
import { Usuario } from '../../domain/usuario.entity';
import { IUsuarioRepository } from '../../domain/usuario.repository';
import { CrearUsuarioDto } from '../dtos/crear-usuario.dto';
import { PasswordService } from '../../../shared/services/password.service';
import { RolUsuario } from '../../domain/usuario.enum';
import { AuthenticatedUser } from 'src/modules/auth/domain/interfaces/authenticated-user.interface';
import { randomUUID } from 'crypto';
import { HistorialService } from '@shared/services/historial.service';
import { TipoEntidad } from '@shared/entities/historial.entity';

@Injectable()
export class CrearUsuarioUseCase {
  constructor(
    @Inject('IUsuarioRepository') private readonly usuarioRepository: IUsuarioRepository,
    private readonly passwordService: PasswordService,
    private readonly historialService: HistorialService,
  ) {}

  async execute(dto: CrearUsuarioDto, usuarioAutenticado?: AuthenticatedUser): Promise<Usuario> {
    // Verificar si ya existe un usuario con el mismo email
    const usuarioExistente = await this.usuarioRepository.obtenerPorEmail(dto.email);
    if (usuarioExistente) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Validar permisos para crear usuarios con ciertos roles
    this.validarPermisosCreacion(dto.rol, usuarioAutenticado);

    // Hashear la contraseña
    const hashedPassword = await this.passwordService.hashPassword(dto.password);

    const usuario = new Usuario({
      id: randomUUID(), // Generar UUID v4
      nombre: dto.nombre,
      apellido: dto.apellido,
      email: dto.email,
      password: hashedPassword,
      telefono: dto.telefono,
      rol: dto.rol || RolUsuario.CLIENTE,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: usuarioAutenticado?.id || 'system',
      updatedBy: usuarioAutenticado?.id || 'system',
      active: true,
    });

    // Crear el usuario
    const usuarioCreado = await this.usuarioRepository.crear(usuario);

    // Registrar en historial
    await this.historialService.registrarCreacion(
      usuarioCreado.id,
      TipoEntidad.USUARIO,
      usuarioAutenticado?.id || 'system',
      {
        nombre: usuarioCreado.nombre,
        apellido: usuarioCreado.apellido,
        email: usuarioCreado.email,
        telefono: usuarioCreado.telefono,
        rol: usuarioCreado.rol,
        creadoPor: usuarioAutenticado ? `${usuarioAutenticado.nombre} (${usuarioAutenticado.rol})` : 'Sistema',
        tipoCreacion: usuarioAutenticado ? 'admin_creation' : 'self_registration',
        observaciones: `Usuario creado: ${usuarioCreado.nombre} ${usuarioCreado.apellido} - ${usuarioCreado.email}`,
      }
    );

    return usuarioCreado;
  }

  private validarPermisosCreacion(rolSolicitado?: RolUsuario, usuarioAutenticado?: AuthenticatedUser): void {
    // Si no hay usuario autenticado, solo puede crear CLIENTE
    if (!usuarioAutenticado) {
      if (rolSolicitado && rolSolicitado !== RolUsuario.CLIENTE) {
        throw new ForbiddenException('Solo se pueden crear usuarios con rol CLIENTE sin autenticación');
      }
      return;
    }

    // Si el usuario autenticado es ADMIN, puede crear cualquier rol
    if (usuarioAutenticado.rol === RolUsuario.ADMIN) {
      return;
    }

    // Si el usuario autenticado es VENDEDOR, solo puede crear CLIENTE
    if (usuarioAutenticado.rol === RolUsuario.VENDEDOR) {
      if (rolSolicitado && rolSolicitado !== RolUsuario.CLIENTE) {
        throw new ForbiddenException('Los vendedores solo pueden crear usuarios con rol CLIENTE');
      }
      return;
    }

    // Si el usuario autenticado es CLIENTE, NO puede crear otros usuarios
    if (usuarioAutenticado.rol === RolUsuario.CLIENTE) {
      throw new ForbiddenException('Los clientes no pueden crear otros usuarios');
    }
  }
} 