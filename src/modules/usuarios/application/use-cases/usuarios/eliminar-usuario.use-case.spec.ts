import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EliminarUsuarioUseCase } from './eliminar-usuario.use-case';
import { IUsuarioRepository } from '../../../domain/usuario.repository';
import { HistorialService } from '../../../../shared/services/historial.service';
import { IHistorialRepository } from '../../../../shared/interfaces/historial-repository.interface';
import { Usuario } from '../../../domain/usuario.entity';
import { RolUsuario } from '../../../domain/usuario.enum';
import { TipoEntidad, TipoAccion } from '../../../../shared/entities/historial.entity';

describe('EliminarUsuarioUseCase', () => {
  let useCase: EliminarUsuarioUseCase;
  let mockUsuarioRepository: jest.Mocked<IUsuarioRepository>;
  let mockHistorialRepository: jest.Mocked<IHistorialRepository>;
  let historialService: HistorialService;

  const mockUsuario = new Usuario({
    id: 'usuario-123',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com',
    password: 'hashed_password',
    telefono: '+1234567890',
    rol: RolUsuario.CLIENTE,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    createdBy: 'admin-456',
    updatedBy: 'admin-456',
    active: true,
  });

  const mockUsuarioEliminado = new Usuario({
    id: 'usuario-456',
    nombre: 'María',
    apellido: 'González',
    email: 'maria.gonzalez@example.com',
    password: 'hashed_password',
    telefono: '+0987654321',
    rol: RolUsuario.VENDEDOR,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    createdBy: 'admin-456',
    updatedBy: 'admin-456',
    active: false, // Usuario ya eliminado
  });

  const mockHistorial = {
    id: 'historial-789',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockUsuarioRepository = {
      findOneById: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      actualizar: jest.fn(),
      crear: jest.fn(),
      obtenerPorEmail: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      eliminar: jest.fn(),
      findWithPagination: jest.fn(),
      findWithAdvancedFilters: jest.fn(),
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
        EliminarUsuarioUseCase,
        HistorialService,
        {
          provide: 'IUsuarioRepository',
          useValue: mockUsuarioRepository,
        },
        {
          provide: 'IHistorialRepository',
          useValue: mockHistorialRepository,
        },
      ],
    }).compile();

    useCase = module.get<EliminarUsuarioUseCase>(EliminarUsuarioUseCase);
    historialService = module.get<HistorialService>(HistorialService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const usuarioEliminadorId = 'admin-789';

    it('debería eliminar un usuario exitosamente y registrar en historial', async () => {
      // Arrange
      mockUsuarioRepository.findOneById.mockResolvedValue(mockUsuario);
      mockUsuarioRepository.softDelete.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      const observaciones = 'Usuario inactivo por violación de términos';

      // Act
      await useCase.execute('usuario-123', usuarioEliminadorId, observaciones);

      // Assert
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith('usuario-123');
      expect(mockUsuarioRepository.softDelete).toHaveBeenCalledWith('usuario-123');

      // Verificar que se registró en el historial
      expect(mockHistorialRepository.crear).toHaveBeenCalledTimes(1);
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            entidadId: 'usuario-123',
            tipoEntidad: TipoEntidad.USUARIO,
            tipoAccion: TipoAccion.ELIMINAR,
            observaciones: observaciones,
            createdBy: usuarioEliminadorId,
            metadata: expect.objectContaining({
              usuarioNombre: mockUsuario.nombre,
              usuarioApellido: mockUsuario.apellido,
              usuarioEmail: mockUsuario.email,
              usuarioTelefono: mockUsuario.telefono,
              usuarioRol: mockUsuario.rol,
              motivoEliminacion: observaciones,
              eliminadoPor: usuarioEliminadorId,
              esAutoEliminacion: false,
              fechaCreacion: mockUsuario.createdAt,
            }),
          }),
        })
      );
    });

    it('debería eliminar un usuario sin observaciones y usar mensaje por defecto', async () => {
      // Arrange
      mockUsuarioRepository.findOneById.mockResolvedValue(mockUsuario);
      mockUsuarioRepository.softDelete.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      // Act
      await useCase.execute('usuario-123', usuarioEliminadorId);

      // Assert
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith('usuario-123');
      expect(mockUsuarioRepository.softDelete).toHaveBeenCalledWith('usuario-123');

      // Verificar que se registró en el historial con mensaje por defecto
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            entidadId: 'usuario-123',
            tipoEntidad: TipoEntidad.USUARIO,
            tipoAccion: TipoAccion.ELIMINAR,
            observaciones: `Usuario eliminado: ${mockUsuario.nombre} ${mockUsuario.apellido} - ${mockUsuario.email}`,
            createdBy: usuarioEliminadorId,
            metadata: expect.objectContaining({
              motivoEliminacion: 'Sin motivo especificado',
              esAutoEliminacion: false,
            }),
          }),
        })
      );
    });

    it('debería detectar auto-eliminación cuando el usuario se elimina a sí mismo', async () => {
      // Arrange
      const usuarioAutoEliminandose = 'usuario-123'; // Mismo ID que el usuario a eliminar
      mockUsuarioRepository.findOneById.mockResolvedValue(mockUsuario);
      mockUsuarioRepository.softDelete.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      // Act
      await useCase.execute('usuario-123', usuarioAutoEliminandose, 'Cerrando mi cuenta');

      // Assert
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            metadata: expect.objectContaining({
              esAutoEliminacion: true,
              eliminadoPor: usuarioAutoEliminandose,
            }),
          }),
        })
      );
    });

    it('debería fallar si el usuario no existe', async () => {
      // Arrange
      mockUsuarioRepository.findOneById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute('usuario-inexistente', usuarioEliminadorId)
      ).rejects.toThrow(new NotFoundException('Usuario no encontrado'));

      // No debe intentar eliminar ni registrar historial
      expect(mockUsuarioRepository.softDelete).not.toHaveBeenCalled();
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería fallar si el usuario ya está eliminado', async () => {
      // Arrange
      mockUsuarioRepository.findOneById.mockResolvedValue(mockUsuarioEliminado);

      // Act & Assert
      await expect(
        useCase.execute('usuario-456', usuarioEliminadorId)
      ).rejects.toThrow(new BadRequestException('El usuario ya está eliminado'));

      // No debe intentar eliminar ni registrar historial
      expect(mockUsuarioRepository.softDelete).not.toHaveBeenCalled();
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería propagar errores del repository al buscar el usuario', async () => {
      // Arrange
      const repositoryError = new Error('Error de conexión a BD');
      mockUsuarioRepository.findOneById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(
        useCase.execute('usuario-123', usuarioEliminadorId)
      ).rejects.toThrow('Error de conexión a BD');

      // No debe intentar eliminar ni registrar historial
      expect(mockUsuarioRepository.softDelete).not.toHaveBeenCalled();
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería propagar errores del repository al eliminar', async () => {
      // Arrange
      const repositoryError = new Error('Error al eliminar en BD');
      mockUsuarioRepository.findOneById.mockResolvedValue(mockUsuario);
      mockUsuarioRepository.softDelete.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(
        useCase.execute('usuario-123', usuarioEliminadorId)
      ).rejects.toThrow('Error al eliminar en BD');

      // Debe haber intentado buscar el usuario
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith('usuario-123');
      // No debe registrar historial si falló la eliminación
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería propagar errores del historial service', async () => {
      // Arrange
      const historialError = new Error('Error al registrar historial');
      mockUsuarioRepository.findOneById.mockResolvedValue(mockUsuario);
      mockUsuarioRepository.softDelete.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockRejectedValue(historialError);

      // Act & Assert
      await expect(
        useCase.execute('usuario-123', usuarioEliminadorId, 'Observaciones test')
      ).rejects.toThrow('Error al registrar historial');

      // Debe haber eliminado el usuario antes de fallar en el historial
      expect(mockUsuarioRepository.softDelete).toHaveBeenCalledWith('usuario-123');
    });
  });
}); 