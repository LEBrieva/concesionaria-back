import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

@Module({
  providers: [PrismaService, AllExceptionsFilter],
  exports: [PrismaService, AllExceptionsFilter],
})
export class SharedModule {}
