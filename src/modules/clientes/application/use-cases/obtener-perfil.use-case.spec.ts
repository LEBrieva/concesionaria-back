import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ObtenerPerfilUseCase } from './obtener-perfil.use-case';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { Cliente } from '../../domain/cliente.entity';

describe('ObtenerPerfilUseCase', () => {
  let useCase: ObtenerPerfilUseCase;
  let clienteRepository: jest.Mocked<ClienteRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObtenerPerfilUseCase,
        {
          provide: CLIENTE_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            actualizarUltimaActividad: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ObtenerPerfilUseCase>(ObtenerPerfilUseCase);
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
      emailVerificado: true,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('debe obtener el perfil del cliente exitosamente', async () => {
      clienteRepository.findById.mockResolvedValue(clienteMock);
      clienteRepository.actualizarUltimaActividad.mockResolvedValue(
        clienteMock,
      );

      const result = await useCase.execute(clienteId);

      expect(result).toBeDefined();
      expect(result).toEqual(clienteMock);
      expect(result.id).toBe(clienteId);
      expect(result.nombre).toBe(clienteMock.nombre);
      expect(result.apellido).toBe(clienteMock.apellido);
      expect(result.email).toBe(clienteMock.email);

      expect(clienteRepository.findById).toHaveBeenCalledWith(clienteId);
      expect(clienteRepository.actualizarUltimaActividad).toHaveBeenCalledWith(
        clienteId,
      );
    });

    it('debe lanzar NotFoundException si el cliente no existe', async () => {
      clienteRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(clienteId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(clienteId)).rejects.toThrow(
        'Cliente no encontrado',
      );

      expect(clienteRepository.findById).toHaveBeenCalledWith(clienteId);
      expect(
        clienteRepository.actualizarUltimaActividad,
      ).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el cliente está inactivo', async () => {
      const clienteInactivo = new Cliente({
        ...clienteMock.toObject(),
        active: false,
      });

      clienteRepository.findById.mockResolvedValue(clienteInactivo);

      await expect(useCase.execute(clienteId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(clienteId)).rejects.toThrow(
        'Cliente no encontrado',
      );

      expect(clienteRepository.findById).toHaveBeenCalledWith(clienteId);
      expect(
        clienteRepository.actualizarUltimaActividad,
      ).not.toHaveBeenCalled();
    });

    it('debe actualizar la última actividad del cliente', async () => {
      clienteRepository.findById.mockResolvedValue(clienteMock);
      clienteRepository.actualizarUltimaActividad.mockResolvedValue(
        clienteMock,
      );

      await useCase.execute(clienteId);

      expect(clienteRepository.actualizarUltimaActividad).toHaveBeenCalledTimes(
        1,
      );
      expect(clienteRepository.actualizarUltimaActividad).toHaveBeenCalledWith(
        clienteId,
      );
    });

    it('debe devolver el cliente con todos sus datos', async () => {
      const clienteCompleto = new Cliente({
        id: clienteId,
        nombre: 'María',
        apellido: 'González',
        email: 'maria@example.com',
        telefono: '555-1234',
        fechaNacimiento: new Date('1995-05-15'),
        emailVerificado: true,
        rangoPresupuestoMin: 20000,
        rangoPresupuestoMax: 40000,
        marcasInteres: [],
        tipoAutoInteres: [],
        suscritoNewsletter: true,
        aceptaMarketing: false,
        preferenciaContacto: 'EMAIL' as any,
        ultimaActividad: new Date(),
        totalVistasAutos: 15,
        totalClicksAutos: 8,
        totalConsultas: 3,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      clienteRepository.findById.mockResolvedValue(clienteCompleto);
      clienteRepository.actualizarUltimaActividad.mockResolvedValue(
        clienteCompleto,
      );

      const result = await useCase.execute(clienteId);

      expect(result).toEqual(clienteCompleto);
      expect(result.nombre).toBe('María');
      expect(result.apellido).toBe('González');
      expect(result.email).toBe('maria@example.com');
      expect(result.telefono).toBe('555-1234');
      expect(result.rangoPresupuestoMin).toBe(20000);
      expect(result.rangoPresupuestoMax).toBe(40000);
      expect(result.totalVistasAutos).toBe(15);
      expect(result.totalClicksAutos).toBe(8);
      expect(result.totalConsultas).toBe(3);
    });

    it('debe manejar errores del repositorio correctamente', async () => {
      const error = new Error('Error de base de datos');
      clienteRepository.findById.mockRejectedValue(error);

      await expect(useCase.execute(clienteId)).rejects.toThrow(error);

      expect(
        clienteRepository.actualizarUltimaActividad,
      ).not.toHaveBeenCalled();
    });
  });
});
