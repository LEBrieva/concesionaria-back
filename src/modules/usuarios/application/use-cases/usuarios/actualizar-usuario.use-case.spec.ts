import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ActualizarUsuarioUseCase } from './actualizar-usuario.use-case';
import { IUsuarioRepository } from '../../../domain/usuario.repository';
import { PasswordService } from '../../../../shared/services/password.service';
import { ActualizarUsuarioDto } from '../../dtos/usuarios/actualizar/actualizar-usuario.dto';
import { Usuario } from '../../../domain/usuario.entity';
import { RolUsuario } from '../../../domain/usuario.enum';
import { UsuarioProps } from '../../../domain/usuario.interfaces';
import { HistorialService } from '../../../../shared/services/historial.service';
import { IHistorialRepository } from '../../../../shared/interfaces/historial-repository.interface';
import { TipoEntidad, TipoAccion } from '../../../../shared/entities/historial.entity';

describe('ActualizarUsuarioUseCase', () => {
  let useCase: ActualizarUsuarioUseCase;
  let mockUsuarioRepository: any;
  let mockPasswordService: any;
  let mockHistorialRepository: jest.Mocked<IHistorialRepository>;
  let historialService: HistorialService;

  const existingUsuarioProps: UsuarioProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com',
    password: 'hashed_old_password',
    telefono: '+1234567890',
    rol: RolUsuario.CLIENTE,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    createdBy: 'system',
    updatedBy: 'system',
    active: true,
  };

  const existingUsuario = new Usuario(existingUsuarioProps);

  const mockHistorial = {
    id: 'historial-123',
    createdAt: new Date(),
  };

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

    mockHistorialRepository = {
      crear: jest.fn(),
      obtenerHistorialCompleto: jest.fn(),
      obtenerPorEntidadYTipoAccion: jest.fn(),
      obtenerPorEntidad: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findOneById: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActualizarUsuarioUseCase,
        HistorialService,
        {
          provide: 'IUsuarioRepository',
          useValue: mockUsuarioRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: 'IHistorialRepository',
          useValue: mockHistorialRepository,
        },
      ],
    }).compile();

    useCase = module.get<ActualizarUsuarioUseCase>(ActualizarUsuarioUseCase);
    historialService = module.get<HistorialService>(HistorialService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const userId = 'updater-123';
    const usuarioId = existingUsuarioProps.id;

    describe('actualización exitosa', () => {
      it('debería actualizar un usuario exitosamente y registrar cambios en historial', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          nombre: 'Carlos',
          telefono: '+9876543210',
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);
        mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

        // Act
        const result = await useCase.execute(usuarioId, updateDto, userId);

        // Assert
        expect(result).toBeInstanceOf(Usuario);
        expect(result.nombre).toBe(updateDto.nombre);
        expect(result.telefono).toBe(updateDto.telefono);
        expect(result.updatedBy).toBe(userId);
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(result.updatedAt.getTime()).toBeGreaterThan(existingUsuarioProps.updatedAt!.getTime());

        // Propiedades no actualizadas deben mantenerse
        expect(result.apellido).toBe(existingUsuarioProps.apellido);
        expect(result.email).toBe(existingUsuarioProps.email);
        expect(result.rol).toBe(existingUsuarioProps.rol);
        expect(result.id).toBe(existingUsuarioProps.id);

        // Verificar llamadas
        expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith(usuarioId);
        expect(mockUsuarioRepository.actualizar).toHaveBeenCalledWith(usuarioId, expect.any(Usuario));
        expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();

        // Verificar que se registraron los cambios en el historial (2 campos cambiaron)
        expect(mockHistorialRepository.crear).toHaveBeenCalledTimes(2);
        
        // Verificar registro del cambio de nombre
        expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
          expect.objectContaining({
            props: expect.objectContaining({
              entidadId: usuarioId,
              tipoEntidad: TipoEntidad.USUARIO,
              tipoAccion: TipoAccion.ACTUALIZAR,
              campoAfectado: 'nombre',
              valorAnterior: 'Juan',
              valorNuevo: 'Carlos',
              observaciones: "Campo 'nombre' actualizado",
              createdBy: userId,
            }),
          })
        );

        // Verificar registro del cambio de teléfono
        expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
          expect.objectContaining({
            props: expect.objectContaining({
              entidadId: usuarioId,
              tipoEntidad: TipoEntidad.USUARIO,
              tipoAccion: TipoAccion.ACTUALIZAR,
              campoAfectado: 'telefono',
              valorAnterior: '+1234567890',
              valorNuevo: '+9876543210',
              observaciones: "Campo 'telefono' actualizado",
              createdBy: userId,
            }),
          })
        );
      });

      it('debería actualizar un usuario con nueva contraseña y registrar en historial', async () => {
        // Arrange
        const newPassword = 'newPassword123';
        const hashedNewPassword = 'hashed_new_password';
        const updateDto: ActualizarUsuarioDto = {
          nombre: 'Carlos',
          password: newPassword,
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.hashPassword.mockResolvedValue(hashedNewPassword);
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);
        mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

        // Act
        const result = await useCase.execute(usuarioId, updateDto, userId);

        // Assert
        expect(result.nombre).toBe(updateDto.nombre);
        expect(result.password).toBe(hashedNewPassword);
        expect(result.password).not.toBe(newPassword);
        expect(result.updatedBy).toBe(userId);

        // Verificar llamadas
        expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(newPassword);
        expect(mockUsuarioRepository.actualizar).toHaveBeenCalledWith(usuarioId, expect.any(Usuario));

        // Verificar que se registraron los cambios en el historial (nombre + password)
        expect(mockHistorialRepository.crear).toHaveBeenCalledTimes(2);

        // Verificar registro del cambio de contraseña (valores protegidos)
        expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
          expect.objectContaining({
            props: expect.objectContaining({
              entidadId: usuarioId,
              tipoEntidad: TipoEntidad.USUARIO,
              tipoAccion: TipoAccion.ACTUALIZAR,
              campoAfectado: 'password',
              valorAnterior: '[PROTEGIDO]',
              valorNuevo: '[ACTUALIZADO]',
              observaciones: "Campo 'password' actualizado",
              createdBy: userId,
            }),
          })
        );
      });

      it('no debería registrar historial si no hay cambios', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          nombre: 'Juan', // Mismo nombre que ya tiene
          telefono: '+1234567890', // Mismo teléfono que ya tiene
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act
        const result = await useCase.execute(usuarioId, updateDto, userId);

        // Assert
        expect(result).toBeInstanceOf(Usuario);
        expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith(usuarioId);
        expect(mockUsuarioRepository.actualizar).toHaveBeenCalledWith(usuarioId, expect.any(Usuario));
        
        // No debe registrar historial si no hay cambios
        expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
      });

      it('debería actualizar múltiples campos correctamente', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          nombre: 'Pedro',
          apellido: 'González',
          telefono: '+5555555555',
          rol: RolUsuario.VENDEDOR,
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act
        const result = await useCase.execute(usuarioId, updateDto, userId);

        // Assert
        expect(result.nombre).toBe(updateDto.nombre);
        expect(result.apellido).toBe(updateDto.apellido);
        expect(result.telefono).toBe(updateDto.telefono);
        expect(result.rol).toBe(updateDto.rol);
        expect(result.updatedBy).toBe(userId);

        // Email no debería cambiar
        expect(result.email).toBe(existingUsuarioProps.email);
      });

      it('debería actualizar solo los campos proporcionados', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          telefono: '+1111111111',
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act
        const result = await useCase.execute(usuarioId, updateDto, userId);

        // Assert
        expect(result.telefono).toBe(updateDto.telefono);
        expect(result.updatedBy).toBe(userId);

        // Otros campos no deben cambiar
        expect(result.nombre).toBe(existingUsuarioProps.nombre);
        expect(result.apellido).toBe(existingUsuarioProps.apellido);
        expect(result.email).toBe(existingUsuarioProps.email);
        expect(result.rol).toBe(existingUsuarioProps.rol);
      });

      it('debería mantener el ID original del usuario', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          nombre: 'Nuevo Nombre',
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act
        const result = await useCase.execute(usuarioId, updateDto, userId);

        // Assert
        expect(result.id).toBe(existingUsuarioProps.id);
      });
    });

    describe('validación de usuario existente', () => {
      it('debería lanzar NotFoundException si el usuario no existe', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          nombre: 'Carlos',
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(null);

        // Act & Assert
        await expect(useCase.execute(usuarioId, updateDto, userId)).rejects.toThrow(NotFoundException);
        await expect(useCase.execute(usuarioId, updateDto, userId)).rejects.toThrow('Usuario no encontrado');

        // No debería llamar a actualizar si el usuario no existe
        expect(mockUsuarioRepository.actualizar).not.toHaveBeenCalled();
        expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
      });

      it('debería lanzar NotFoundException si findOneById retorna undefined', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          nombre: 'Carlos',
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(undefined);

        // Act & Assert
        await expect(useCase.execute(usuarioId, updateDto, userId)).rejects.toThrow(NotFoundException);
      });
    });

    describe('validación de dominio', () => {
      it('debería validar los datos actualizados usando la entidad', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          nombre: 'NombreVálido',
          rol: 'ROL_INVALIDO' as any, // Rol inválido
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);

        // Act & Assert
        await expect(useCase.execute(usuarioId, updateDto, userId)).rejects.toThrow(
          'El rol del usuario es requerido y debe ser válido'
        );

        // No debería llamar a actualizar si la validación falla
        expect(mockUsuarioRepository.actualizar).not.toHaveBeenCalled();
      });

      it('debería validar contraseña corta', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          password: '123',
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        // Mock que retorna un hash corto para que falle la validación de la entidad
        mockPasswordService.hashPassword.mockResolvedValue('123');

        // Act & Assert
        // Nota: La validación ocurre en la entidad Usuario cuando se crea la nueva instancia
        await expect(useCase.execute(usuarioId, updateDto, userId)).rejects.toThrow(
          'La contraseña debe tener al menos 8 caracteres'
        );
      });

      it('debería validar nombre vacío', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          nombre: '',
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);

        // Act & Assert
        await expect(useCase.execute(usuarioId, updateDto, userId)).rejects.toThrow(
          'El nombre es requerido'
        );
      });
    });

    describe('manejo de errores', () => {
      it('debería propagar errores del repository en findOneById', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          nombre: 'Carlos',
        };
        const repositoryError = new Error('Error de conexión a BD');
        mockUsuarioRepository.findOneById.mockRejectedValue(repositoryError);

        // Act & Assert
        await expect(useCase.execute(usuarioId, updateDto, userId)).rejects.toThrow('Error de conexión a BD');
      });

      it('debería propagar errores del PasswordService', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          password: 'newPassword123',
        };
        const passwordError = new Error('Error al hashear contraseña');

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockPasswordService.hashPassword.mockRejectedValue(passwordError);

        // Act & Assert
        await expect(useCase.execute(usuarioId, updateDto, userId)).rejects.toThrow('Error al hashear contraseña');
      });

      it('debería propagar errores del repository en actualizar', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          nombre: 'Carlos',
        };
        const updateError = new Error('Error al actualizar usuario en BD');

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockUsuarioRepository.actualizar.mockRejectedValue(updateError);

        // Act & Assert
        await expect(useCase.execute(usuarioId, updateDto, userId)).rejects.toThrow('Error al actualizar usuario en BD');
      });
    });

    describe('casos edge', () => {
      it('debería manejar DTO vacío sin cambios', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {};

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act
        const result = await useCase.execute(usuarioId, updateDto, userId);

        // Assert
        expect(result.nombre).toBe(existingUsuarioProps.nombre);
        expect(result.apellido).toBe(existingUsuarioProps.apellido);
        expect(result.email).toBe(existingUsuarioProps.email);
        expect(result.telefono).toBe(existingUsuarioProps.telefono);
        expect(result.rol).toBe(existingUsuarioProps.rol);
        expect(result.updatedBy).toBe(userId);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });

      it('debería manejar actualizaciones sin contraseña', async () => {
        // Arrange
        const updateDto: ActualizarUsuarioDto = {
          nombre: 'Carlos',
          // Sin password en el DTO
        };

        mockUsuarioRepository.findOneById.mockResolvedValue(existingUsuario);
        mockUsuarioRepository.actualizar.mockImplementation(async (id, usuario) => usuario);

        // Act
        const result = await useCase.execute(usuarioId, updateDto, userId);

        // Assert
        expect(result.nombre).toBe(updateDto.nombre);
        expect(result.password).toBe(existingUsuarioProps.password); // Password original
        expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
      });
    });
  });
}); 