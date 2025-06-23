import { Module } from '@nestjs/common';
import { UsuarioController } from './infrastructure/controllers/usuario.controller';
import { CrearUsuarioUseCase } from './application/use-cases/usuarios/crear-usuario.use-case';
import { ActualizarPasswordUseCase } from './application/use-cases/usuarios/actualizar-password.use-case';
import { ActualizarUsuarioUseCase } from './application/use-cases/usuarios/actualizar-usuario.use-case';
import { UsuarioQueryService } from './application/services/usuario-query.service';
import { PrismaUsuarioRepository } from './infrastructure/prisma/prisma-usuario.repository';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [UsuarioController],
  providers: [
    CrearUsuarioUseCase,
    ActualizarPasswordUseCase,
    ActualizarUsuarioUseCase,
    UsuarioQueryService,
    {
      provide: 'IUsuarioRepository',
      useClass: PrismaUsuarioRepository,
    },
  ],
  exports: ['IUsuarioRepository'],
})
export class UsuariosModule {} 