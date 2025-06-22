import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUsuarioRepository } from '../../../usuarios/domain/usuario.repository';
import { PasswordService } from '../../../shared/services/password.service';
import { AuthenticatedUser } from '../../domain/interfaces/authenticated-user.interface';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';

export interface LoginResponse {
  access_token: string;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUsuarioRepository') private readonly usuarioRepository: IUsuarioRepository,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  async validateUser(email: string, password: string): Promise<AuthenticatedUser> {
    const usuario = await this.usuarioRepository.obtenerPorEmail(email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      password,
      usuario.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };
  }

  async login(user: AuthenticatedUser): Promise<LoginResponse> {
    const payload: JwtPayload = { 
      email: user.email, 
      sub: user.id, 
      nombre: user.nombre,
      rol: user.rol,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
    };
  }
} 