import { Auto } from '@autos/domain/auto.entity';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma.service';
import { AutoPrismaMapper } from '../mappers/auto-to-prisma.mapper';
import { BaseRepository } from 'src/modules/shared/repositories/base.repository';
import { Auto as PrismaAuto } from '@prisma/client';

@Injectable()
export class PrismaAutoRepository extends BaseRepository<Auto, PrismaAuto> implements IAutoRepository {
  constructor(prisma: PrismaService) {
    super(prisma, 'auto');
  }

  // Implementación del método abstracto de BaseRepository
  protected toDomain(prismaAuto: PrismaAuto): Auto {
    return AutoPrismaMapper.toDomain(prismaAuto);
  }

  async save(auto: Auto): Promise<void> {
    await this.prisma.auto.create({
      data: AutoPrismaMapper.toPrisma(auto),
    });
  }

  async update(id: string, auto: Auto): Promise<void> {
    await this.prisma.auto.update({
      where: { id },
      data: AutoPrismaMapper.toPrisma(auto),
    });
  }

  async findByMatricula(matricula: string): Promise<Auto | null> {
    const data = await this.prisma.auto.findUnique({ where: { matricula } });
    return data ? AutoPrismaMapper.toDomain(data) : null;
  }
}
