import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { CrearUsuarioUseCase } from './crear-usuario.use-case';
import { PasswordService } from '@shared/services/password.service';
import { CrearUsuarioDto } from '../dtos/crear-usuario.dto';
import { RolUsuario } from '../../domain/usuario.enum';
import { Usuario } from '../../domain/usuario.entity';
import { AuthenticatedUser } from '../../../auth/domain/interfaces/authenticated-user.interface';
import { HistorialService } from '@shared/services/historial.service';
import { IHistorialRepository } from '@shared/interfaces/historial';
import { TipoEntidad, TipoAccion } from '@shared/entities/historial.entity';

describe('CrearUsuarioUseCase', () => {
  let useCase: CrearUsuarioUseCase;
  let mockUsuarioRepository: any;
  let mockPasswordService: any;
  let mockHistorialRepository: jest.Mocked<IHistorialRepository>;
  let historialService: HistorialService;

  const validCrearUsuarioDto: CrearUsuarioDto = {
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com',
    password: 'password123',
    telefono: '+1234567890',
    rol: RolUsuario.CLIENTE,
  };

  const mockAdminUser: AuthenticatedUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    nombre: 'Admin',
    rol: RolUsuario.ADMIN,
  };

  const mockVendedorUser: AuthenticatedUser = {
    id: 'vendedor-123',
    email: 'vendedor@example.com',
    nombre: 'Vendedor',
    rol: RolUsuario.VENDEDOR,
  };

  const mockClienteUser: AuthenticatedUser = {
    id: 'cliente-123',
    email: 'cliente@example.com',
    nombre: 'Cliente',
    rol: RolUsuario.CLIENTE,
  };

  const mockHistorial = {
    id: 'historial-456',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    // Crear mocks
    mockUsuarioRepository = {
      obtenerPorEmail: jest.fn(),
      crear: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findOneById: jest.fn(),
      actualizar: jest.fn(),
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
      findWithPagination: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrearUsuarioUseCase,
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

    useCase = module.get<CrearUsuarioUseCase>(CrearUsuarioUseCase);
    historialService = module.get<HistorialService>(HistorialService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    describe('creación exitosa', () => {
      it('debería crear un usuario exitosamente sin autenticación y registrar en historial', async () => {
        // Arrange
        const hashedPassword = 'hashed_password123';
        mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);
        mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
        mockUsuarioRepository.crear.mockImplementation(async (usuario) => usuario);
        mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

        // Act
        const result = await useCase.execute(validCrearUsuarioDto);

        // Assert
        expect(result).toBeInstanceOf(Usuario);
        expect(result.nombre).toBe(validCrearUsuarioDto.nombre);
        expect(result.email).toBe(validCrearUsuarioDto.email);
        expect(result.password).toBe(hashedPassword);
        expect(result.rol).toBe(RolUsuario.CLIENTE);
        expect(result.createdBy).toBe('system');
        expect(result.updatedBy).toBe('system');
        expect(result.id).toBeDefined();

        // Verificar llamadas
        expect(mockUsuarioRepository.obtenerPorEmail).toHaveBeenCalledWith(validCrearUsuarioDto.email);
        expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(validCrearUsuarioDto.password);
        expect(mockUsuarioRepository.crear).toHaveBeenCalledWith(expect.any(Usuario));

        // Verificar que se registró en el historial
        expect(mockHistorialRepository.crear).toHaveBeenCalledTimes(1);
        expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
          expect.objectContaining({
            props: expect.objectContaining({
              entidadId: result.id,
              tipoEntidad: TipoEntidad.USUARIO,
              tipoAccion: TipoAccion.CREAR,
              createdBy: 'system',
              metadata: expect.objectContaining({
                nombre: result.nombre,
                apellido: result.apellido,
                email: result.email,
                telefono: result.telefono,
                rol: result.rol,
                creadoPor: 'Sistema',
                tipoCreacion: 'self_registration',
                observaciones: `Usuario creado: ${result.nombre} ${result.apellido} - ${result.email}`,
              }),
            }),
          })
        );
      });

      it('debería crear un usuario con usuario admin autenticado y registrar en historial', async () => {
        // Arrange
        const dtoConRolAdmin = { ...validCrearUsuarioDto, rol: RolUsuario.ADMIN };
        const hashedPassword = 'hashed_password123';
        mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);
        mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
        mockUsuarioRepository.crear.mockImplementation(async (usuario) => usuario);
        mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

        // Act
        const result = await useCase.execute(dtoConRolAdmin, mockAdminUser);

        // Assert
        expect(result.rol).toBe(RolUsuario.ADMIN);
        expect(result.createdBy).toBe(mockAdminUser.id);
        expect(result.updatedBy).toBe(mockAdminUser.id);

        // Verificar que se registró en el historial con información del admin
        expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
          expect.objectContaining({
            props: expect.objectContaining({
              entidadId: result.id,
              tipoEntidad: TipoEntidad.USUARIO,
              tipoAccion: TipoAccion.CREAR,
              createdBy: mockAdminUser.id,
              metadata: expect.objectContaining({
                nombre: result.nombre,
                apellido: result.apellido,
                email: result.email,
                rol: RolUsuario.ADMIN,
                creadoPor: `${mockAdminUser.nombre} (${mockAdminUser.rol})`,
                tipoCreacion: 'admin_creation',
              }),
            }),
          })
        );
      });

      it('debería hashear la contraseña correctamente', async () => {
        // Arrange
        const hashedPassword = 'super_secure_hashed_password';
        mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);
        mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
        mockUsuarioRepository.crear.mockImplementation(async (usuario) => usuario);

        // Act
        const result = await useCase.execute(validCrearUsuarioDto);

        // Assert
        expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(validCrearUsuarioDto.password);
        expect(result.password).toBe(hashedPassword);
        expect(result.password).not.toBe(validCrearUsuarioDto.password);
      });

      it('debería generar un UUID válido para el usuario', async () => {
        // Arrange
        mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);
        mockPasswordService.hashPassword.mockResolvedValue('hashed_password');
        mockUsuarioRepository.crear.mockImplementation(async (usuario) => usuario);

        // Act
        const result = await useCase.execute(validCrearUsuarioDto);

        // Assert
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(result.id).toMatch(uuidRegex);
      });
    });

    describe('validación de email único', () => {
      it('debería lanzar ConflictException si el email ya existe', async () => {
        // Arrange
        const usuarioExistente = new Usuario({
          id: 'existing-user-id',
          nombre: 'Usuario',
          apellido: 'Existente',
          email: validCrearUsuarioDto.email,
          password: 'hashed_password',
          rol: RolUsuario.CLIENTE,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          updatedBy: 'system',
          active: true,
        });

        mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(usuarioExistente);

        // Act & Assert
        await expect(useCase.execute(validCrearUsuarioDto)).rejects.toThrow(ConflictException);
        await expect(useCase.execute(validCrearUsuarioDto)).rejects.toThrow('Ya existe un usuario con este email');

        // No debería llamar a hashPassword ni crear si el email ya existe
        expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
        expect(mockUsuarioRepository.crear).not.toHaveBeenCalled();
      });
    });

    describe('validación de permisos', () => {
      describe('sin autenticación', () => {
        it('debería permitir crear solo usuarios CLIENTE sin especificar rol', async () => {
          // Arrange
          const dtoSinRol = { ...validCrearUsuarioDto, rol: undefined };
          mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);
          mockPasswordService.hashPassword.mockResolvedValue('hashed_password');
          mockUsuarioRepository.crear.mockImplementation(async (usuario) => usuario);

          // Act
          const result = await useCase.execute(dtoSinRol);

          // Assert
          expect(result.rol).toBe(RolUsuario.CLIENTE);
        });

        it('debería permitir crear usuarios CLIENTE explícitamente', async () => {
          // Arrange
          mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);
          mockPasswordService.hashPassword.mockResolvedValue('hashed_password');
          mockUsuarioRepository.crear.mockImplementation(async (usuario) => usuario);

          // Act
          const result = await useCase.execute(validCrearUsuarioDto);

          // Assert
          expect(result.rol).toBe(RolUsuario.CLIENTE);
        });

        it('debería lanzar ForbiddenException al intentar crear ADMIN sin autenticación', async () => {
          // Arrange
          const dtoConRolAdmin = { ...validCrearUsuarioDto, rol: RolUsuario.ADMIN };
          mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);

          // Act & Assert
          await expect(useCase.execute(dtoConRolAdmin)).rejects.toThrow(ForbiddenException);
          await expect(useCase.execute(dtoConRolAdmin)).rejects.toThrow(
            'Solo se pueden crear usuarios con rol CLIENTE sin autenticación'
          );
        });

        it('debería lanzar ForbiddenException al intentar crear VENDEDOR sin autenticación', async () => {
          // Arrange
          const dtoConRolVendedor = { ...validCrearUsuarioDto, rol: RolUsuario.VENDEDOR };
          mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);

          // Act & Assert
          await expect(useCase.execute(dtoConRolVendedor)).rejects.toThrow(ForbiddenException);
        });
      });

      describe('usuario ADMIN autenticado', () => {
        it('debería permitir crear usuarios con cualquier rol', async () => {
          // Arrange
          mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);
          mockPasswordService.hashPassword.mockResolvedValue('hashed_password');
          mockUsuarioRepository.crear.mockImplementation(async (usuario) => usuario);

          const roles = [RolUsuario.ADMIN, RolUsuario.VENDEDOR, RolUsuario.CLIENTE];

          // Act & Assert
          for (const rol of roles) {
            const dto = { ...validCrearUsuarioDto, email: `test-${rol}@example.com`, rol };
            const result = await useCase.execute(dto, mockAdminUser);
            expect(result.rol).toBe(rol);
          }
        });
      });

      describe('usuario VENDEDOR autenticado', () => {
        it('debería permitir crear solo usuarios CLIENTE', async () => {
          // Arrange
          mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);
          mockPasswordService.hashPassword.mockResolvedValue('hashed_password');
          mockUsuarioRepository.crear.mockImplementation(async (usuario) => usuario);

          // Act
          const result = await useCase.execute(validCrearUsuarioDto, mockVendedorUser);

          // Assert
          expect(result.rol).toBe(RolUsuario.CLIENTE);
        });

        it('debería lanzar ForbiddenException al intentar crear ADMIN', async () => {
          // Arrange
          const dtoConRolAdmin = { ...validCrearUsuarioDto, rol: RolUsuario.ADMIN };
          mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);

          // Act & Assert
          await expect(useCase.execute(dtoConRolAdmin, mockVendedorUser)).rejects.toThrow(ForbiddenException);
          await expect(useCase.execute(dtoConRolAdmin, mockVendedorUser)).rejects.toThrow(
            'Los vendedores solo pueden crear usuarios con rol CLIENTE'
          );
        });

        it('debería lanzar ForbiddenException al intentar crear VENDEDOR', async () => {
          // Arrange
          const dtoConRolVendedor = { ...validCrearUsuarioDto, rol: RolUsuario.VENDEDOR };
          mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);

          // Act & Assert
          await expect(useCase.execute(dtoConRolVendedor, mockVendedorUser)).rejects.toThrow(ForbiddenException);
        });
      });

      describe('usuario CLIENTE autenticado', () => {
        it('debería lanzar ForbiddenException al intentar crear cualquier usuario', async () => {
          // Arrange
          mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);

          // Act & Assert
          await expect(useCase.execute(validCrearUsuarioDto, mockClienteUser)).rejects.toThrow(ForbiddenException);
          await expect(useCase.execute(validCrearUsuarioDto, mockClienteUser)).rejects.toThrow(
            'Los clientes no pueden crear otros usuarios'
          );
        });
      });
    });

    describe('manejo de errores', () => {
      it('debería propagar errores del repository en obtenerPorEmail', async () => {
        // Arrange
        const repositoryError = new Error('Error de conexión a BD');
        mockUsuarioRepository.obtenerPorEmail.mockRejectedValue(repositoryError);

        // Act & Assert
        await expect(useCase.execute(validCrearUsuarioDto)).rejects.toThrow('Error de conexión a BD');
      });

      it('debería propagar errores del PasswordService', async () => {
        // Arrange
        const passwordError = new Error('Error al hashear contraseña');
        mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);
        mockPasswordService.hashPassword.mockRejectedValue(passwordError);

        // Act & Assert
        await expect(useCase.execute(validCrearUsuarioDto)).rejects.toThrow('Error al hashear contraseña');
      });

      it('debería propagar errores del repository en crear', async () => {
        // Arrange
        const createError = new Error('Error al crear usuario en BD');
        mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);
        mockPasswordService.hashPassword.mockResolvedValue('hashed_password');
        mockUsuarioRepository.crear.mockRejectedValue(createError);

        // Act & Assert
        await expect(useCase.execute(validCrearUsuarioDto)).rejects.toThrow('Error al crear usuario en BD');
      });

      it('debería propagar errores de validación de la entidad Usuario', async () => {
        // Arrange
        const dtoConEmailInvalido = { ...validCrearUsuarioDto, email: 'email-invalido' };
        mockUsuarioRepository.obtenerPorEmail.mockResolvedValue(null);
        mockPasswordService.hashPassword.mockResolvedValue('hashed_password');

        // Act & Assert
        await expect(useCase.execute(dtoConEmailInvalido)).rejects.toThrow('El formato del email no es válido');
        
        // No debería llamar a crear si la validación falla
        expect(mockUsuarioRepository.crear).not.toHaveBeenCalled();
      });
    });
  });
}); 