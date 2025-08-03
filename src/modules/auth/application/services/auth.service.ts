import { Injectable, UnauthorizedException, Inject, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUsuarioRepository } from '../../../usuarios/domain/usuario.repository';
import { PasswordService } from '../../../shared/services/password.service';
import { AuthenticatedUser } from '../../domain/interfaces/authenticated-user.interface';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';
import { Usuario } from '../../../usuarios/domain/usuario.entity';
import { RolUsuario } from '../../../usuarios/domain/usuario.enum';
import { randomUUID } from 'crypto';

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

  async register(registerData: { email: string; password: string; fullName: string }): Promise<LoginResponse> {
    // Verificar si el usuario ya existe
    const existingUser = await this.usuarioRepository.obtenerPorEmail(registerData.email);
    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    // Hashear la contraseña
    const hashedPassword = await this.passwordService.hashPassword(registerData.password);

    // Separar nombre y apellido del fullName
    const nameParts = registerData.fullName.trim().split(' ');
    const nombre = nameParts[0];
    const apellido = nameParts.slice(1).join(' ') || nombre;

    // Crear el usuario
    const nuevoUsuario = new Usuario({
      id: randomUUID(),
      nombre,
      apellido,
      email: registerData.email,
      password: hashedPassword,
      telefono: undefined,
      rol: RolUsuario.CLIENTE,
      createdBy: 'system',
      updatedBy: 'system',
    });

    const usuarioCreado = await this.usuarioRepository.crear(nuevoUsuario);

    // Crear el token y respuesta
    const authenticatedUser: AuthenticatedUser = {
      id: usuarioCreado.id,
      email: usuarioCreado.email,
      nombre: usuarioCreado.nombre,
      rol: usuarioCreado.rol,
    };

    return this.login(authenticatedUser);
  }
} 