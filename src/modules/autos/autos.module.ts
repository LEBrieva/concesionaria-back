import { Module } from '@nestjs/common';
import { PrismaAutoRepository } from './infrastructure/prisma/prisma-auto.repository';
import { SharedModule } from 'src/modules/shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { AutoController } from './infrastructure/controllers/auto.controller';
import { CrearAutoUseCase } from './application/use-cases/autos/crear-auto.use-case';
import { ActualizarAutoUseCase } from './application/use-cases/autos/actualizar-auto.use-case';

@Module({
  imports: [SharedModule, AuthModule],
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
