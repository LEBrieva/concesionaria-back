import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { PasswordService } from './services/password.service';
import { FirebaseService } from './services/firebase.service';
import { MultiEntityService } from './services/multi-entity.service';
import { HistorialService } from './services/historial.service';
import { RepositoryFactory } from './factories/repository.factory';
import { PrismaHistorialRepository } from './infrastructure/prisma/prisma-historial.repository';
import { DashboardController } from './controllers/dashboard.controller';
import { HistorialController } from './controllers/historial.controller';

@Module({
  controllers: [DashboardController, HistorialController],
  providers: [
    PrismaService, 
    AllExceptionsFilter, 
    PasswordService, 
    FirebaseService,
    MultiEntityService,
    HistorialService,
    RepositoryFactory,
    {
      provide: 'IHistorialRepository',
      useClass: PrismaHistorialRepository,
    },
  ],
  exports: [
    PrismaService, 
    AllExceptionsFilter, 
    PasswordService, 
    FirebaseService,
    MultiEntityService,
    HistorialService,
    RepositoryFactory,
    'IHistorialRepository',
  ],
})
export class SharedModule {}
