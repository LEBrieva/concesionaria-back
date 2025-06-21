import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { Usuario } from 'src/modules/usuarios/domain/usuario.entity';
import { UsuarioRepository } from 'src/modules/usuarios/domain/usuario.repository';
import { CrearUsuarioDto } from '../../dtos/usuarios/crear/crear-usuario.dto';
import { PasswordService } from 'src/modules/shared/services/password.service';
import { RolUsuario } from 'src/modules/usuarios/domain/usuario.enum';
import { AuthenticatedUser } from 'src/modules/auth/domain/interfaces/authenticated-user.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class CrearUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async ejecutar(dto: CrearUsuarioDto, usuarioAutenticado?: AuthenticatedUser): Promise<Usuario> {
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

    return await this.usuarioRepository.crear(usuario);
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