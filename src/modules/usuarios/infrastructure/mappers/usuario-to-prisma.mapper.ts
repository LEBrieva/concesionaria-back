import { Usuario as PrismaUsuario } from '@prisma/client';
import { Usuario } from '../../domain/usuario.entity';

export class UsuarioToPrismaMapper {
  static toPrisma(usuario: Usuario): Omit<PrismaUsuario, 'id'> {
    return {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono || null,
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
      telefono: prismaUsuario.telefono || undefined,
      createdAt: prismaUsuario.createdAt,
      updatedAt: prismaUsuario.updatedAt,
      createdBy: prismaUsuario.createdBy,
      updatedBy: prismaUsuario.updatedBy,
      active: prismaUsuario.active,
    });
  }
} 