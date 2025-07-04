import { Module } from '@nestjs/common';
import { UsuarioController } from './infrastructure/controllers/usuario.controller';
import { SharedModule } from '../shared/shared.module';
import { CrearUsuarioUseCase } from './application/use-cases/crear-usuario.use-case';
import { ActualizarPasswordUseCase } from './application/use-cases/actualizar-password.use-case';
import { ActualizarUsuarioUseCase } from './application/use-cases/actualizar-usuario.use-case';
import { EliminarUsuarioUseCase } from './application/use-cases/eliminar-usuario.use-case';
import { RestaurarUsuarioUseCase } from './application/use-cases/restaurar-usuario.use-case';
import { UsuarioQueryService } from './application/services/usuario-query.service';
import { PrismaUsuarioRepository } from './infrastructure/prisma/prisma-usuario.repository';

@Module({
  imports: [SharedModule],
  controllers: [UsuarioController],
  providers: [
    CrearUsuarioUseCase,
    ActualizarPasswordUseCase,
    ActualizarUsuarioUseCase,
    EliminarUsuarioUseCase,
    RestaurarUsuarioUseCase,
    UsuarioQueryService,
    {
      provide: 'IUsuarioRepository',
      useClass: PrismaUsuarioRepository,
    },
  ],
  exports: ['IUsuarioRepository'],
})
export class UsuariosModule {} 