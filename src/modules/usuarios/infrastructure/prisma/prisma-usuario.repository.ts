import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma.service';
import { Usuario } from '../../domain/usuario.entity';
import { IUsuarioRepository } from '../../domain/usuario.repository';
import { UsuarioToPrismaMapper } from '../mappers/usuario-to-prisma.mapper';

@Injectable()
export class PrismaUsuarioRepository implements IUsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(usuario: Usuario): Promise<Usuario> {
    const prismaUsuario = await this.prisma.usuario.create({
      data: UsuarioToPrismaMapper.toPrisma(usuario),
    });

    return UsuarioToPrismaMapper.toDomain(prismaUsuario);
  }

  async obtenerPorId(id: string): Promise<Usuario | null> {
    const prismaUsuario = await this.prisma.usuario.findUnique({
      where: { id, active: true },
    });

    if (!prismaUsuario) {
      return null;
    }

    return UsuarioToPrismaMapper.toDomain(prismaUsuario);
  }

  async obtenerPorEmail(email: string): Promise<Usuario | null> {
    const prismaUsuario = await this.prisma.usuario.findUnique({
      where: { email, active: true },
    });

    if (!prismaUsuario) {
      return null;
    }

    return UsuarioToPrismaMapper.toDomain(prismaUsuario);
  }

  async obtenerTodos(): Promise<Usuario[]> {
    const prismaUsuarios = await this.prisma.usuario.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    return prismaUsuarios.map(UsuarioToPrismaMapper.toDomain);
  }

  async actualizar(id: string, usuario: Usuario): Promise<Usuario> {
    const prismaUsuario = await this.prisma.usuario.update({
      where: { id },
      data: UsuarioToPrismaMapper.toPrisma(usuario),
    });

    return UsuarioToPrismaMapper.toDomain(prismaUsuario);
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: { active: false },
    });
  }
} 