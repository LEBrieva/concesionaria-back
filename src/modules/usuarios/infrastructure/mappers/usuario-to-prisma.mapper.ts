import { Usuario as PrismaUsuario, RolUsuario as PrismaRolUsuario } from '@prisma/client';
import { Usuario } from '../../domain/usuario.entity';
import { RolUsuario } from '../../domain/usuario.enum';

export class UsuarioToPrismaMapper {
  static toPrisma(usuario: Usuario): Omit<PrismaUsuario, 'id'> {
    return {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: usuario.password,
      telefono: usuario.telefono || null,
      rol: usuario.rol as PrismaRolUsuario, // Conversión explícita entre enums compatibles
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
      createdBy: usuario.createdBy || 'system',
      updatedBy: usuario.updatedBy || 'system',
      active: usuario.active,
    };
  }

  static toDomain(prismaUsuario: PrismaUsuario): Usuario {
    return new Usuario({
      id: prismaUsuario.id,
      nombre: prismaUsuario.nombre,
      apellido: prismaUsuario.apellido,
      email: prismaUsuario.email,
      password: prismaUsuario.password,
      telefono: prismaUsuario.telefono || undefined,
      rol: prismaUsuario.rol as RolUsuario, // Conversión explícita entre enums compatibles
      createdAt: prismaUsuario.createdAt,
      updatedAt: prismaUsuario.updatedAt,
      createdBy: prismaUsuario.createdBy,
      updatedBy: prismaUsuario.updatedBy,
      active: prismaUsuario.active,
    });
  }
} 