import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppService } from './app.service';
import { PrismaService } from './modules/shared/prisma.service';
import { AutosModule } from './modules/autos/autos.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000, // 1 segundo
      limit: 3, // 3 requests por segundo (global)
    }, {
      name: 'medium',
      ttl: 10000, // 10 segundos
      limit: 20, // 20 requests por 10 segundos
    }, {
      name: 'long',
      ttl: 60000, // 1 minuto
      limit: 100, // 100 requests por minuto
    }]),
    AutosModule, 
    UsuariosModule, 
    AuthModule
  ],
  controllers: [],
  providers: [
    AppService, 
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
