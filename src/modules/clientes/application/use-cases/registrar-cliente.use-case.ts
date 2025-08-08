import {
  Injectable,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PasswordService } from '../../../shared/services/password.service';
import { Cliente } from '../../domain/cliente.entity';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { RegistrarClienteDto } from '../dtos/registro/registrar-cliente.dto';
import { RegistrarClienteResponseDto } from '../dtos/registro/registrar-cliente-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RegistrarClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(
    dto: RegistrarClienteDto,
  ): Promise<RegistrarClienteResponseDto> {
    // Verificar si el email ya existe
    const clienteExistente = await this.clienteRepository.findByEmail(
      dto.email,
    );
    if (clienteExistente) {
      throw new ConflictException('El email ya está registrado');
    }

    // Validar que el presupuesto máximo sea mayor al mínimo
    if (dto.rangoPresupuestoMin && dto.rangoPresupuestoMax) {
      if (dto.rangoPresupuestoMax < dto.rangoPresupuestoMin) {
        throw new BadRequestException(
          'El presupuesto máximo debe ser mayor al mínimo',
        );
      }
    }

    // Hash de la contraseña
    const hashedPassword = await this.passwordService.hashPassword(
      dto.password,
    );

    // Generar token de verificación
    const tokenVerificacion = uuidv4();

    // Crear la entidad Cliente
    const cliente = new Cliente({
      nombre: dto.nombre,
      apellido: dto.apellido,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      telefono: dto.telefono,
      fechaNacimiento: dto.fechaNacimiento
        ? new Date(dto.fechaNacimiento)
        : undefined,
      emailVerificado: false,
      tokenVerificacion,
      rangoPresupuestoMin: dto.rangoPresupuestoMin,
      rangoPresupuestoMax: dto.rangoPresupuestoMax,
      marcasInteres: dto.marcasInteres || [],
      tipoAutoInteres: dto.tipoAutoInteres || [],
      suscritoNewsletter: dto.suscritoNewsletter || false,
      aceptaMarketing: dto.aceptaMarketing || false,
      preferenciaContacto: dto.preferenciaContacto,
    });

    // Guardar en el repositorio
    const clienteGuardado = await this.clienteRepository.create(cliente);

    // TODO: Enviar email de verificación
    // await this.emailService.enviarEmailVerificacion(clienteGuardado.email, tokenVerificacion);

    return {
      id: clienteGuardado.id,
      nombre: clienteGuardado.nombre,
      apellido: clienteGuardado.apellido,
      email: clienteGuardado.email,
      telefono: clienteGuardado.telefono,
      fechaNacimiento: clienteGuardado.fechaNacimiento,
      emailVerificado: clienteGuardado.emailVerificado,
      rangoPresupuestoMin: clienteGuardado.rangoPresupuestoMin,
      rangoPresupuestoMax: clienteGuardado.rangoPresupuestoMax,
      marcasInteres: clienteGuardado.marcasInteres,
      tipoAutoInteres: clienteGuardado.tipoAutoInteres,
      suscritoNewsletter: clienteGuardado.suscritoNewsletter,
      aceptaMarketing: clienteGuardado.aceptaMarketing,
      preferenciaContacto: clienteGuardado.preferenciaContacto,
      createdAt: clienteGuardado.createdAt,
      message: 'Cliente registrado exitosamente. Por favor, verifica tu email.',
    };
  }
}
