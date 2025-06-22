import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './application/services/auth.service';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { FirebaseProtectionGuard } from './infrastructure/guards/firebase-protection.guard';
import { ValidarUsuarioJwtUseCase } from './application/use-cases/validar-usuario-jwt.use-case';
import { GoogleAuthUseCase } from './application/use-cases/google-auth.use-case';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mi-secreto-super-seguro',
      signOptions: { expiresIn: '24h' },
    }),
    UsuariosModule,
    SharedModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, RolesGuard, FirebaseProtectionGuard, ValidarUsuarioJwtUseCase, GoogleAuthUseCase],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {} 