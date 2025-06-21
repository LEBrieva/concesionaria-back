import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { PasswordService } from './services/password.service';

@Module({
  providers: [PrismaService, AllExceptionsFilter, PasswordService],
  exports: [PrismaService, AllExceptionsFilter, PasswordService],
})
export class SharedModule {}
