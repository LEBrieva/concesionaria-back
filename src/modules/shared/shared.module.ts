import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { PasswordService } from './services/password.service';
import { FirebaseService } from './services/firebase.service';
import { FirebaseStorageService } from './services/firebase-storage.service';
import { MultiEntityService } from './services/multi-entity.service';
import { HistorialService } from './services/historial.service';
import { PaginationService } from './services/pagination.service';
import { RepositoryFactory } from './factories/repository.factory';
import { FirebaseStorageProvider } from './factories/firebase-storage.factory';
import { PrismaHistorialRepository } from './infrastructure/prisma/prisma-historial.repository';
import { DashboardController } from './controllers/dashboard.controller';
import { HistorialController } from './controllers/historial.controller';
import { HealthController } from './controllers/health.controller';

@Module({
  controllers: [DashboardController, HistorialController, HealthController],
  providers: [
    PrismaService, 
    AllExceptionsFilter, 
    PasswordService, 
    FirebaseService,
    FirebaseStorageProvider, // 🧪 Usa mock en tests, real en producción
    MultiEntityService,
    HistorialService,
    PaginationService,
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
    FirebaseStorageService,
    MultiEntityService,
    HistorialService,
    PaginationService,
    RepositoryFactory,
    'IHistorialRepository',
  ],
})
export class SharedModule {}
