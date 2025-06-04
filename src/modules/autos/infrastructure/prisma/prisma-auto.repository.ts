import { Auto } from '@autos/domain/auto.entity';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma.service';
import { AutoPrismaMapper } from '../mappers/auto-to-prisma.mapper';

@Injectable()
export class PrismaAutoRepository implements IAutoRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async findById(id: string): Promise<Auto | null> {
    const data = await this.prisma.auto.findUnique({ where: { id } });
    return data ? AutoPrismaMapper.toDomain(data) : null;
  }

  async findAll(): Promise<Auto[]> {
    const data = await this.prisma.auto.findMany();
    return data.map(AutoPrismaMapper.toDomain);
  }
}
