import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RestaurarUsuarioUseCase } from './restaurar-usuario.use-case';
import { IUsuarioRepository } from '../../domain/usuario.repository';
import { HistorialService } from '@shared/services/historial.service';
import { IHistorialRepository } from '@shared/interfaces/historial';
import { Usuario } from '../../domain/usuario.entity';
import { RolUsuario } from '../../domain/usuario.enum';
import { TipoEntidad, TipoAccion } from '@shared/entities/historial.entity';

describe('RestaurarUsuarioUseCase', () => {
  let useCase: RestaurarUsuarioUseCase;
  let mockUsuarioRepository: jest.Mocked<IUsuarioRepository>;
  let mockHistorialRepository: jest.Mocked<IHistorialRepository>;
  let historialService: HistorialService;

  const mockUsuarioEliminado = new Usuario({
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
    active: false, // Usuario eliminado
  });

  const mockUsuarioActivo = new Usuario({
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
    active: true, // Usuario activo
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
        RestaurarUsuarioUseCase,
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

    useCase = module.get<RestaurarUsuarioUseCase>(RestaurarUsuarioUseCase);
    historialService = module.get<HistorialService>(HistorialService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const usuarioRestauradorId = 'admin-789';

    it('debería restaurar un usuario exitosamente y registrar en historial', async () => {
      // Arrange
      mockUsuarioRepository.findOneById.mockResolvedValue(mockUsuarioEliminado);
      mockUsuarioRepository.restore.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      const observaciones = 'Usuario restaurado tras resolución de conflicto';

      // Act
      await useCase.execute('usuario-123', usuarioRestauradorId, observaciones);

      // Assert
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith('usuario-123');
      expect(mockUsuarioRepository.restore).toHaveBeenCalledWith('usuario-123');

      // Verificar que se registró en el historial
      expect(mockHistorialRepository.crear).toHaveBeenCalledTimes(1);
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            entidadId: 'usuario-123',
            tipoEntidad: TipoEntidad.USUARIO,
            tipoAccion: TipoAccion.RESTAURAR,
            observaciones: observaciones,
            createdBy: usuarioRestauradorId,
            metadata: expect.objectContaining({
              usuarioNombre: mockUsuarioEliminado.nombre,
              usuarioApellido: mockUsuarioEliminado.apellido,
              usuarioEmail: mockUsuarioEliminado.email,
              usuarioTelefono: mockUsuarioEliminado.telefono,
              usuarioRol: mockUsuarioEliminado.rol,
              motivoRestauracion: observaciones,
              restauradoPor: usuarioRestauradorId,
              esAutoRestauracion: false,
              fechaCreacion: mockUsuarioEliminado.createdAt,
              transicionEstado: 'eliminado → activo',
            }),
          }),
        })
      );
    });

    it('debería restaurar un usuario sin observaciones y usar mensaje por defecto', async () => {
      // Arrange
      mockUsuarioRepository.findOneById.mockResolvedValue(mockUsuarioEliminado);
      mockUsuarioRepository.restore.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      // Act
      await useCase.execute('usuario-123', usuarioRestauradorId);

      // Assert
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith('usuario-123');
      expect(mockUsuarioRepository.restore).toHaveBeenCalledWith('usuario-123');

      // Verificar que se registró en el historial con mensaje por defecto
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            entidadId: 'usuario-123',
            tipoEntidad: TipoEntidad.USUARIO,
            tipoAccion: TipoAccion.RESTAURAR,
            observaciones: `Usuario restaurado: ${mockUsuarioEliminado.nombre} ${mockUsuarioEliminado.apellido} - ${mockUsuarioEliminado.email}`,
            createdBy: usuarioRestauradorId,
            metadata: expect.objectContaining({
              motivoRestauracion: 'Sin motivo especificado',
              esAutoRestauracion: false,
              transicionEstado: 'eliminado → activo',
            }),
          }),
        })
      );
    });

    it('debería detectar auto-restauración cuando el usuario se restaura a sí mismo', async () => {
      // Arrange
      const usuarioAutoRestaurandose = 'usuario-123'; // Mismo ID que el usuario a restaurar
      mockUsuarioRepository.findOneById.mockResolvedValue(mockUsuarioEliminado);
      mockUsuarioRepository.restore.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      // Act
      await useCase.execute('usuario-123', usuarioAutoRestaurandose, 'Reactivando mi cuenta');

      // Assert
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            metadata: expect.objectContaining({
              esAutoRestauracion: true,
              restauradoPor: usuarioAutoRestaurandose,
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
        useCase.execute('usuario-inexistente', usuarioRestauradorId)
      ).rejects.toThrow(new NotFoundException('Usuario no encontrado'));

      // No debe intentar restaurar ni registrar historial
      expect(mockUsuarioRepository.restore).not.toHaveBeenCalled();
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería fallar si el usuario ya está activo', async () => {
      // Arrange
      mockUsuarioRepository.findOneById.mockResolvedValue(mockUsuarioActivo);

      // Act & Assert
      await expect(
        useCase.execute('usuario-456', usuarioRestauradorId)
      ).rejects.toThrow(new BadRequestException('El usuario ya está activo'));

      // No debe intentar restaurar ni registrar historial
      expect(mockUsuarioRepository.restore).not.toHaveBeenCalled();
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería propagar errores del repository al buscar el usuario', async () => {
      // Arrange
      const repositoryError = new Error('Error de conexión a BD');
      mockUsuarioRepository.findOneById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(
        useCase.execute('usuario-123', usuarioRestauradorId)
      ).rejects.toThrow('Error de conexión a BD');

      // No debe intentar restaurar ni registrar historial
      expect(mockUsuarioRepository.restore).not.toHaveBeenCalled();
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería propagar errores del repository al restaurar', async () => {
      // Arrange
      const repositoryError = new Error('Error al restaurar en BD');
      mockUsuarioRepository.findOneById.mockResolvedValue(mockUsuarioEliminado);
      mockUsuarioRepository.restore.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(
        useCase.execute('usuario-123', usuarioRestauradorId)
      ).rejects.toThrow('Error al restaurar en BD');

      // Debe haber intentado buscar el usuario
      expect(mockUsuarioRepository.findOneById).toHaveBeenCalledWith('usuario-123');
      // No debe registrar historial si falló la restauración
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería propagar errores del historial service', async () => {
      // Arrange
      const historialError = new Error('Error al registrar historial');
      mockUsuarioRepository.findOneById.mockResolvedValue(mockUsuarioEliminado);
      mockUsuarioRepository.restore.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockRejectedValue(historialError);

      // Act & Assert
      await expect(
        useCase.execute('usuario-123', usuarioRestauradorId, 'Observaciones test')
      ).rejects.toThrow('Error al registrar historial');

      // Debe haber restaurado el usuario antes de fallar en el historial
      expect(mockUsuarioRepository.restore).toHaveBeenCalledWith('usuario-123');
    });
  });
}); 