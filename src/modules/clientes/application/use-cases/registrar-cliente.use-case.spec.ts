import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { RegistrarClienteUseCase } from './registrar-cliente.use-case';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { PasswordService } from '../../../shared/services/password.service';
import { RegistrarClienteDto } from '../dtos/registro/registrar-cliente.dto';
import { Cliente } from '../../domain/cliente.entity';
import { PreferenciaContacto, Marca, TipoAuto } from '@prisma/client';

describe('RegistrarClienteUseCase', () => {
  let useCase: RegistrarClienteUseCase;
  let clienteRepository: jest.Mocked<ClienteRepository>;
  let passwordService: jest.Mocked<PasswordService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrarClienteUseCase,
        {
          provide: CLIENTE_REPOSITORY,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hashPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<RegistrarClienteUseCase>(RegistrarClienteUseCase);
    clienteRepository = module.get(CLIENTE_REPOSITORY);
    passwordService = module.get(PasswordService);
  });

  describe('execute', () => {
    const dto: RegistrarClienteDto = {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      password: 'password123',
      telefono: '123456789',
      fechaNacimiento: '1990-01-01' as any,
      rangoPresupuestoMin: 10000,
      rangoPresupuestoMax: 50000,
      marcasInteres: [Marca.TOYOTA],
      tipoAutoInteres: [TipoAuto.SEDAN],
      suscritoNewsletter: true,
      aceptaMarketing: true,
      preferenciaContacto: PreferenciaContacto.EMAIL,
    };

    it('debe registrar un cliente exitosamente', async () => {
      const hashedPassword = 'hashedPassword123';
      const clienteMock = new Cliente({
        id: '123',
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        telefono: dto.telefono,
        fechaNacimiento: dto.fechaNacimiento
          ? new Date(dto.fechaNacimiento)
          : undefined,
        emailVerificado: false,
        tokenVerificacion: 'token123',
        rangoPresupuestoMin: dto.rangoPresupuestoMin,
        rangoPresupuestoMax: dto.rangoPresupuestoMax,
        marcasInteres: dto.marcasInteres,
        tipoAutoInteres: dto.tipoAutoInteres,
        suscritoNewsletter: dto.suscritoNewsletter,
        aceptaMarketing: dto.aceptaMarketing,
        preferenciaContacto: dto.preferenciaContacto,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
        ultimaActividad: new Date(),
        totalVistasAutos: 0,
        totalClicksAutos: 0,
        totalConsultas: 0,
      });

      clienteRepository.findByEmail.mockResolvedValue(null);
      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      clienteRepository.create.mockResolvedValue(clienteMock);

      const result = await useCase.execute(dto);

      expect(result).toBeDefined();
      expect(result.id).toBe(clienteMock.id);
      expect(result.nombre).toBe(dto.nombre);
      expect(result.apellido).toBe(dto.apellido);
      expect(result.email).toBe(dto.email.toLowerCase());
      expect(result.message).toContain('Cliente registrado exitosamente');
      expect(clienteRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(passwordService.hashPassword).toHaveBeenCalledWith(dto.password);
      expect(clienteRepository.create).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      const clienteExistente = new Cliente({
        id: 'existing',
        nombre: 'Existente',
        apellido: 'Usuario',
        email: dto.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
      });

      clienteRepository.findByEmail.mockResolvedValue(clienteExistente);

      await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        'El email ya está registrado',
      );
      expect(clienteRepository.create).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el presupuesto máximo es menor al mínimo', async () => {
      const dtoInvalido = {
        ...dto,
        rangoPresupuestoMin: 50000,
        rangoPresupuestoMax: 10000,
      };

      clienteRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(dtoInvalido)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(dtoInvalido)).rejects.toThrow(
        'El presupuesto máximo debe ser mayor al mínimo',
      );
      expect(clienteRepository.create).not.toHaveBeenCalled();
    });

    it('debe convertir el email a minúsculas', async () => {
      const dtoConEmailMayusculas = {
        ...dto,
        email: 'JUAN@EXAMPLE.COM',
      };

      const hashedPassword = 'hashedPassword123';
      const clienteMock = new Cliente({
        id: '123',
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dtoConEmailMayusculas.email.toLowerCase(),
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
      });

      clienteRepository.findByEmail.mockResolvedValue(null);
      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      clienteRepository.create.mockResolvedValue(clienteMock);

      const result = await useCase.execute(dtoConEmailMayusculas);

      expect(result.email).toBe('juan@example.com');
      expect(clienteRepository.findByEmail).toHaveBeenCalledWith(
        'JUAN@EXAMPLE.COM',
      );
    });

    it('debe manejar valores opcionales correctamente', async () => {
      const dtoMinimo: RegistrarClienteDto = {
        nombre: 'María',
        apellido: 'González',
        email: 'maria@example.com',
        password: 'password456',
      };

      const hashedPassword = 'hashedPassword456';
      const clienteMock = new Cliente({
        id: '456',
        nombre: dtoMinimo.nombre,
        apellido: dtoMinimo.apellido,
        email: dtoMinimo.email.toLowerCase(),
        password: hashedPassword,
        emailVerificado: false,
        suscritoNewsletter: false,
        aceptaMarketing: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
        marcasInteres: [],
        tipoAutoInteres: [],
        preferenciaContacto: PreferenciaContacto.EMAIL,
        ultimaActividad: new Date(),
        totalVistasAutos: 0,
        totalClicksAutos: 0,
        totalConsultas: 0,
      });

      clienteRepository.findByEmail.mockResolvedValue(null);
      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      clienteRepository.create.mockResolvedValue(clienteMock);

      const result = await useCase.execute(dtoMinimo);

      expect(result).toBeDefined();
      expect(result.nombre).toBe(dtoMinimo.nombre);
      expect(result.apellido).toBe(dtoMinimo.apellido);
      expect(result.telefono).toBeNull(); // El cliente mock retorna null, no undefined
      expect(result.suscritoNewsletter).toBe(false);
      expect(result.aceptaMarketing).toBe(false);
    });
  });
});
