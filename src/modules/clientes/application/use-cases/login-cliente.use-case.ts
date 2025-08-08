import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../../../shared/services/password.service';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { LoginClienteDto } from '../dtos/auth/login-cliente.dto';
import { LoginResponseDto } from '../dtos/auth/login-response.dto';

@Injectable()
export class LoginClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginClienteDto): Promise<LoginResponseDto> {
    // Buscar cliente por email
    const cliente = await this.clienteRepository.findByEmail(
      dto.email.toLowerCase(),
    );

    if (!cliente) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar que el cliente esté activo
    if (!cliente.active) {
      throw new UnauthorizedException('Tu cuenta ha sido desactivada');
    }

    // Verificar contraseña
    if (!cliente.password) {
      throw new UnauthorizedException(
        'Este cliente no tiene contraseña configurada',
      );
    }

    const passwordValida = await this.passwordService.verifyPassword(
      dto.password,
      cliente.password,
    );

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar última actividad
    await this.clienteRepository.actualizarUltimaActividad(cliente.id);

    // Generar JWT
    const payload = {
      sub: cliente.id,
      email: cliente.email,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      tipo: 'cliente', // Para diferenciar de usuarios internos
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        email: cliente.email,
        emailVerificado: cliente.emailVerificado,
      },
    };
  }
}
