import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BaseEntity } from '../entities/base.entity';
import { IBaseRepository } from '../interfaces/base-repository.interface';

@Injectable()
export abstract class BaseRepository<T extends BaseEntity, TPrisma = any> 
  implements IBaseRepository<T> {
  
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly tableName: string,
  ) {}

  // Método abstracto que debe implementar cada repositorio específico
  protected abstract toDomain(prismaEntity: TPrisma): T;

  async findAll(): Promise<T[]> {
    const prismaTable = this.getPrismaTable();
    const data = await prismaTable.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return data.map((item: TPrisma) => this.toDomain(item));
  }

  async findAllActive(): Promise<T[]> {
    const prismaTable = this.getPrismaTable();
    const data = await prismaTable.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((item: TPrisma) => this.toDomain(item));
  }

  async findOneById(id: string): Promise<T | null> {
    const prismaTable = this.getPrismaTable();
    const data = await prismaTable.findUnique({
      where: { id },
    });
    return data ? this.toDomain(data) : null;
  }

  // Método helper para obtener la tabla de Prisma dinámicamente
  private getPrismaTable() {
    return (this.prisma as any)[this.tableName];
  }
} 