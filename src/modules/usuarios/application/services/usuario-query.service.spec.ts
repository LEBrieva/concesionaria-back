import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioQueryService } from './usuario-query.service';
import { IUsuarioRepository } from '../../domain/usuario.repository';
import { Usuario } from '../../domain/usuario.entity';
import { RolUsuario } from '../../domain/usuario.enum';
import { UsuarioProps } from '../../domain/usuario.interfaces';

describe('UsuarioQueryService', () => {
  let service: UsuarioQueryService;
  let mockUsuarioRepository: any;

  const createTestUsuario = (overrides: Partial<UsuarioProps> = {}): Usuario => {
    const defaultProps: UsuarioProps = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@example.com',
      password: 'hashed_password',
      telefono: '+1234567890',
      rol: RolUsuario.CLIENTE,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      createdBy: 'system',
      updatedBy: 'system',
      active: true,
      ...overrides,
    };
    return new Usuario(defaultProps);
  };

  beforeEach(async () => {
    // Crear mock del repository
    mockUsuarioRepository = {
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findOneById: jest.fn(),
      obtenerPorEmail: jest.fn(),
      crear: jest.fn(),
      actualizar: jest.fn(),
      eliminar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioQueryService,
        {
          provide: 'IUsuarioRepository',
          useValue: mockUsuarioRepository,
        },
      ],
    }).compile();

    service = module.get<UsuarioQueryService>(UsuarioQueryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debería retornar todos los usuarios', async () => {
      // Arrange
      const usuarios = [
        createTestUsuario({ id: 'user-1', nombre: 'Juan', rol: RolUsuario.CLIENTE }),
        createTestUsuario({ id: 'user-2', nombre: 'María', rol: RolUsuario.VENDEDOR, active: false }),
        createTestUsuario({ id: 'user-3', nombre: 'Pedro', rol: RolUsuario.ADMIN }),
      ];

      mockUsuarioRepository.findAll.mockResolvedValue(usuarios);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(usuarios);
      expect(result).toHaveLength(3);
      expect(mockUsuarioRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockUsuarioRepository.findAll).toHaveBeenCalledWith();
    });

    it('debería retornar array vacío cuando no hay usuarios', async () => {
      // Arrange
      mockUsuarioRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockUsuarioRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('debería incluir usuarios activos e inactivos', async () => {
      // Arrange
      const usuarios = [
        createTestUsuario({ id: 'user-1', nombre: 'Juan', active: true }),
        createTestUsuario({ id: 'user-2', nombre: 'María', active: false }),
      ];

      mockUsuarioRepository.findAll.mockResolvedValue(usuarios);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.find(u => u.id === 'user-1')?.active).toBe(true);
      expect(result.find(u => u.id === 'user-2')?.active).toBe(false);
    });

    it('debería propagar errores del repository', async () => {
      // Arrange
      const repositoryError = new Error('Error de conexión a BD');
      mockUsuarioRepository.findAll.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow('Error de conexión a BD');
      expect(mockUsuarioRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllActive', () => {
    it('debería retornar solo usuarios activos', async () => {
      // Arrange
      const usuariosActivos = [
        createTestUsuario({ id: 'user-1', nombre: 'Juan', active: true }),
        createTestUsuario({ id: 'user-2', nombre: 'María', active: true }),
      ];

      mockUsuarioRepository.findAllActive.mockResolvedValue(usuariosActivos);

      // Act
      const result = await service.findAllActive();

      // Assert
      expect(result).toEqual(usuariosActivos);
      expect(result).toHaveLength(2);
      expect(result.every(u => u.active)).toBe(true);
      expect(mockUsuarioRepository.findAllActive).toHaveBeenCalledTimes(1);
      expect(mockUsuarioRepository.findAllActive).toHaveBeenCalledWith();
    });

    it('debería retornar array vacío cuando no hay usuarios activos', async () => {
      // Arrange
      mockUsuarioRepository.findAllActive.mockResolvedValue([]);

      // Act
      const result = await service.findAllActive();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockUsuarioRepository.findAllActive).toHaveBeenCalledTimes(1);
    });

    it('debería incluir usuarios de todos los roles si están activos', async () => {
      // Arrange
      const usuariosActivos = [
        createTestUsuario({ id: 'user-1', rol: RolUsuario.CLIENTE, active: true }),
        createTestUsuario({ id: 'user-2', rol: RolUsuario.VENDEDOR, active: true }),
        createTestUsuario({ id: 'user-3', rol: RolUsuario.ADMIN, active: true }),
      ];

      mockUsuarioRepository.findAllActive.mockResolvedValue(usuariosActivos);

      // Act
      const result = await service.findAllActive();

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map(u => u.rol)).toEqual([RolUsuario.CLIENTE, RolUsuario.VENDEDOR, RolUsuario.ADMIN]);
      expect(result.every(u => u.active)).toBe(true);
    });

    it('debería propagar errores del repository', async () => {
      // Arrange
      const repositoryError = new Error('Error al obtener usuarios activos');
      mockUsuarioRepository.findAllActive.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.findAllActive()).rejects.toThrow('Error al obtener usuarios activos');
      expect(mockUsuarioRepository.findAllActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    const usuarioId = '123e4567-e89b-12d3-a456-426614174000';

    it('debería retornar un usuario por ID', async () => {
      // Arrange
      const usuario = createTestUsuario({ id: usuarioId, nombre: 'Juan' });
      mockUsuarioRepository.findOneById.mockResolvedValue(usuario);

      // Act
      const result = await service.findById(usuarioId);

      // Assert
      expect(result).toEqual(usuario);
      expect(result?.id).toBe(usuarioId);
      expect(result?.nombre).toBe('Juan');
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledTimes(1);
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith(usuarioId);
    });

    it('debería retornar null cuando el usuario no existe', async () => {
      // Arrange
      mockUsuarioRepository.findOneById.mockResolvedValue(null);

      // Act
      const result = await service.findById(usuarioId);

      // Assert
      expect(result).toBeNull();
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledTimes(1);
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith(usuarioId);
    });

    it('debería retornar undefined cuando findOneById retorna undefined', async () => {
      // Arrange
      mockUsuarioRepository.findOneById.mockResolvedValue(undefined);

      // Act
      const result = await service.findById(usuarioId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith(usuarioId);
    });

    it('debería retornar usuario activo', async () => {
      // Arrange
      const usuarioActivo = createTestUsuario({ id: usuarioId, active: true });
      mockUsuarioRepository.findOneById.mockResolvedValue(usuarioActivo);

      // Act
      const result = await service.findById(usuarioId);

      // Assert
      expect(result?.active).toBe(true);
    });

    it('debería retornar usuario inactivo', async () => {
      // Arrange
      const usuarioInactivo = createTestUsuario({ id: usuarioId, active: false });
      mockUsuarioRepository.findOneById.mockResolvedValue(usuarioInactivo);

      // Act
      const result = await service.findById(usuarioId);

      // Assert
      expect(result?.active).toBe(false);
    });

    it('debería funcionar con diferentes tipos de ID', async () => {
      // Arrange
      const idsValidos = [
        '123e4567-e89b-12d3-a456-426614174000',
        'user-123',
        'admin-456',
        'cliente-789',
      ];

      // Act & Assert
      for (const id of idsValidos) {
        const usuario = createTestUsuario({ id });
        mockUsuarioRepository.findOneById.mockResolvedValue(usuario);

        const result = await service.findById(id);

        expect(result?.id).toBe(id);
        expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith(id);
      }
    });

    it('debería propagar errores del repository', async () => {
      // Arrange
      const repositoryError = new Error('Error al buscar usuario');
      mockUsuarioRepository.findOneById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.findById(usuarioId)).rejects.toThrow('Error al buscar usuario');
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith(usuarioId);
    });
  });

  describe('integración entre métodos', () => {
    it('debería mantener consistencia entre findAll y findAllActive', async () => {
      // Arrange
      const todosLosUsuarios = [
        createTestUsuario({ id: 'user-1', active: true }),
        createTestUsuario({ id: 'user-2', active: false }),
        createTestUsuario({ id: 'user-3', active: true }),
      ];
      const usuariosActivos = todosLosUsuarios.filter(u => u.active);

      mockUsuarioRepository.findAll.mockResolvedValue(todosLosUsuarios);
      mockUsuarioRepository.findAllActive.mockResolvedValue(usuariosActivos);

      // Act
      const allUsers = await service.findAll();
      const activeUsers = await service.findAllActive();

      // Assert
      expect(allUsers).toHaveLength(3);
      expect(activeUsers).toHaveLength(2);
      expect(activeUsers.every(u => u.active)).toBe(true);
      expect(allUsers.filter(u => u.active)).toHaveLength(activeUsers.length);
    });

    it('debería ser consistente entre findById y findAll para el mismo usuario', async () => {
      // Arrange
      const usuarioId = 'user-123';
      const usuario = createTestUsuario({ id: usuarioId, nombre: 'Juan' });
      const todosLosUsuarios = [usuario];

      mockUsuarioRepository.findOneById.mockResolvedValue(usuario);
      mockUsuarioRepository.findAll.mockResolvedValue(todosLosUsuarios);

      // Act
      const usuarioPorId = await service.findById(usuarioId);
      const todosUsuarios = await service.findAll();

      // Assert
      expect(usuarioPorId).toBeDefined();
      expect(todosUsuarios.find(u => u.id === usuarioId)).toBeDefined();
      expect(usuarioPorId?.nombre).toBe(todosUsuarios.find(u => u.id === usuarioId)?.nombre);
    });
  });

  describe('casos edge', () => {
    it('debería manejar IDs con formato UUID', async () => {
      // Arrange
      const uuidId = '123e4567-e89b-12d3-a456-426614174000';
      const usuario = createTestUsuario({ id: uuidId });
      mockUsuarioRepository.findOneById.mockResolvedValue(usuario);

      // Act
      const result = await service.findById(uuidId);

      // Assert
      expect(result?.id).toBe(uuidId);
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith(uuidId);
    });

    it('debería manejar usuarios con todos los campos opcionales', async () => {
      // Arrange
      const usuarioMinimo = createTestUsuario({ telefono: undefined });
      mockUsuarioRepository.findAll.mockResolvedValue([usuarioMinimo]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result[0].telefono).toBeUndefined();
      expect(result[0].nombre).toBeDefined();
      expect(result[0].email).toBeDefined();
    });

    it('debería manejar usuarios con diferentes roles', async () => {
      // Arrange
      const usuarios = [
        createTestUsuario({ id: 'admin', rol: RolUsuario.ADMIN }),
        createTestUsuario({ id: 'vendedor', rol: RolUsuario.VENDEDOR }),
        createTestUsuario({ id: 'cliente', rol: RolUsuario.CLIENTE }),
      ];
      mockUsuarioRepository.findAll.mockResolvedValue(usuarios);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map(u => u.rol)).toEqual([
        RolUsuario.ADMIN,
        RolUsuario.VENDEDOR,
        RolUsuario.CLIENTE,
      ]);
    });
  });
}); 