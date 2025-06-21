import { Module } from '@nestjs/common';
import { UsuarioController } from './infrastructure/controllers/usuario.controller';
import { CrearUsuarioUseCase } from './application/use-cases/usuarios/crear-usuario.use-case';
import { ActualizarPasswordUseCase } from './application/use-cases/usuarios/actualizar-password.use-case';
import { ActualizarUsuarioUseCase } from './application/use-cases/usuarios/actualizar-usuario.use-case';
import { UsuarioRepository } from './domain/usuario.repository';
import { PrismaUsuarioRepository } from './infrastructure/prisma/prisma-usuario.repository';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [UsuarioController],
  providers: [
    CrearUsuarioUseCase,
    ActualizarPasswordUseCase,
    ActualizarUsuarioUseCase,
    {
      provide: UsuarioRepository,
      useClass: PrismaUsuarioRepository,
    },
  ],
  exports: [UsuarioRepository],
})
export class UsuariosModule {} 