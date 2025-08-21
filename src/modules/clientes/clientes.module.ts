import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from '../shared/shared.module';

// Repositorios
import { CLIENTE_REPOSITORY } from './domain/cliente.repository';
import { PrismaClienteRepository } from './infrastructure/prisma/prisma-cliente.repository';

// Casos de uso
import { RegistrarClienteUseCase } from './application/use-cases/registrar-cliente.use-case';
import { LoginClienteUseCase } from './application/use-cases/login-cliente.use-case';
import { VerificarEmailUseCase } from './application/use-cases/verificar-email.use-case';
import { ObtenerPerfilUseCase } from './application/use-cases/obtener-perfil.use-case';
import { ActualizarPerfilUseCase } from './application/use-cases/actualizar-perfil.use-case';
import { CambiarPasswordUseCase } from './application/use-cases/cambiar-password.use-case';

// Controladores
import { ClientesPublicoController } from './infrastructure/controllers/clientes-publico.controller';
import { ClientesController } from './infrastructure/controllers/clientes.controller';
import { ClientesAdminController } from './infrastructure/controllers/clientes-admin.controller';

@Module({
  imports: [
    SharedModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'cliente-secret-key-development',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    ClientesPublicoController,
    ClientesController,
    ClientesAdminController,
  ],
  providers: [
    // Repositorio
    {
      provide: CLIENTE_REPOSITORY,
      useClass: PrismaClienteRepository,
    },
    // Casos de uso
    RegistrarClienteUseCase,
    LoginClienteUseCase,
    VerificarEmailUseCase,
    ObtenerPerfilUseCase,
    ActualizarPerfilUseCase,
    CambiarPasswordUseCase,
  ],
  exports: [CLIENTE_REPOSITORY],
})
export class ClientesModule {}
