import { Module } from '@nestjs/common';
import { PrismaAutoRepository } from './infrastructure/adapters/prisma/prisma-auto.repository';
import { SharedModule } from 'src/modules/shared/shared.module';
import { AutoController } from './infrastructure/presentation/controllers/auto.controller';
import { CrearAutoUseCase } from './application/use-cases/autos/crear-auto.use-case';
import { ActualizarAutoUseCase } from './application/use-cases/autos/actualizar-auto.use-case';

@Module({
  imports: [SharedModule],
  controllers: [AutoController],
  providers: [
    CrearAutoUseCase,
    ActualizarAutoUseCase,
    {
      provide: 'IAutoRepository',
      useClass: PrismaAutoRepository,
    },
  ],
})
export class AutosModule {}
