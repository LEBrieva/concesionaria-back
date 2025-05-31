import { Module } from '@nestjs/common';
import { PrismaAutoRepository } from './infrastructure/prisma/prisma-auto.repository';
import { SharedModule } from 'src/shared/shared.module';
import { AutoController } from './infrastructure/controllers/auto.controller';
import { CrearAutoUseCase } from './application/use-cases/autos/crear-auto.use-case';

@Module({
  imports: [SharedModule],
  controllers: [AutoController],
  providers: [
    CrearAutoUseCase,
    {
      provide: 'IAutoRepository',
      useClass: PrismaAutoRepository,
    },
  ],
})
export class AutosModule {}
