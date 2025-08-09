import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ActualizarPerfilUseCase } from './actualizar-perfil.use-case';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { ActualizarPerfilDto } from '../dtos/perfil/actualizar-perfil.dto';
import { Cliente } from '../../domain/cliente.entity';
import { PreferenciaContacto, Marca, TipoAuto } from '@prisma/client';

describe('ActualizarPerfilUseCase', () => {
  let useCase: ActualizarPerfilUseCase;
  let clienteRepository: jest.Mocked<ClienteRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActualizarPerfilUseCase,
        {
          provide: CLIENTE_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ActualizarPerfilUseCase>(ActualizarPerfilUseCase);
    clienteRepository = module.get(CLIENTE_REPOSITORY);
  });

  describe('execute', () => {
    const clienteId = '123';
    const clienteMock = new Cliente({
      id: clienteId,
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      telefono: '123456789',
      fechaNacimiento: new Date('1990-01-01'),
      rangoPresupuestoMin: 10000,
      rangoPresupuestoMax: 50000,
      marcasInteres: [Marca.TOYOTA],
      tipoAutoInteres: [TipoAuto.SEDAN],
      suscritoNewsletter: true,
      aceptaMarketing: true,
      preferenciaContacto: PreferenciaContacto.EMAIL,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('debe actualizar el perfil exitosamente', async () => {
      const dto: ActualizarPerfilDto = {
        nombre: 'Juan Carlos',
        apellido: 'Pérez García',
        telefono: '987654321',
        suscritoNewsletter: false,
      };

      const clienteActualizado = new Cliente({
        ...clienteMock.toObject(),
        ...dto,
      });

      clienteRepository.findById.mockResolvedValue(clienteMock);
      clienteRepository.update.mockResolvedValue(clienteActualizado);

      const result = await useCase.execute(clienteId, dto);

      expect(result).toBeDefined();
      expect(result.nombre).toBe(dto.nombre);
      expect(result.apellido).toBe(dto.apellido);
      expect(result.telefono).toBe(dto.telefono);
      expect(result.suscritoNewsletter).toBe(dto.suscritoNewsletter);

      expect(clienteRepository.findById).toHaveBeenCalledWith(clienteId);
      expect(clienteRepository.update).toHaveBeenCalledWith(
        clienteId,
        expect.any(Cliente),
      );
    });

    it('debe lanzar NotFoundException si el cliente no existe', async () => {
      clienteRepository.findById.mockResolvedValue(null);

      const dto: ActualizarPerfilDto = {
        nombre: 'Nuevo Nombre',
      };

      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        'Cliente no encontrado',
      );

      expect(clienteRepository.update).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el cliente está inactivo', async () => {
      const clienteInactivo = new Cliente({
        ...clienteMock.toObject(),
        active: false,
      });

      clienteRepository.findById.mockResolvedValue(clienteInactivo);

      const dto: ActualizarPerfilDto = {
        nombre: 'Nuevo Nombre',
      };

      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        'Cliente no encontrado',
      );

      expect(clienteRepository.update).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el presupuesto máximo es menor al mínimo', async () => {
      clienteRepository.findById.mockResolvedValue(clienteMock);

      const dto: ActualizarPerfilDto = {
        rangoPresupuestoMin: 50000,
        rangoPresupuestoMax: 10000,
      };

      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        'El presupuesto máximo debe ser mayor al mínimo',
      );

      expect(clienteRepository.update).not.toHaveBeenCalled();
    });

    it('debe validar presupuestos considerando valores existentes', async () => {
      const clienteConPresupuesto = new Cliente({
        ...clienteMock.toObject(),
        rangoPresupuestoMin: 30000,
        rangoPresupuestoMax: 60000,
      });

      clienteRepository.findById.mockResolvedValue(clienteConPresupuesto);

      const dto: ActualizarPerfilDto = {
        rangoPresupuestoMax: 20000, // Menor que el mínimo existente
      };

      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        'El presupuesto máximo debe ser mayor al mínimo',
      );
    });

    it('debe actualizar solo los campos proporcionados', async () => {
      const dto: ActualizarPerfilDto = {
        nombre: 'Pedro',
        marcasInteres: [Marca.HONDA, Marca.NISSAN],
      };

      clienteRepository.findById.mockResolvedValue(clienteMock);
      clienteRepository.update.mockImplementation(
        async (id, cliente) => cliente,
      );

      await useCase.execute(clienteId, dto);

      expect(clienteRepository.update).toHaveBeenCalledWith(
        clienteId,
        expect.objectContaining({
          nombre: dto.nombre,
          apellido: clienteMock.apellido, // No debe cambiar
          marcasInteres: dto.marcasInteres,
        }),
      );
    });

    it('debe manejar fecha de nacimiento como string', async () => {
      const dto: ActualizarPerfilDto = {
        fechaNacimiento: '1995-06-15' as any,
      };

      clienteRepository.findById.mockResolvedValue(clienteMock);
      clienteRepository.update.mockImplementation(
        async (id, cliente) => cliente,
      );

      await useCase.execute(clienteId, dto);

      expect(clienteRepository.update).toHaveBeenCalledWith(
        clienteId,
        expect.objectContaining({
          fechaNacimiento: new Date('1995-06-15'),
        }),
      );
    });

    it('debe actualizar la última actividad', async () => {
      const dto: ActualizarPerfilDto = {
        telefono: '555-5555',
      };

      clienteRepository.findById.mockResolvedValue(clienteMock);
      clienteRepository.update.mockImplementation(
        async (id, cliente) => cliente,
      );

      const fechaAntes = new Date();
      await useCase.execute(clienteId, dto);
      const fechaDespues = new Date();

      const clienteActualizado = (clienteRepository.update as jest.Mock).mock
        .calls[0][1];

      expect(
        clienteActualizado.ultimaActividad.getTime(),
      ).toBeGreaterThanOrEqual(fechaAntes.getTime());
      expect(clienteActualizado.ultimaActividad.getTime()).toBeLessThanOrEqual(
        fechaDespues.getTime(),
      );
    });

    it('debe manejar actualizaciones con valores undefined correctamente', async () => {
      const dto: ActualizarPerfilDto = {
        telefono: undefined,
        fechaNacimiento: undefined,
        rangoPresupuestoMin: undefined,
      };

      clienteRepository.findById.mockResolvedValue(clienteMock);
      clienteRepository.update.mockImplementation(
        async (id, cliente) => cliente,
      );

      await useCase.execute(clienteId, dto);

      expect(clienteRepository.update).toHaveBeenCalled();
      // Los valores undefined no deben cambiar los valores existentes
    });
  });
});
