import { Test, TestingModule } from '@nestjs/testing';
import { ClientesPublicoController } from './clientes-publico.controller';
import { RegistrarClienteUseCase } from '../../application/use-cases/registrar-cliente.use-case';
import { LoginClienteUseCase } from '../../application/use-cases/login-cliente.use-case';
import { VerificarEmailUseCase } from '../../application/use-cases/verificar-email.use-case';
import { RegistrarClienteDto } from '../../application/dtos/registro/registrar-cliente.dto';
import { LoginClienteDto } from '../../application/dtos/auth/login-cliente.dto';
import { PreferenciaContacto, Marca, TipoAuto } from '@prisma/client';

describe('ClientesPublicoController', () => {
  let controller: ClientesPublicoController;
  let registrarClienteUseCase: jest.Mocked<RegistrarClienteUseCase>;
  let loginClienteUseCase: jest.Mocked<LoginClienteUseCase>;
  let verificarEmailUseCase: jest.Mocked<VerificarEmailUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientesPublicoController],
      providers: [
        {
          provide: RegistrarClienteUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: LoginClienteUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: VerificarEmailUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ClientesPublicoController>(
      ClientesPublicoController,
    );
    registrarClienteUseCase = module.get(RegistrarClienteUseCase);
    loginClienteUseCase = module.get(LoginClienteUseCase);
    verificarEmailUseCase = module.get(VerificarEmailUseCase);
  });

  describe('registrar', () => {
    it('debe registrar un nuevo cliente exitosamente', async () => {
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

      const mockResponse = {
        id: '123',
        nombre: dto.nombre,
        apellido: dto.apellido,
        nombreCompleto: `${dto.nombre} ${dto.apellido}`,
        email: dto.email,
        telefono: dto.telefono,
        fechaNacimiento: dto.fechaNacimiento
          ? new Date(dto.fechaNacimiento)
          : undefined,
        emailVerificado: false,
        rangoPresupuestoMin: dto.rangoPresupuestoMin,
        rangoPresupuestoMax: dto.rangoPresupuestoMax,
        marcasInteres: dto.marcasInteres,
        tipoAutoInteres: dto.tipoAutoInteres,
        suscritoNewsletter: dto.suscritoNewsletter,
        aceptaMarketing: dto.aceptaMarketing,
        preferenciaContacto: dto.preferenciaContacto,
        ultimaActividad: new Date(),
        totalVistasAutos: 0,
        totalClicksAutos: 0,
        totalConsultas: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
        message:
          'Cliente registrado exitosamente. Por favor, verifica tu email.',
      };

      registrarClienteUseCase.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.registrar(dto);

      expect(registrarClienteUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
      expect(result.message).toContain('Cliente registrado exitosamente');
      expect(result.emailVerificado).toBe(false);
    });

    it('debe manejar registros con datos mínimos', async () => {
      const dtoMinimo: RegistrarClienteDto = {
        nombre: 'María',
        apellido: 'González',
        email: 'maria@example.com',
        password: 'password456',
      };

      const mockResponse = {
        id: '456',
        nombre: dtoMinimo.nombre,
        apellido: dtoMinimo.apellido,
        nombreCompleto: `${dtoMinimo.nombre} ${dtoMinimo.apellido}`,
        email: dtoMinimo.email,
        emailVerificado: false,
        totalVistasAutos: 0,
        totalClicksAutos: 0,
        totalConsultas: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
        message:
          'Cliente registrado exitosamente. Por favor, verifica tu email.',
      };

      registrarClienteUseCase.execute.mockResolvedValue(mockResponse as any);

      const result = await controller.registrar(dtoMinimo);

      expect(registrarClienteUseCase.execute).toHaveBeenCalledWith(dtoMinimo);
      expect(result).toEqual(mockResponse);
    });

    it('debe propagar errores del caso de uso', async () => {
      const dto: RegistrarClienteDto = {
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        password: 'pass123',
      };

      const error = new Error('El email ya está registrado');
      registrarClienteUseCase.execute.mockRejectedValue(error);

      await expect(controller.registrar(dto)).rejects.toThrow(error);
    });
  });

  describe('login', () => {
    it('debe iniciar sesión exitosamente', async () => {
      const dto: LoginClienteDto = {
        email: 'juan@example.com',
        password: 'password123',
      };

      const mockResponse = {
        access_token: 'jwt.token.here',
        cliente: {
          id: '123',
          nombre: 'Juan',
          apellido: 'Pérez',
          email: dto.email,
          emailVerificado: true,
        },
      };

      loginClienteUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.login(dto);

      expect(loginClienteUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBeDefined();
      expect(result.cliente.email).toBe(dto.email);
    });

    it('debe manejar credenciales con formato diferente', async () => {
      const dto: LoginClienteDto = {
        email: 'USUARIO@EXAMPLE.COM', // Email en mayúsculas
        password: 'MyP@ssw0rd!',
      };

      const mockResponse = {
        access_token: 'another.jwt.token',
        cliente: {
          id: '789',
          nombre: 'Usuario',
          apellido: 'Test',
          email: 'usuario@example.com', // Normalizado a minúsculas
          emailVerificado: true,
        },
      };

      loginClienteUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.login(dto);

      expect(loginClienteUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result.cliente.email).toBe('usuario@example.com');
    });

    it('debe propagar errores de autenticación', async () => {
      const dto: LoginClienteDto = {
        email: 'wrong@example.com',
        password: 'wrongpass',
      };

      const error = new Error('Credenciales inválidas');
      loginClienteUseCase.execute.mockRejectedValue(error);

      await expect(controller.login(dto)).rejects.toThrow(error);
    });
  });

  describe('verificarEmail', () => {
    it('debe verificar el email exitosamente', async () => {
      const token = 'token-verificacion-123';
      const mockResponse = { message: 'Email verificado exitosamente' };

      verificarEmailUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.verificarEmail(token);

      expect(verificarEmailUseCase.execute).toHaveBeenCalledWith(token);
      expect(result).toEqual(mockResponse);
      expect(result.message).toBe('Email verificado exitosamente');
    });

    it('debe manejar token vacío', async () => {
      const token = '';
      const error = new Error('Token de verificación requerido');

      verificarEmailUseCase.execute.mockRejectedValue(error);

      await expect(controller.verificarEmail(token)).rejects.toThrow(error);
      expect(verificarEmailUseCase.execute).toHaveBeenCalledWith(token);
    });

    it('debe manejar token inválido', async () => {
      const token = 'token-invalido';
      const error = new Error('Token de verificación inválido o expirado');

      verificarEmailUseCase.execute.mockRejectedValue(error);

      await expect(controller.verificarEmail(token)).rejects.toThrow(error);
    });

    it('debe manejar email ya verificado', async () => {
      const token = 'token-ya-usado';
      const mockResponse = {
        message: 'El email ya ha sido verificado anteriormente',
      };

      verificarEmailUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.verificarEmail(token);

      expect(result.message).toBe(
        'El email ya ha sido verificado anteriormente',
      );
    });

    it('debe manejar tokens con caracteres especiales', async () => {
      const tokenEspecial = 'abc-123_def.456~xyz';
      const mockResponse = { message: 'Email verificado exitosamente' };

      verificarEmailUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.verificarEmail(tokenEspecial);

      expect(verificarEmailUseCase.execute).toHaveBeenCalledWith(tokenEspecial);
      expect(result).toEqual(mockResponse);
    });

    it('debe manejar undefined como token', async () => {
      const token = undefined as any;
      const error = new Error('Token de verificación requerido');

      verificarEmailUseCase.execute.mockRejectedValue(error);

      await expect(controller.verificarEmail(token)).rejects.toThrow(error);
    });
  });

  describe('integración de endpoints', () => {
    it('todos los métodos deben ser asíncronos', () => {
      expect(controller.registrar).toBeDefined();
      expect(controller.login).toBeDefined();
      expect(controller.verificarEmail).toBeDefined();

      // Verificar que retornan promesas
      const registrarResult = controller.registrar({} as any);
      expect(registrarResult).toBeInstanceOf(Promise);

      const loginResult = controller.login({} as any);
      expect(loginResult).toBeInstanceOf(Promise);

      const verificarResult = controller.verificarEmail('');
      expect(verificarResult).toBeInstanceOf(Promise);
    });

    it('debe inyectar correctamente los casos de uso', () => {
      expect(registrarClienteUseCase).toBeDefined();
      expect(loginClienteUseCase).toBeDefined();
      expect(verificarEmailUseCase).toBeDefined();
    });
  });
});
