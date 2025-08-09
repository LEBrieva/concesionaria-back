import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VerificarEmailUseCase } from './verificar-email.use-case';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { Cliente } from '../../domain/cliente.entity';

describe('VerificarEmailUseCase', () => {
  let useCase: VerificarEmailUseCase;
  let clienteRepository: jest.Mocked<ClienteRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificarEmailUseCase,
        {
          provide: CLIENTE_REPOSITORY,
          useValue: {
            findByFilters: jest.fn(),
            verificarEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<VerificarEmailUseCase>(VerificarEmailUseCase);
    clienteRepository = module.get(CLIENTE_REPOSITORY);
  });

  describe('execute', () => {
    const token = 'token-verificacion-123';
    const clienteMock = new Cliente({
      id: '123',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      emailVerificado: false,
      tokenVerificacion: token,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('debe verificar el email exitosamente', async () => {
      clienteRepository.findByFilters.mockResolvedValue([clienteMock]);
      clienteRepository.verificarEmail.mockResolvedValue(true);

      const result = await useCase.execute(token);

      expect(result).toEqual({ message: 'Email verificado exitosamente' });
      expect(clienteRepository.findByFilters).toHaveBeenCalledWith({
        tokenVerificacion: token,
      });
      expect(clienteRepository.verificarEmail).toHaveBeenCalledWith(
        clienteMock.id,
        token,
      );
    });

    it('debe lanzar BadRequestException si no se proporciona token', async () => {
      await expect(useCase.execute('')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute('')).rejects.toThrow(
        'Token de verificación requerido',
      );

      await expect(useCase.execute(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(undefined as any)).rejects.toThrow(
        BadRequestException,
      );

      expect(clienteRepository.findByFilters).not.toHaveBeenCalled();
      expect(clienteRepository.verificarEmail).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el token no existe', async () => {
      clienteRepository.findByFilters.mockResolvedValue([]);

      await expect(useCase.execute(token)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(token)).rejects.toThrow(
        'Token de verificación inválido o expirado',
      );

      expect(clienteRepository.findByFilters).toHaveBeenCalledWith({
        tokenVerificacion: token,
      });
      expect(clienteRepository.verificarEmail).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si findByFilters devuelve null', async () => {
      clienteRepository.findByFilters.mockResolvedValue(null as any);

      await expect(useCase.execute(token)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(token)).rejects.toThrow(
        'Token de verificación inválido o expirado',
      );

      expect(clienteRepository.verificarEmail).not.toHaveBeenCalled();
    });

    it('debe devolver mensaje si el email ya está verificado', async () => {
      const clienteVerificado = new Cliente({
        ...clienteMock.toObject(),
        emailVerificado: true,
      });

      clienteRepository.findByFilters.mockResolvedValue([clienteVerificado]);

      const result = await useCase.execute(token);

      expect(result).toEqual({
        message: 'El email ya ha sido verificado anteriormente',
      });
      expect(clienteRepository.findByFilters).toHaveBeenCalledWith({
        tokenVerificacion: token,
      });
      expect(clienteRepository.verificarEmail).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si la verificación falla', async () => {
      clienteRepository.findByFilters.mockResolvedValue([clienteMock]);
      clienteRepository.verificarEmail.mockResolvedValue(false);

      await expect(useCase.execute(token)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(token)).rejects.toThrow(
        'No se pudo verificar el email',
      );

      expect(clienteRepository.findByFilters).toHaveBeenCalledWith({
        tokenVerificacion: token,
      });
      expect(clienteRepository.verificarEmail).toHaveBeenCalledWith(
        clienteMock.id,
        token,
      );
    });

    it('debe usar el primer cliente si findByFilters devuelve múltiples resultados', async () => {
      const cliente2 = new Cliente({
        id: '456',
        nombre: 'María',
        apellido: 'González',
        email: 'maria@example.com',
        emailVerificado: false,
        tokenVerificacion: token,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      clienteRepository.findByFilters.mockResolvedValue([
        clienteMock,
        cliente2,
      ]);
      clienteRepository.verificarEmail.mockResolvedValue(true);

      const result = await useCase.execute(token);

      expect(result).toEqual({ message: 'Email verificado exitosamente' });
      expect(clienteRepository.verificarEmail).toHaveBeenCalledWith(
        clienteMock.id,
        token,
      );
      expect(clienteRepository.verificarEmail).not.toHaveBeenCalledWith(
        cliente2.id,
        token,
      );
    });

    it('debe manejar errores del repositorio correctamente', async () => {
      const error = new Error('Error de base de datos');
      clienteRepository.findByFilters.mockRejectedValue(error);

      await expect(useCase.execute(token)).rejects.toThrow(error);

      expect(clienteRepository.verificarEmail).not.toHaveBeenCalled();
    });

    it('debe procesar correctamente tokens con caracteres especiales', async () => {
      const tokenEspecial = 'token-con-@#$%^&*()_+caracteres-especiales';
      const clienteConTokenEspecial = new Cliente({
        ...clienteMock.toObject(),
        tokenVerificacion: tokenEspecial,
      });

      clienteRepository.findByFilters.mockResolvedValue([
        clienteConTokenEspecial,
      ]);
      clienteRepository.verificarEmail.mockResolvedValue(true);

      const result = await useCase.execute(tokenEspecial);

      expect(result).toEqual({ message: 'Email verificado exitosamente' });
      expect(clienteRepository.findByFilters).toHaveBeenCalledWith({
        tokenVerificacion: tokenEspecial,
      });
      expect(clienteRepository.verificarEmail).toHaveBeenCalledWith(
        clienteConTokenEspecial.id,
        tokenEspecial,
      );
    });
  });
});
