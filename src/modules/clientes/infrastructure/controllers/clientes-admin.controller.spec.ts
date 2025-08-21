import { Test, TestingModule } from '@nestjs/testing';
import { ClientesAdminController } from './clientes-admin.controller';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { PaginationService } from '../../../shared/services/pagination.service';
import { ClienteToHttpMapper } from '../../application/mappers/cliente-to-http.mapper';
import { Cliente } from '../../domain/cliente.entity';
import { ClientePaginationDto } from '../../application/dtos/pagination/cliente-pagination.dto';
import { PreferenciaContacto, Marca, TipoAuto } from '@prisma/client';

describe('ClientesAdminController', () => {
  let controller: ClientesAdminController;
  let clienteRepository: jest.Mocked<ClienteRepository>;
  let paginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientesAdminController],
      providers: [
        {
          provide: CLIENTE_REPOSITORY,
          useValue: {
            findByFilters: jest.fn(),
            findById: jest.fn(),
            delete: jest.fn(),
            restore: jest.fn(),
          },
        },
        {
          provide: PaginationService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ClientesAdminController>(ClientesAdminController);
    clienteRepository = module.get(CLIENTE_REPOSITORY);
    paginationService = module.get(PaginationService);
  });

  const clienteMock = new Cliente({
    id: '123',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@example.com',
    telefono: '123456789',
    emailVerificado: true,
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
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('listarClientes', () => {
    it('debe listar todos los clientes con paginación', async () => {
      const paginationDto: ClientePaginationDto = {
        page: 1,
        limit: 10,
        active: true,
      };

      const clientes = [clienteMock];
      clienteRepository.findByFilters.mockResolvedValue(clientes);

      const result = await controller.listarClientes(paginationDto);

      expect(clienteRepository.findByFilters).toHaveBeenCalledWith({
        active: true,
        emailVerificado: undefined,
        suscritoNewsletter: undefined,
        aceptaMarketing: undefined,
        marcasInteres: undefined,
        tipoAutoInteres: undefined,
        page: 1,
        limit: 10,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 1);
      expect(result).toHaveProperty('totalPages', 1);
      expect(result.data).toHaveLength(1);
    });

    it('debe filtrar clientes por múltiples criterios', async () => {
      const paginationDto: ClientePaginationDto = {
        page: 1,
        limit: 20,
        active: true,
        emailVerificado: true,
        suscritoNewsletter: true,
        aceptaMarketing: false,
        marcasInteres: [Marca.HONDA, Marca.NISSAN],
        tipoAutoInteres: [TipoAuto.SUV],
      };

      const clientes = [clienteMock];
      clienteRepository.findByFilters.mockResolvedValue(clientes);

      await controller.listarClientes(paginationDto);

      expect(clienteRepository.findByFilters).toHaveBeenCalledWith({
        active: true,
        emailVerificado: true,
        suscritoNewsletter: true,
        aceptaMarketing: false,
        marcasInteres: [Marca.HONDA, Marca.NISSAN],
        tipoAutoInteres: [TipoAuto.SUV],
        page: 1,
        limit: 20,
      });
    });

    it('debe devolver lista vacía cuando no hay clientes', async () => {
      const paginationDto: ClientePaginationDto = {};

      clienteRepository.findByFilters.mockResolvedValue([]);

      const result = await controller.listarClientes(paginationDto);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(1);
    });

    it('debe mapear clientes usando ClienteToHttpMapper', async () => {
      const paginationDto: ClientePaginationDto = {};
      const clientes = [clienteMock];

      clienteRepository.findByFilters.mockResolvedValue(clientes);
      const spyMapper = jest.spyOn(ClienteToHttpMapper, 'toHttpList');

      await controller.listarClientes(paginationDto);

      expect(spyMapper).toHaveBeenCalledWith(clientes);
      spyMapper.mockRestore();
    });
  });

  describe('obtenerCliente', () => {
    it('debe obtener un cliente por ID', async () => {
      const clienteId = '123';
      clienteRepository.findById.mockResolvedValue(clienteMock);
      const spyMapper = jest.spyOn(
        ClienteToHttpMapper,
        'toHttpWithoutSensitive',
      );

      const result = await controller.obtenerCliente(clienteId);

      expect(clienteRepository.findById).toHaveBeenCalledWith(clienteId);
      expect(spyMapper).toHaveBeenCalledWith(clienteMock);
      expect(result).toHaveProperty('id', clienteId);
      expect(result).toHaveProperty('nombre', 'Juan');
      expect(result).toHaveProperty('apellido', 'Pérez');

      spyMapper.mockRestore();
    });

    it('debe lanzar error si el cliente no existe', async () => {
      const clienteId = 'no-existe';
      clienteRepository.findById.mockResolvedValue(null);

      await expect(controller.obtenerCliente(clienteId)).rejects.toThrow(
        'Cliente no encontrado',
      );
    });
  });

  describe('obtenerActividadCliente', () => {
    it('debe obtener la actividad del cliente', async () => {
      const clienteId = '123';
      clienteRepository.findById.mockResolvedValue(clienteMock);

      const result = await controller.obtenerActividadCliente(clienteId);

      expect(clienteRepository.findById).toHaveBeenCalledWith(clienteId);
      expect(result).toHaveProperty(
        'ultimaActividad',
        clienteMock.ultimaActividad,
      );
      expect(result).toHaveProperty('totalVistasAutos', 10);
      expect(result).toHaveProperty('totalClicksAutos', 5);
      expect(result).toHaveProperty('totalConsultas', 2);
    });

    it('debe lanzar error si el cliente no existe', async () => {
      const clienteId = 'no-existe';
      clienteRepository.findById.mockResolvedValue(null);

      await expect(
        controller.obtenerActividadCliente(clienteId),
      ).rejects.toThrow('Cliente no encontrado');
    });

    it('debe manejar clientes sin actividad', async () => {
      const clienteSinActividad = new Cliente({
        ...clienteMock.toObject(),
        totalVistasAutos: 0,
        totalClicksAutos: 0,
        totalConsultas: 0,
      });

      clienteRepository.findById.mockResolvedValue(clienteSinActividad);

      const result = await controller.obtenerActividadCliente('123');

      expect(result.totalVistasAutos).toBe(0);
      expect(result.totalClicksAutos).toBe(0);
      expect(result.totalConsultas).toBe(0);
    });
  });

  describe('cambiarEstado', () => {
    it('debe activar un cliente inactivo', async () => {
      const clienteId = '123';
      const body = { active: true };

      clienteRepository.findById
        .mockResolvedValueOnce(clienteMock) // Primera llamada para verificar existencia
        .mockResolvedValueOnce(clienteMock); // Segunda llamada después de restaurar
      clienteRepository.restore.mockResolvedValue(undefined);

      const result = await controller.cambiarEstado(clienteId, body);

      expect(clienteRepository.findById).toHaveBeenCalledWith(clienteId);
      expect(clienteRepository.restore).toHaveBeenCalledWith(clienteId);
      expect(result).toHaveProperty('message', 'Cliente activado exitosamente');
      expect(result).toHaveProperty('cliente');
    });

    it('debe desactivar un cliente activo', async () => {
      const clienteId = '123';
      const body = { active: false };

      clienteRepository.findById.mockResolvedValue(clienteMock);
      clienteRepository.delete.mockResolvedValue(undefined);

      const result = await controller.cambiarEstado(clienteId, body);

      expect(clienteRepository.findById).toHaveBeenCalledWith(clienteId);
      expect(clienteRepository.delete).toHaveBeenCalledWith(clienteId);
      expect(result).toHaveProperty(
        'message',
        'Cliente desactivado exitosamente',
      );
      expect(result).not.toHaveProperty('cliente');
    });

    it('debe lanzar error si el cliente no existe', async () => {
      const clienteId = 'no-existe';
      const body = { active: true };

      clienteRepository.findById.mockResolvedValue(null);

      await expect(controller.cambiarEstado(clienteId, body)).rejects.toThrow(
        'Cliente no encontrado',
      );
      expect(clienteRepository.restore).not.toHaveBeenCalled();
      expect(clienteRepository.delete).not.toHaveBeenCalled();
    });

    it('debe manejar cuando no se puede restaurar el cliente', async () => {
      const clienteId = '123';
      const body = { active: true };

      clienteRepository.findById
        .mockResolvedValueOnce(clienteMock)
        .mockResolvedValueOnce(null); // No encuentra el cliente después de restaurar
      clienteRepository.restore.mockResolvedValue(undefined);

      const result = await controller.cambiarEstado(clienteId, body);

      expect(result.message).toBe('Cliente activado exitosamente');
      expect(result.cliente).toBeNull();
    });
  });

  describe('eliminarCliente', () => {
    it('debe eliminar un cliente permanentemente', async () => {
      const clienteId = '123';
      clienteRepository.delete.mockResolvedValue(undefined);

      const result = await controller.eliminarCliente(clienteId);

      expect(clienteRepository.delete).toHaveBeenCalledWith(clienteId);
      expect(result).toBeUndefined(); // HttpCode 204 no devuelve contenido
    });

    it('debe manejar múltiples eliminaciones', async () => {
      const clienteIds = ['123', '456', '789'];
      clienteRepository.delete.mockResolvedValue(undefined);

      for (const id of clienteIds) {
        await controller.eliminarCliente(id);
      }

      expect(clienteRepository.delete).toHaveBeenCalledTimes(3);
      expect(clienteRepository.delete).toHaveBeenNthCalledWith(1, '123');
      expect(clienteRepository.delete).toHaveBeenNthCalledWith(2, '456');
      expect(clienteRepository.delete).toHaveBeenNthCalledWith(3, '789');
    });

    it('debe propagar errores del repositorio', async () => {
      const clienteId = '123';
      const error = new Error('Error al eliminar');
      clienteRepository.delete.mockRejectedValue(error);

      await expect(controller.eliminarCliente(clienteId)).rejects.toThrow(
        error,
      );
    });
  });

  describe('validaciones y edge cases', () => {
    it('debe manejar IDs con formato especial', async () => {
      const idEspecial = 'uuid-123e4567-e89b-12d3-a456-426614174000';
      clienteRepository.findById.mockResolvedValue(clienteMock);

      const result = await controller.obtenerCliente(idEspecial);

      expect(clienteRepository.findById).toHaveBeenCalledWith(idEspecial);
      expect(result).toBeDefined();
    });

    it('debe manejar filtros con valores extremos en paginación', async () => {
      const paginationDto: ClientePaginationDto = {
        page: 9999,
        limit: 1000,
      };

      clienteRepository.findByFilters.mockResolvedValue([]);

      const result = await controller.listarClientes(paginationDto);

      expect(result.data).toEqual([]);
      expect(result.page).toBe(1); // La implementación actual ignora page/limit
    });
  });
});
