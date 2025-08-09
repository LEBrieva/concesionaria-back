import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClienteRepository } from './prisma-cliente.repository';
import { PrismaService } from '../../../shared/prisma.service';
import { Cliente } from '../../domain/cliente.entity';
import { ClienteToPrismaMapper } from '../mappers/cliente-to-prisma.mapper';
import { PreferenciaContacto, Marca, TipoAuto } from '@prisma/client';

describe('PrismaClienteRepository', () => {
  let repository: PrismaClienteRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaCliente = {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaClienteRepository,
        {
          provide: PrismaService,
          useValue: {
            cliente: mockPrismaCliente,
          },
        },
      ],
    }).compile();

    repository = module.get<PrismaClienteRepository>(PrismaClienteRepository);
    prismaService = module.get(PrismaService);

    // Limpiar mocks
    jest.clearAllMocks();
  });

  const clienteMockData = {
    id: '123',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@example.com',
    telefono: '123456789',
    fechaNacimiento: new Date('1990-01-01'),
    password: 'hashedPassword',
    emailVerificado: true,
    tokenVerificacion: null,
    rangoPresupuestoMin: 10000,
    rangoPresupuestoMax: 50000,
    marcasInteres: [Marca.TOYOTA],
    tipoAutoInteres: [TipoAuto.SEDAN],
    suscritoNewsletter: true,
    aceptaMarketing: true,
    preferenciaContacto: PreferenciaContacto.EMAIL,
    ultimaActividad: new Date(),
    totalVistasAutos: 10,
    totalClicksAutos: 5,
    totalConsultas: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    active: true,
  };

  const clienteDomain = new Cliente(clienteMockData);

  describe('create', () => {
    it('debe crear un nuevo cliente', async () => {
      mockPrismaCliente.create.mockResolvedValue(clienteMockData);

      const result = await repository.create(clienteDomain);

      expect(mockPrismaCliente.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: clienteDomain.id,
          nombre: clienteDomain.nombre,
          apellido: clienteDomain.apellido,
          email: clienteDomain.email,
        }),
      });
      expect(result).toBeInstanceOf(Cliente);
      expect(result.id).toBe(clienteMockData.id);
    });

    it('debe incluir el ID al crear', async () => {
      const clienteConId = new Cliente({ ...clienteMockData, id: 'custom-id' });
      mockPrismaCliente.create.mockResolvedValue({
        ...clienteMockData,
        id: 'custom-id',
      });

      await repository.create(clienteConId);

      expect(mockPrismaCliente.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'custom-id',
        }),
      });
    });
  });

  describe('update', () => {
    it('debe actualizar un cliente existente', async () => {
      const clienteActualizado = { ...clienteMockData, nombre: 'Juan Carlos' };
      mockPrismaCliente.update.mockResolvedValue(clienteActualizado);

      const clienteModificado = new Cliente({
        ...clienteMockData,
        nombre: 'Juan Carlos',
      });
      const result = await repository.update('123', clienteModificado);

      expect(mockPrismaCliente.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: expect.objectContaining({
          nombre: 'Juan Carlos',
        }),
      });
      expect(result.nombre).toBe('Juan Carlos');
    });
  });

  describe('findById', () => {
    it('debe encontrar un cliente por ID', async () => {
      mockPrismaCliente.findUnique.mockResolvedValue(clienteMockData);

      const result = await repository.findById('123');

      expect(mockPrismaCliente.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      expect(result).toBeInstanceOf(Cliente);
      expect(result?.id).toBe('123');
    });

    it('debe retornar null si el cliente no existe', async () => {
      mockPrismaCliente.findUnique.mockResolvedValue(null);

      const result = await repository.findById('no-existe');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('debe obtener todos los clientes activos', async () => {
      const clientes = [clienteMockData, { ...clienteMockData, id: '456' }];
      mockPrismaCliente.findMany.mockResolvedValue(clientes);

      const result = await repository.findAll();

      expect(mockPrismaCliente.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Cliente);
    });
  });

  describe('delete', () => {
    it('debe hacer soft delete de un cliente', async () => {
      mockPrismaCliente.update.mockResolvedValue({
        ...clienteMockData,
        active: false,
      });

      await repository.delete('123');

      expect(mockPrismaCliente.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { active: false },
      });
    });
  });

  describe('restore', () => {
    it('debe restaurar un cliente eliminado', async () => {
      mockPrismaCliente.update.mockResolvedValue({
        ...clienteMockData,
        active: true,
      });

      await repository.restore('123');

      expect(mockPrismaCliente.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { active: true },
      });
    });
  });

  describe('findByEmail', () => {
    it('debe encontrar un cliente por email', async () => {
      mockPrismaCliente.findUnique.mockResolvedValue(clienteMockData);

      const result = await repository.findByEmail('juan@example.com');

      expect(mockPrismaCliente.findUnique).toHaveBeenCalledWith({
        where: { email: 'juan@example.com' },
      });
      expect(result?.email).toBe('juan@example.com');
    });

    it('debe convertir el email a minúsculas', async () => {
      mockPrismaCliente.findUnique.mockResolvedValue(clienteMockData);

      await repository.findByEmail('JUAN@EXAMPLE.COM');

      expect(mockPrismaCliente.findUnique).toHaveBeenCalledWith({
        where: { email: 'juan@example.com' },
      });
    });

    it('debe retornar null si no encuentra el email', async () => {
      mockPrismaCliente.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('noexiste@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByFilters', () => {
    it('debe filtrar por nombre', async () => {
      mockPrismaCliente.findMany.mockResolvedValue([clienteMockData]);

      await repository.findByFilters({ nombre: 'Juan' });

      expect(mockPrismaCliente.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          nombre: { contains: 'Juan', mode: 'insensitive' },
          active: true,
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('debe filtrar por múltiples criterios', async () => {
      mockPrismaCliente.findMany.mockResolvedValue([clienteMockData]);

      await repository.findByFilters({
        emailVerificado: true,
        suscritoNewsletter: true,
        marcasInteres: [Marca.TOYOTA, Marca.HONDA],
        rangoPresupuestoMin: 20000,
        active: true,
      });

      expect(mockPrismaCliente.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          emailVerificado: true,
          suscritoNewsletter: true,
          marcasInteres: { hasSome: [Marca.TOYOTA, Marca.HONDA] },
          rangoPresupuestoMin: { gte: 20000 },
          active: true,
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('debe usar active=true por defecto', async () => {
      mockPrismaCliente.findMany.mockResolvedValue([]);

      await repository.findByFilters({});

      expect(mockPrismaCliente.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          active: true,
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('debe permitir buscar clientes inactivos', async () => {
      mockPrismaCliente.findMany.mockResolvedValue([]);

      await repository.findByFilters({ active: false });

      expect(mockPrismaCliente.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          active: false,
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('debe filtrar por token de verificación', async () => {
      mockPrismaCliente.findMany.mockResolvedValue([clienteMockData]);

      await repository.findByFilters({ tokenVerificacion: 'token123' });

      expect(mockPrismaCliente.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tokenVerificacion: 'token123',
        }),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('verificarEmail', () => {
    it('debe verificar el email exitosamente', async () => {
      const clienteConToken = {
        ...clienteMockData,
        tokenVerificacion: 'token123',
      };
      mockPrismaCliente.findUnique.mockResolvedValue(clienteConToken);
      mockPrismaCliente.update.mockResolvedValue({
        ...clienteConToken,
        emailVerificado: true,
        tokenVerificacion: null,
      });

      const result = await repository.verificarEmail('123', 'token123');

      expect(result).toBe(true);
      expect(mockPrismaCliente.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          emailVerificado: true,
          tokenVerificacion: null,
        },
      });
    });

    it('debe retornar false si el token no coincide', async () => {
      const clienteConToken = {
        ...clienteMockData,
        tokenVerificacion: 'token123',
      };
      mockPrismaCliente.findUnique.mockResolvedValue(clienteConToken);

      const result = await repository.verificarEmail('123', 'token-incorrecto');

      expect(result).toBe(false);
      expect(mockPrismaCliente.update).not.toHaveBeenCalled();
    });

    it('debe retornar false si el cliente no existe', async () => {
      mockPrismaCliente.findUnique.mockResolvedValue(null);

      const result = await repository.verificarEmail('no-existe', 'token123');

      expect(result).toBe(false);
      expect(mockPrismaCliente.update).not.toHaveBeenCalled();
    });
  });

  describe('actualizarUltimaActividad', () => {
    it('debe actualizar la última actividad', async () => {
      const ahora = new Date();
      const clienteActualizado = { ...clienteMockData, ultimaActividad: ahora };
      mockPrismaCliente.update.mockResolvedValue(clienteActualizado);

      const result = await repository.actualizarUltimaActividad('123');

      expect(mockPrismaCliente.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          ultimaActividad: expect.any(Date),
        },
      });
      expect(result).toBeInstanceOf(Cliente);
    });
  });

  describe('incrementarVistas', () => {
    it('debe incrementar el contador de vistas', async () => {
      const clienteActualizado = { ...clienteMockData, totalVistasAutos: 11 };
      mockPrismaCliente.update.mockResolvedValue(clienteActualizado);

      const result = await repository.incrementarVistas('123');

      expect(mockPrismaCliente.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          totalVistasAutos: { increment: 1 },
          ultimaActividad: expect.any(Date),
        },
      });
      expect(result.totalVistasAutos).toBe(11);
    });
  });

  describe('incrementarClicks', () => {
    it('debe incrementar el contador de clicks', async () => {
      const clienteActualizado = { ...clienteMockData, totalClicksAutos: 6 };
      mockPrismaCliente.update.mockResolvedValue(clienteActualizado);

      const result = await repository.incrementarClicks('123');

      expect(mockPrismaCliente.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          totalClicksAutos: { increment: 1 },
          ultimaActividad: expect.any(Date),
        },
      });
      expect(result.totalClicksAutos).toBe(6);
    });
  });

  describe('incrementarConsultas', () => {
    it('debe incrementar el contador de consultas', async () => {
      const clienteActualizado = { ...clienteMockData, totalConsultas: 3 };
      mockPrismaCliente.update.mockResolvedValue(clienteActualizado);

      const result = await repository.incrementarConsultas('123');

      expect(mockPrismaCliente.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          totalConsultas: { increment: 1 },
          ultimaActividad: expect.any(Date),
        },
      });
      expect(result.totalConsultas).toBe(3);
    });
  });

  describe('findWithPagination', () => {
    it('debe retornar resultados paginados', async () => {
      const clientes = [clienteMockData, { ...clienteMockData, id: '456' }];
      mockPrismaCliente.findMany.mockResolvedValue(clientes);
      mockPrismaCliente.count.mockResolvedValue(10);

      const result = await repository.findWithPagination(2, 5);

      expect(mockPrismaCliente.findMany).toHaveBeenCalledWith({
        where: { active: true },
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrismaCliente.count).toHaveBeenCalledWith({
        where: { active: true },
      });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(10);
    });

    it('debe incluir clientes eliminados si se especifica', async () => {
      mockPrismaCliente.findMany.mockResolvedValue([]);
      mockPrismaCliente.count.mockResolvedValue(0);

      await repository.findWithPagination(1, 10, { incluirEliminados: true });

      expect(mockPrismaCliente.findMany).toHaveBeenCalledWith({
        where: { active: undefined },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('debe permitir ordenamiento personalizado', async () => {
      mockPrismaCliente.findMany.mockResolvedValue([]);
      mockPrismaCliente.count.mockResolvedValue(0);

      await repository.findWithPagination(1, 10, undefined, 'nombre', 'asc');

      expect(mockPrismaCliente.findMany).toHaveBeenCalledWith({
        where: { active: true },
        skip: 0,
        take: 10,
        orderBy: { nombre: 'asc' },
      });
    });
  });

  describe('métodos alias', () => {
    it('findAllActive debe llamar a findMany con active=true', async () => {
      mockPrismaCliente.findMany.mockResolvedValue([clienteMockData]);

      const result = await repository.findAllActive();

      expect(mockPrismaCliente.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('findOneById debe llamar a findById', async () => {
      mockPrismaCliente.findUnique.mockResolvedValue(clienteMockData);

      const result = await repository.findOneById('123');

      expect(mockPrismaCliente.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      expect(result?.id).toBe('123');
    });

    it('softDelete debe llamar a delete', async () => {
      mockPrismaCliente.update.mockResolvedValue({
        ...clienteMockData,
        active: false,
      });

      await repository.softDelete('123');

      expect(mockPrismaCliente.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { active: false },
      });
    });
  });
});
