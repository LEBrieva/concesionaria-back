import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './shared/prisma.service';
import { AutosModule } from './modules/autos/auto.module';

@Module({
  imports: [AutosModule],
  controllers: [],
  providers: [AppService, PrismaService],
})
export class AppModule {}
