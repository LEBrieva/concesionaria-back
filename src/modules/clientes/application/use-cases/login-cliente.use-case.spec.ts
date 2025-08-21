import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginClienteUseCase } from './login-cliente.use-case';
import {
  ClienteRepository,
  CLIENTE_REPOSITORY,
} from '../../domain/cliente.repository';
import { PasswordService } from '../../../shared/services/password.service';
import { LoginClienteDto } from '../dtos/auth/login-cliente.dto';
import { Cliente } from '../../domain/cliente.entity';

describe('LoginClienteUseCase', () => {
  let useCase: LoginClienteUseCase;
  let clienteRepository: jest.Mocked<ClienteRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginClienteUseCase,
        {
          provide: CLIENTE_REPOSITORY,
          useValue: {
            findByEmail: jest.fn(),
            actualizarUltimaActividad: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            verifyPassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<LoginClienteUseCase>(LoginClienteUseCase);
    clienteRepository = module.get(CLIENTE_REPOSITORY);
    passwordService = module.get(PasswordService);
    jwtService = module.get(JwtService);
  });

  describe('execute', () => {
    const dto: LoginClienteDto = {
      email: 'juan@example.com',
      password: 'password123',
    };

    const clienteMock = new Cliente({
      id: '123',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: dto.email,
      password: 'hashedPassword',
      emailVerificado: true,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('debe iniciar sesión exitosamente', async () => {
      const accessToken = 'jwt.token.here';

      clienteRepository.findByEmail.mockResolvedValue(clienteMock);
      passwordService.verifyPassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue(accessToken);
      clienteRepository.actualizarUltimaActividad.mockResolvedValue(
        clienteMock,
      );

      const result = await useCase.execute(dto);

      expect(result).toBeDefined();
      expect(result.access_token).toBe(accessToken);
      expect(result.cliente).toEqual({
        id: clienteMock.id,
        nombre: clienteMock.nombre,
        apellido: clienteMock.apellido,
        email: clienteMock.email,
        emailVerificado: clienteMock.emailVerificado,
      });

      expect(clienteRepository.findByEmail).toHaveBeenCalledWith(
        dto.email.toLowerCase(),
      );
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(
        dto.password,
        clienteMock.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: clienteMock.id,
        email: clienteMock.email,
        nombre: clienteMock.nombre,
        apellido: clienteMock.apellido,
        tipo: 'cliente',
      });
      expect(clienteRepository.actualizarUltimaActividad).toHaveBeenCalledWith(
        clienteMock.id,
      );
    });

    it('debe lanzar UnauthorizedException si el cliente no existe', async () => {
      clienteRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Credenciales inválidas',
      );

      expect(passwordService.verifyPassword).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException si el cliente está inactivo', async () => {
      const clienteInactivo = new Cliente({
        ...clienteMock.toObject(),
        active: false,
      });

      clienteRepository.findByEmail.mockResolvedValue(clienteInactivo);

      await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Tu cuenta ha sido desactivada',
      );

      expect(passwordService.verifyPassword).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException si el cliente no tiene contraseña', async () => {
      const clienteSinPassword = new Cliente({
        id: '123',
        nombre: 'Juan',
        apellido: 'Pérez',
        email: dto.email,
        password: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      clienteRepository.findByEmail.mockResolvedValue(clienteSinPassword);

      await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Este cliente no tiene contraseña configurada',
      );

      expect(passwordService.verifyPassword).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      clienteRepository.findByEmail.mockResolvedValue(clienteMock);
      passwordService.verifyPassword.mockResolvedValue(false);

      await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Credenciales inválidas',
      );

      expect(passwordService.verifyPassword).toHaveBeenCalledWith(
        dto.password,
        clienteMock.password,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(
        clienteRepository.actualizarUltimaActividad,
      ).not.toHaveBeenCalled();
    });

    it('debe convertir el email a minúsculas antes de buscar', async () => {
      const dtoConEmailMayusculas = {
        email: 'JUAN@EXAMPLE.COM',
        password: 'password123',
      };

      clienteRepository.findByEmail.mockResolvedValue(clienteMock);
      passwordService.verifyPassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('token');

      await useCase.execute(dtoConEmailMayusculas);

      expect(clienteRepository.findByEmail).toHaveBeenCalledWith(
        'juan@example.com',
      );
    });

    it('debe incluir todos los campos necesarios en el payload del JWT', async () => {
      clienteRepository.findByEmail.mockResolvedValue(clienteMock);
      passwordService.verifyPassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('token');

      await useCase.execute(dto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: clienteMock.id,
        email: clienteMock.email,
        nombre: clienteMock.nombre,
        apellido: clienteMock.apellido,
        tipo: 'cliente',
      });
    });
  });
});
