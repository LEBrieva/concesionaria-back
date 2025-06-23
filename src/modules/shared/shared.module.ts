import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { PasswordService } from './services/password.service';
import { FirebaseService } from './services/firebase.service';
import { MultiEntityService } from './services/multi-entity.service';
import { RepositoryFactory } from './factories/repository.factory';
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [
    PrismaService, 
    AllExceptionsFilter, 
    PasswordService, 
    FirebaseService,
    MultiEntityService,
    RepositoryFactory,
  ],
  exports: [
    PrismaService, 
    AllExceptionsFilter, 
    PasswordService, 
    FirebaseService,
    MultiEntityService,
    RepositoryFactory,
  ],
})
export class SharedModule {}
