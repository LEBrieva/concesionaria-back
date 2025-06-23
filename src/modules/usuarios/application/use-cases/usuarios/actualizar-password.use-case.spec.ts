import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ActualizarPasswordUseCase } from './actualizar-password.use-case';
import { IUsuarioRepository } from '../../../domain/usuario.repository';
import { PasswordService } from '../../../../shared/services/password.service';
import { ActualizarPasswordDto } from '../../dtos/usuarios/actualizar/actualizar-password.dto';
import { Usuario } from '../../../domain/usuario.entity';
import { RolUsuario } from '../../../domain/usuario.enum';
import { UsuarioProps } from '../../../domain/usuario.interfaces';

describe('ActualizarPasswordUseCase', () => {
  let useCase: ActualizarPasswordUseCase;
  let mockUsuarioRepository: any;
  let mockPasswordService: any;

  const existingUsuarioProps: UsuarioProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com',
    password: 'hashed_current_password',
    telefono: '+1234567890',
    rol: RolUsuario.CLIENTE,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    createdBy: 'system',
    updatedBy: 'system',
    active: true,
  };

  const existingUsuario = new Usuario(existingUsuarioProps);

  beforeEach(async () => {
    // Crear mocks
    mockUsuarioRepository = {
      findOneById: jest.fn(),
      actualizar: jest.fn(),
      obtenerPorEmail: jest.fn(),
      crear: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      eliminar: jest.fn(),
    };

    mockPasswordService = {
      hashPassword: jest.fn(),
      verifyPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActualizarPasswordUseCase,
        {
          provide: 'IUsuarioRepository',
          useValue: mockUsuarioRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    useCase = module.get<ActualizarPasswordUseCase>(ActualizarPasswordUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const usuarioId = existingUsuarioProps.id;
    const updatedBy = 'admin-123';

    const validDto: ActualizarPasswordDto = {
      currentPassword: 'currentPassword123',
      newPassword: 'newPassword123',
    };

    describe('actualización exitosa', () => {
      it('debería actualizar la contraseña exitosamente', async () => {
        // Arrange
        const hashedNewPassword = 'hashed_new_password';
        
        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(true);
        mockPasswordService.hashPassword.mockResolvedValue(hashedNewPassword);
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act
        const result = await useCase.execute(usuarioId, validDto, updatedBy);

        // Assert
        expect(result).toBeInstanceOf(Usuario);
        expect(result.password).toBe(hashedNewPassword);
        expect(result.password).not.toBe(validDto.newPassword);
        expect(result.password).not.toBe(existingUsuarioProps.password);
        expect(result.updatedBy).toBe(updatedBy);
        expect(result.updatedAt).toBeInstanceOf(Date);

        // Otros campos no deben cambiar
        expect(result.nombre).toBe(existingUsuarioProps.nombre);
        expect(result.email).toBe(existingUsuarioProps.email);
        expect(result.id).toBe(existingUsuarioProps.id);

        // Verificar llamadas
        expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith(usuarioId);
        expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
          validDto.currentPassword,
          existingUsuario.password
        );
        expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(validDto.newPassword);
        expect(mockUsuarioRepository.actualizar).toHaveBeenCalledWith(usuarioId, expect.any(Usuario));
      });

      it('debería actualizar solo la contraseña manteniendo otros campos', async () => {
        // Arrange
        const hashedNewPassword = 'super_secure_new_password';
        
        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(true);
        mockPasswordService.hashPassword.mockResolvedValue(hashedNewPassword);
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act
        const result = await useCase.execute(usuarioId, validDto, updatedBy);

        // Assert
        expect(result.password).toBe(hashedNewPassword);
        expect(result.updatedBy).toBe(updatedBy);
        
        // Todos los demás campos deben permanecer iguales
        expect(result.nombre).toBe(existingUsuarioProps.nombre);
        expect(result.apellido).toBe(existingUsuarioProps.apellido);
        expect(result.email).toBe(existingUsuarioProps.email);
        expect(result.telefono).toBe(existingUsuarioProps.telefono);
        expect(result.rol).toBe(existingUsuarioProps.rol);
        expect(result.id).toBe(existingUsuarioProps.id);
        expect(result.createdAt).toBe(existingUsuarioProps.createdAt);
        expect(result.createdBy).toBe(existingUsuarioProps.createdBy);
        expect(result.active).toBe(existingUsuarioProps.active);
      });

      it('debería generar nueva fecha de actualización', async () => {
        // Arrange
        const hashedNewPassword = 'hashed_new_password';
        
        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(true);
        mockPasswordService.hashPassword.mockResolvedValue(hashedNewPassword);
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act
        const result = await useCase.execute(usuarioId, validDto, updatedBy);

        // Assert
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(result.updatedAt.getTime()).toBeGreaterThan(existingUsuarioProps.updatedAt!.getTime());
      });
    });

    describe('validación de usuario existente', () => {
      it('debería lanzar NotFoundException si el usuario no existe', async () => {
        // Arrange
        mockUsuarioRepository.findOneById.mockResolvedValue(null);

        // Act & Assert
        await expect(useCase.execute(usuarioId, validDto, updatedBy)).rejects.toThrow(NotFoundException);
        await expect(useCase.execute(usuarioId, validDto, updatedBy)).rejects.toThrow('Usuario no encontrado');

        // No debería verificar password ni actualizar
        expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
        expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
        expect(mockUsuarioRepository.actualizar).not.toHaveBeenCalled();
      });

      it('debería lanzar NotFoundException si findOneById retorna undefined', async () => {
        // Arrange
        mockUsuarioRepository.findOneById.mockResolvedValue(undefined);

        // Act & Assert
        await expect(useCase.execute(usuarioId, validDto, updatedBy)).rejects.toThrow(NotFoundException);
      });
    });

    describe('validación de contraseña actual', () => {
      it('debería lanzar BadRequestException si la contraseña actual es incorrecta', async () => {
        // Arrange
        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(false);

        // Act & Assert
        await expect(useCase.execute(usuarioId, validDto, updatedBy)).rejects.toThrow(BadRequestException);
        await expect(useCase.execute(usuarioId, validDto, updatedBy)).rejects.toThrow(
          'La contraseña actual es incorrecta'
        );

        // No debería hashear la nueva contraseña ni actualizar
        expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
        expect(mockUsuarioRepository.actualizar).not.toHaveBeenCalled();
      });

      it('debería verificar la contraseña actual contra la hasheada', async () => {
        // Arrange
        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(false);

        // Act & Assert
        await expect(useCase.execute(usuarioId, validDto, updatedBy)).rejects.toThrow(BadRequestException);

        // Verificar que se llamó con los parámetros correctos
        expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
          validDto.currentPassword,
          existingUsuario.password
        );
      });
    });

    describe('validación de nueva contraseña', () => {
      it('debería validar que la nueva contraseña cumpla con las reglas de dominio', async () => {
        // Arrange
        const dtoWithShortPassword: ActualizarPasswordDto = {
          currentPassword: 'currentPassword123',
          newPassword: '123', // Contraseña muy corta
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(true);
        // Mock que retorna un hash corto para que falle la validación de la entidad
        mockPasswordService.hashPassword.mockResolvedValue('123');

        // Act & Assert
        // La validación ocurre cuando se crea la nueva instancia de Usuario con el hash
        await expect(useCase.execute(usuarioId, dtoWithShortPassword, updatedBy)).rejects.toThrow(
          'La contraseña debe tener al menos 8 caracteres'
        );

        // No debería actualizar si la validación falla
        expect(mockUsuarioRepository.actualizar).not.toHaveBeenCalled();
      });

      it('debería validar que la nueva contraseña no esté vacía', async () => {
        // Arrange
        const dtoWithEmptyPassword: ActualizarPasswordDto = {
          currentPassword: 'currentPassword123',
          newPassword: '',
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(true);
        mockPasswordService.hashPassword.mockResolvedValue('');

        // Act & Assert
        await expect(useCase.execute(usuarioId, dtoWithEmptyPassword, updatedBy)).rejects.toThrow(
          'La contraseña es requerida'
        );
      });

      it('debería aceptar contraseñas válidas de 8+ caracteres', async () => {
        // Arrange
        const passwordsValidas = ['12345678', 'password123', 'MiContraseñaSegura!', 'P@ssw0rd2023'];

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(true);
        mockPasswordService.hashPassword.mockResolvedValue('hashed_valid_password');
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act & Assert
        for (const newPassword of passwordsValidas) {
          const dto = { ...validDto, newPassword };
          const result = await useCase.execute(usuarioId, dto, updatedBy);
          
          expect(result.password).toBe('hashed_valid_password');
          expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(newPassword);
        }
      });
    });

    describe('manejo de errores', () => {
      it('debería propagar errores del repository en findOneById', async () => {
        // Arrange
        const repositoryError = new Error('Error de conexión a BD');
        mockUsuarioRepository.findOneById.mockRejectedValue(repositoryError);

        // Act & Assert
        await expect(useCase.execute(usuarioId, validDto, updatedBy)).rejects.toThrow('Error de conexión a BD');
      });

      it('debería propagar errores del PasswordService en verifyPassword', async () => {
        // Arrange
        const verifyError = new Error('Error al verificar contraseña');
        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockRejectedValue(verifyError);

        // Act & Assert
        await expect(useCase.execute(usuarioId, validDto, updatedBy)).rejects.toThrow('Error al verificar contraseña');
      });

      it('debería propagar errores del PasswordService en hashPassword', async () => {
        // Arrange
        const hashError = new Error('Error al hashear nueva contraseña');
        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(true);
        mockPasswordService.hashPassword.mockRejectedValue(hashError);

        // Act & Assert
        await expect(useCase.execute(usuarioId, validDto, updatedBy)).rejects.toThrow('Error al hashear nueva contraseña');
      });

      it('debería propagar errores del repository en actualizar', async () => {
        // Arrange
        const updateError = new Error('Error al actualizar usuario en BD');
        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(true);
        mockPasswordService.hashPassword.mockResolvedValue('hashed_new_password');
        mockUsuarioRepository.actualizar.mockRejectedValue(updateError);

        // Act & Assert
        await expect(useCase.execute(usuarioId, validDto, updatedBy)).rejects.toThrow('Error al actualizar usuario en BD');
      });
    });

    describe('casos edge', () => {
      it('debería manejar contraseñas con caracteres especiales', async () => {
        // Arrange
        const dtoWithSpecialChars: ActualizarPasswordDto = {
          currentPassword: 'currentPassword123',
          newPassword: 'P@ssw0rd!#$%&*()_+-=[]{}|;:,.<>?',
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(true);
        mockPasswordService.hashPassword.mockResolvedValue('hashed_special_password');
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act
        const result = await useCase.execute(usuarioId, dtoWithSpecialChars, updatedBy);

        // Assert
        expect(result.password).toBe('hashed_special_password');
        expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(dtoWithSpecialChars.newPassword);
      });

      it('debería manejar contraseñas con espacios', async () => {
        // Arrange
        const dtoWithSpaces: ActualizarPasswordDto = {
          currentPassword: 'currentPassword123',
          newPassword: 'mi contraseña con espacios',
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(true);
        mockPasswordService.hashPassword.mockResolvedValue('hashed_spaced_password');
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act
        const result = await useCase.execute(usuarioId, dtoWithSpaces, updatedBy);

        // Assert
        expect(result.password).toBe('hashed_spaced_password');
      });

      it('debería manejar el mismo updatedBy que createdBy', async () => {
        // Arrange
        const sameUpdatedBy = existingUsuarioProps.createdBy;
        
        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.verifyPassword.mockResolvedValue(true);
        mockPasswordService.hashPassword.mockResolvedValue('hashed_new_password');
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act
        const result = await useCase.execute(usuarioId, validDto, sameUpdatedBy);

        // Assert
        expect(result.updatedBy).toBe(sameUpdatedBy);
        expect(result.createdBy).toBe(existingUsuarioProps.createdBy);
      });
    });
  });
}); 