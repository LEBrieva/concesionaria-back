import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma.service';
import { Usuario } from '../../domain/usuario.entity';
import { IUsuarioRepository } from '../../domain/usuario.repository';
import { UsuarioToPrismaMapper } from '../mappers/usuario-to-prisma.mapper';
import { BaseRepository } from 'src/modules/shared/repositories/base.repository';
import { Usuario as PrismaUsuario } from '@prisma/client';

@Injectable()
export class PrismaUsuarioRepository extends BaseRepository<Usuario, PrismaUsuario> implements IUsuarioRepository {
  constructor(prisma: PrismaService) {
    super(prisma, 'usuario');
  }

  // Implementación del método abstracto de BaseRepository
  protected toDomain(prismaUsuario: PrismaUsuario): Usuario {
    return UsuarioToPrismaMapper.toDomain(prismaUsuario);
  }

  async crear(usuario: Usuario): Promise<Usuario> {
    const prismaUsuario = await this.prisma.usuario.create({
      data: UsuarioToPrismaMapper.toPrisma(usuario),
    });

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