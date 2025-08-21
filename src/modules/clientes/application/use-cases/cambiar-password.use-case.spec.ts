import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CambiarPasswordUseCase } from './cambiar-password.use-case';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { PasswordService } from '../../../shared/services/password.service';
import { CambiarPasswordDto } from '../dtos/perfil/cambiar-password.dto';
import { Cliente } from '../../domain/cliente.entity';

describe('CambiarPasswordUseCase', () => {
  let useCase: CambiarPasswordUseCase;
  let clienteRepository: jest.Mocked<ClienteRepository>;
  let passwordService: jest.Mocked<PasswordService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CambiarPasswordUseCase,
        {
          provide: CLIENTE_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            verifyPassword: jest.fn(),
            hashPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CambiarPasswordUseCase>(CambiarPasswordUseCase);
    clienteRepository = module.get(CLIENTE_REPOSITORY);
    passwordService = module.get(PasswordService);
  });

  describe('execute', () => {
    const clienteId = '123';
    const dto: CambiarPasswordDto = {
      passwordActual: 'password123',
      passwordNueva: 'newPassword456',
    };

    const clienteMock = new Cliente({
      id: clienteId,
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      password: 'hashedOldPassword',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('debe cambiar la contraseña exitosamente', async () => {
      const hashedNewPassword = 'hashedNewPassword';

      clienteRepository.findById.mockResolvedValue(clienteMock);
      passwordService.verifyPassword.mockResolvedValue(true);
      passwordService.hashPassword.mockResolvedValue(hashedNewPassword);
      clienteRepository.update.mockResolvedValue(clienteMock);

      const result = await useCase.execute(clienteId, dto);

      expect(result).toEqual({
        message: 'Contraseña actualizada exitosamente',
      });
      expect(clienteRepository.findById).toHaveBeenCalledWith(clienteId);
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(
        dto.passwordActual,
        'hashedOldPassword',
      );
      expect(passwordService.hashPassword).toHaveBeenCalledWith(
        dto.passwordNueva,
      );
      expect(clienteRepository.update).toHaveBeenCalledWith(
        clienteId,
        expect.objectContaining({
          password: hashedNewPassword,
        }),
      );
    });

    it('debe lanzar NotFoundException si el cliente no existe', async () => {
      clienteRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        'Cliente no encontrado',
      );

      expect(passwordService.verifyPassword).not.toHaveBeenCalled();
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
      expect(clienteRepository.update).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el cliente está inactivo', async () => {
      const clienteInactivo = new Cliente({
        ...clienteMock.toObject(),
        active: false,
      });

      clienteRepository.findById.mockResolvedValue(clienteInactivo);

      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        'Cliente no encontrado',
      );

      expect(passwordService.verifyPassword).not.toHaveBeenCalled();
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
      expect(clienteRepository.update).not.toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException si el cliente no tiene contraseña configurada', async () => {
      const clienteSinPassword = new Cliente({
        ...clienteMock.toObject(),
        password: null,
      });

      clienteRepository.findById.mockResolvedValue(clienteSinPassword);

      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        'Este cliente no tiene contraseña configurada',
      );

      expect(passwordService.verifyPassword).not.toHaveBeenCalled();
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
      expect(clienteRepository.update).not.toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException si la contraseña actual es incorrecta', async () => {
      clienteRepository.findById.mockResolvedValue(clienteMock);
      passwordService.verifyPassword.mockResolvedValue(false);

      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(useCase.execute(clienteId, dto)).rejects.toThrow(
        'La contraseña actual es incorrecta',
      );

      expect(passwordService.verifyPassword).toHaveBeenCalledWith(
        dto.passwordActual,
        clienteMock.password,
      );
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
      expect(clienteRepository.update).not.toHaveBeenCalled();
    });

    it('debe actualizar la última actividad al cambiar la contraseña', async () => {
      clienteRepository.findById.mockResolvedValue(clienteMock);
      passwordService.verifyPassword.mockResolvedValue(true);
      passwordService.hashPassword.mockResolvedValue('hashedNewPassword');
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

    it('debe actualizar correctamente el objeto cliente con la nueva contraseña', async () => {
      const hashedNewPassword = 'superSecureHashedPassword';

      clienteRepository.findById.mockResolvedValue(clienteMock);
      passwordService.verifyPassword.mockResolvedValue(true);
      passwordService.hashPassword.mockResolvedValue(hashedNewPassword);
      clienteRepository.update.mockImplementation(
        async (id, cliente) => cliente,
      );

      await useCase.execute(clienteId, dto);

      const clienteActualizado = (clienteRepository.update as jest.Mock).mock
        .calls[0][1];

      expect(clienteActualizado.password).toBe(hashedNewPassword);
      expect(clienteActualizado.nombre).toBe(clienteMock.nombre);
      expect(clienteActualizado.apellido).toBe(clienteMock.apellido);
      expect(clienteActualizado.email).toBe(clienteMock.email);
    });
  });
});
