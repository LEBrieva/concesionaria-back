import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../../domain/interfaces/authenticated-user.interface';
import { ValidarUsuarioJwtUseCase } from '../../application/use-cases/validar-usuario-jwt.use-case';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly validarUsuarioJwtUseCase: ValidarUsuarioJwtUseCase,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 's3cr3tC0d3D3R3sp4ld0',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Validación básica del payload
    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido: ID de usuario faltante');
    }

    // Delegar la validación al caso de uso
    return await this.validarUsuarioJwtUseCase.execute(payload.sub);
  }
} 