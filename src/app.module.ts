import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './modules/shared/prisma.service';
import { AutosModule } from './modules/autos/autos.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [AutosModule, UsuariosModule, AuthModule],
  controllers: [],
  providers: [AppService, PrismaService],
})
export class AppModule {}
