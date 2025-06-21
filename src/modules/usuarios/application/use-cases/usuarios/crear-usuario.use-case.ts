import { Injectable, ConflictException } from '@nestjs/common';
import { Usuario } from 'src/modules/usuarios/domain/usuario.entity';
import { UsuarioRepository } from 'src/modules/usuarios/domain/usuario.repository';
import { CrearUsuarioDto } from '../../dtos/usuarios/crear/crear-usuario.dto';
import { PasswordService } from 'src/modules/shared/services/password.service';
import { randomUUID } from 'crypto';

@Injectable()
export class CrearUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async ejecutar(dto: CrearUsuarioDto): Promise<Usuario> {
    // Verificar si ya existe un usuario con el mismo email
    const usuarioExistente = await this.usuarioRepository.obtenerPorEmail(dto.email);
    if (usuarioExistente) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Hashear la contraseña
    const hashedPassword = await this.passwordService.hashPassword(dto.password);

    const usuario = new Usuario({
      id: randomUUID(), // Generar UUID v4
      nombre: dto.nombre,
      apellido: dto.apellido,
      email: dto.email,
      password: hashedPassword,
      telefono: dto.telefono,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system', // Por ahora hardcodeado, después se puede obtener del contexto
      updatedBy: 'system',
      active: true,
    });

    return await this.usuarioRepository.crear(usuario);
  }
} 