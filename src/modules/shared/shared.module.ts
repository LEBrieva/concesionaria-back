import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { PasswordService } from './services/password.service';
import { FirebaseService } from './services/firebase.service';

@Module({
  providers: [PrismaService, AllExceptionsFilter, PasswordService, FirebaseService],
  exports: [PrismaService, AllExceptionsFilter, PasswordService, FirebaseService],
})
export class SharedModule {}
