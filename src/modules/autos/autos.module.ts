import { Module } from '@nestjs/common';
import { PrismaAutoRepository } from './infrastructure/prisma/prisma-auto.repository';
import { SharedModule } from 'src/modules/shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { AutoController } from './infrastructure/controllers/auto.controller';
import { AutosPublicoController } from './infrastructure/controllers/autos-publico.controller';
import { CrearAutoUseCase } from './application/use-cases/crear-auto.use-case';
import { ActualizarAutoUseCase } from './application/use-cases/actualizar-auto.use-case';
import { EliminarAutoUseCase } from './application/use-cases/eliminar-auto.use-case';
import { RestaurarAutoUseCase } from './application/use-cases/restaurar-auto.use-case';
import { CambiarEstadoAutoUseCase } from './application/use-cases/cambiar-estado-auto.use-case';
import { GestionarFavoritoUseCase } from './application/use-cases/gestionar-favorito.use-case';
import { ObtenerFavoritosUseCase } from './application/use-cases/obtener-favoritos.use-case';
import { SubirImagenesAutoUseCase } from './application/use-cases/subir-imagenes-auto.use-case';
import { EliminarImagenAutoUseCase } from './application/use-cases/eliminar-imagen-auto.use-case';
import { AutoQueryService } from './application/services/auto-query.service';

@Module({
  imports: [SharedModule, AuthModule],
  controllers: [AutoController, AutosPublicoController],
  providers: [
    CrearAutoUseCase,
    ActualizarAutoUseCase,
    EliminarAutoUseCase,
    RestaurarAutoUseCase,
    CambiarEstadoAutoUseCase,
    GestionarFavoritoUseCase,
    ObtenerFavoritosUseCase,
    SubirImagenesAutoUseCase,
    EliminarImagenAutoUseCase,
    AutoQueryService,
    {
      provide: 'IAutoRepository',
      useClass: PrismaAutoRepository,
    },
  ],
  exports: ['IAutoRepository'],
})
export class AutosModule {}
