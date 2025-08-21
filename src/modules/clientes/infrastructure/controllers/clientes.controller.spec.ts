import { Test, TestingModule } from '@nestjs/testing';
import { ClientesController } from './clientes.controller';
import { ObtenerPerfilUseCase } from '../../application/use-cases/obtener-perfil.use-case';
import { ActualizarPerfilUseCase } from '../../application/use-cases/actualizar-perfil.use-case';
import { CambiarPasswordUseCase } from '../../application/use-cases/cambiar-password.use-case';
import { ClienteToHttpMapper } from '../../application/mappers/cliente-to-http.mapper';
import { ActualizarPerfilDto } from '../../application/dtos/perfil/actualizar-perfil.dto';
import { CambiarPasswordDto } from '../../application/dtos/perfil/cambiar-password.dto';
import { Cliente } from '../../domain/cliente.entity';
import { PreferenciaContacto } from '@prisma/client';

describe('ClientesController', () => {
  let controller: ClientesController;
  let obtenerPerfilUseCase: jest.Mocked<ObtenerPerfilUseCase>;
  let actualizarPerfilUseCase: jest.Mocked<ActualizarPerfilUseCase>;
  let cambiarPasswordUseCase: jest.Mocked<CambiarPasswordUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientesController],
      providers: [
        {
          provide: ObtenerPerfilUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ActualizarPerfilUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CambiarPasswordUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ClientesController>(ClientesController);
    obtenerPerfilUseCase = module.get(ObtenerPerfilUseCase);
    actualizarPerfilUseCase = module.get(ActualizarPerfilUseCase);
    cambiarPasswordUseCase = module.get(CambiarPasswordUseCase);
  });

  describe('obtenerPerfil', () => {
    it('debe obtener el perfil del cliente autenticado', async () => {
      const clienteId = '123';
      const req = { user: { sub: clienteId } };
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

      obtenerPerfilUseCase.execute.mockResolvedValue(clienteMock);
      const spyMapper = jest.spyOn(
        ClienteToHttpMapper,
        'toHttpWithoutSensitive',
      );

      const result = await controller.obtenerPerfil(req);

      expect(obtenerPerfilUseCase.execute).toHaveBeenCalledWith(clienteId);
      expect(spyMapper).toHaveBeenCalledWith(clienteMock);
      expect(result).toHaveProperty('id', clienteId);
      expect(result).toHaveProperty('nombre', 'Juan');
      expect(result).toHaveProperty('apellido', 'Pérez');
      expect(result).toHaveProperty('email', 'juan@example.com');

      spyMapper.mockRestore();
    });

    it('debe extraer el clienteId del token JWT correctamente', async () => {
      const clienteId = 'abc-123-def';
      const req = { user: { sub: clienteId, email: 'test@example.com' } };
      const clienteMock = new Cliente({
        id: clienteId,
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      obtenerPerfilUseCase.execute.mockResolvedValue(clienteMock);

      await controller.obtenerPerfil(req);

      expect(obtenerPerfilUseCase.execute).toHaveBeenCalledWith(clienteId);
      expect(obtenerPerfilUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('debe manejar errores del caso de uso', async () => {
      const req = { user: { sub: '123' } };
      const error = new Error('Cliente no encontrado');

      obtenerPerfilUseCase.execute.mockRejectedValue(error);

      await expect(controller.obtenerPerfil(req)).rejects.toThrow(error);
    });
  });

  describe('actualizarPerfil', () => {
    it('debe actualizar el perfil del cliente autenticado', async () => {
      const clienteId = '123';
      const req = { user: { sub: clienteId } };
      const dto: ActualizarPerfilDto = {
        nombre: 'Juan Carlos',
        apellido: 'Pérez García',
        telefono: '987654321',
      };

      const clienteActualizado = new Cliente({
        id: clienteId,
        nombre: dto.nombre!,
        apellido: dto.apellido!,
        email: 'juan@example.com',
        telefono: dto.telefono,
        emailVerificado: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      actualizarPerfilUseCase.execute.mockResolvedValue(clienteActualizado);
      const spyMapper = jest.spyOn(
        ClienteToHttpMapper,
        'toHttpWithoutSensitive',
      );

      const result = await controller.actualizarPerfil(req, dto);

      expect(actualizarPerfilUseCase.execute).toHaveBeenCalledWith(
        clienteId,
        dto,
      );
      expect(spyMapper).toHaveBeenCalledWith(clienteActualizado);
      expect(result).toHaveProperty('nombre', dto.nombre);
      expect(result).toHaveProperty('apellido', dto.apellido);
      expect(result).toHaveProperty('telefono', dto.telefono);

      spyMapper.mockRestore();
    });

    it('debe manejar actualizaciones parciales', async () => {
      const clienteId = '456';
      const req = { user: { sub: clienteId } };
      const dto: ActualizarPerfilDto = {
        suscritoNewsletter: false,
        preferenciaContacto: PreferenciaContacto.TELEFONO,
      };

      const clienteActualizado = new Cliente({
        id: clienteId,
        nombre: 'María',
        apellido: 'González',
        email: 'maria@example.com',
        suscritoNewsletter: dto.suscritoNewsletter,
        preferenciaContacto: dto.preferenciaContacto,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      actualizarPerfilUseCase.execute.mockResolvedValue(clienteActualizado);

      const result = await controller.actualizarPerfil(req, dto);

      expect(actualizarPerfilUseCase.execute).toHaveBeenCalledWith(
        clienteId,
        dto,
      );
      expect(result).toHaveProperty('suscritoNewsletter', false);
      expect(result).toHaveProperty(
        'preferenciaContacto',
        PreferenciaContacto.TELEFONO,
      );
    });

    it('debe manejar errores del caso de uso', async () => {
      const req = { user: { sub: '123' } };
      const dto: ActualizarPerfilDto = { nombre: 'Nuevo Nombre' };
      const error = new Error('Error al actualizar');

      actualizarPerfilUseCase.execute.mockRejectedValue(error);

      await expect(controller.actualizarPerfil(req, dto)).rejects.toThrow(
        error,
      );
    });
  });

  describe('cambiarPassword', () => {
    it('debe cambiar la contraseña del cliente autenticado', async () => {
      const clienteId = '123';
      const req = { user: { sub: clienteId } };
      const dto: CambiarPasswordDto = {
        passwordActual: 'oldPassword123',
        passwordNueva: 'newPassword456',
      };

      const response = { message: 'Contraseña actualizada exitosamente' };
      cambiarPasswordUseCase.execute.mockResolvedValue(response);

      const result = await controller.cambiarPassword(req, dto);

      expect(cambiarPasswordUseCase.execute).toHaveBeenCalledWith(
        clienteId,
        dto,
      );
      expect(result).toEqual(response);
      expect(result.message).toBe('Contraseña actualizada exitosamente');
    });

    it('debe pasar el clienteId y dto correctamente al caso de uso', async () => {
      const clienteId = 'xyz-789';
      const req = { user: { sub: clienteId } };
      const dto: CambiarPasswordDto = {
        passwordActual: 'current123',
        passwordNueva: 'newSecure456',
      };

      cambiarPasswordUseCase.execute.mockResolvedValue({ message: 'OK' });

      await controller.cambiarPassword(req, dto);

      expect(cambiarPasswordUseCase.execute).toHaveBeenCalledTimes(1);
      expect(cambiarPasswordUseCase.execute).toHaveBeenCalledWith(
        clienteId,
        dto,
      );
    });

    it('debe manejar errores del caso de uso', async () => {
      const req = { user: { sub: '123' } };
      const dto: CambiarPasswordDto = {
        passwordActual: 'wrong',
        passwordNueva: 'new',
      };
      const error = new Error('Contraseña actual incorrecta');

      cambiarPasswordUseCase.execute.mockRejectedValue(error);

      await expect(controller.cambiarPassword(req, dto)).rejects.toThrow(error);
    });

    it('debe devolver directamente la respuesta del caso de uso', async () => {
      const clienteId = '999';
      const req = { user: { sub: clienteId } };
      const dto: CambiarPasswordDto = {
        passwordActual: 'abc',
        passwordNueva: 'xyz',
      };

      const mockResponse = {
        message: 'Mensaje personalizado del caso de uso',
        additionalData: 'datos extra',
      };
      cambiarPasswordUseCase.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.cambiarPassword(req, dto);

      expect(result).toBe(mockResponse);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('validación de request', () => {
    it('debe manejar request sin usuario autenticado', async () => {
      const reqSinUser = {} as any;

      // Esto normalmente sería manejado por el guard, pero probamos el comportamiento
      await expect(async () => {
        await controller.obtenerPerfil(reqSinUser);
      }).rejects.toThrow();
    });

    it('debe manejar request con estructura de user diferente', async () => {
      const reqConEstructuraDiferente = {
        user: {
          id: '123', // usar 'id' en lugar de 'sub'
          sub: undefined,
        },
      } as any;

      const clienteMock = new Cliente({
        id: 'default',
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      obtenerPerfilUseCase.execute.mockResolvedValue(clienteMock);

      await controller.obtenerPerfil(reqConEstructuraDiferente);

      // Debe usar undefined si sub no está presente
      expect(obtenerPerfilUseCase.execute).toHaveBeenCalledWith(undefined);
    });
  });
});
