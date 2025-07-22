import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { PasswordService } from './services/password.service';
import { FirebaseService } from './services/firebase.service';
import { FirebaseStorageService } from './services/firebase-storage.service';
import { FirebaseStorageMockService } from './services/firebase-storage-mock.service';
import { MultiEntityService } from './services/multi-entity.service';
import { HistorialService } from './services/historial.service';
import { PaginationService } from './services/pagination.service';
import { RepositoryFactory } from './factories/repository.factory';
import { PrismaHistorialRepository } from './infrastructure/prisma/prisma-historial.repository';
import { DashboardController } from './controllers/dashboard.controller';
import { HistorialController } from './controllers/historial.controller';
import { HealthController } from './controllers/health.controller';

// Determinar si usar el servicio mock para Firebase Storage
const useFirebaseMock = 
  process.env.NODE_ENV === 'test' || 
  process.env.USE_FIREBASE_MOCK === 'true' ||
  // Si no hay credenciales de Firebase, usar mock
  !process.env.FIREBASE_PROJECT_ID || 
  !process.env.FIREBASE_PRIVATE_KEY || 
  !process.env.FIREBASE_CLIENT_EMAIL;

@Module({
  controllers: [DashboardController, HistorialController, HealthController],
  providers: [
    PrismaService, 
    AllExceptionsFilter, 
    PasswordService, 
    FirebaseService,
    // Inyección condicional de Firebase Storage
    {
      provide: FirebaseStorageService,
      useClass: useFirebaseMock ? FirebaseStorageMockService : FirebaseStorageService,
    },
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
