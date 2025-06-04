import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './modules/shared/prisma.service';
import { AutosModule } from './modules/autos/autos.module';

@Module({
  imports: [AutosModule],
  controllers: [],
  providers: [AppService, PrismaService],
})
export class AppModule {}
