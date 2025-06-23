import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RestaurarAutoUseCase } from './restaurar-auto.use-case';
import { IAutoRepository } from '../../../domain/auto.repository';
import { HistorialService } from '../../../../shared/services/historial.service';
import { IHistorialRepository } from '../../../../shared/interfaces/historial-repository.interface';
import { Auto } from '../../../domain/auto.entity';
import { Marca, EstadoAuto, Transmision, Color } from '../../../domain/auto.enum';
import { TipoEntidad, TipoAccion } from '../../../../shared/entities/historial.entity';

describe('RestaurarAutoUseCase', () => {
  let useCase: RestaurarAutoUseCase;
  let mockAutoRepository: jest.Mocked<IAutoRepository>;
  let mockHistorialRepository: jest.Mocked<IHistorialRepository>;
  let historialService: HistorialService;

  const mockAutoEliminado = new Auto({
    id: 'auto-123',
    nombre: 'Toyota Corolla 2020',
    descripcion: 'Excelente estado',
    observaciones: 'Sin observaciones',
    matricula: 'ABC-1234',
    marca: Marca.TOYOTA,
    modelo: 'Corolla',
    version: 'XEI',
    ano: 2020,
    kilometraje: 50000,
    precio: 15000000,
    costo: 12000000,
    transmision: Transmision.AUTOMATICA,
    estado: EstadoAuto.DISPONIBLE,
    color: Color.BLANCO,
    imagenes: [],
    equipamientoDestacado: [],
    caracteristicasGenerales: [],
    exterior: [],
    confort: [],
    seguridad: [],
    interior: [],
    entretenimiento: [],
    esFavorito: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-456',
    updatedBy: 'user-456',
    active: false, // Auto eliminado
  });

  const mockAutoActivo = new Auto({
    id: 'auto-456',
    nombre: 'Honda Civic 2021',
    descripcion: 'Buen estado',
    observaciones: 'Sin observaciones',
    matricula: 'XYZ-5678',
    marca: Marca.HONDA,
    modelo: 'Civic',
    version: 'EX',
    ano: 2021,
    kilometraje: 30000,
    precio: 18000000,
    costo: 15000000,
    transmision: Transmision.MANUAL,
    estado: EstadoAuto.DISPONIBLE,
    color: Color.AZUL,
    imagenes: [],
    equipamientoDestacado: [],
    caracteristicasGenerales: [],
    exterior: [],
    confort: [],
    seguridad: [],
    interior: [],
    entretenimiento: [],
    esFavorito: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-789',
    updatedBy: 'user-789',
    active: true, // Auto activo
  });

  const mockHistorial = {
    id: 'historial-789',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockAutoRepository = {
      findOneById: jest.fn(),
      restore: jest.fn(),
      softDelete: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findByMatricula: jest.fn(),
      findFavoritos: jest.fn(),
      countFavoritos: jest.fn(),
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
        RestaurarAutoUseCase,
        HistorialService,
        {
          provide: 'IAutoRepository',
          useValue: mockAutoRepository,
        },
        {
          provide: 'IHistorialRepository',
          useValue: mockHistorialRepository,
        },
      ],
    }).compile();

    useCase = module.get<RestaurarAutoUseCase>(RestaurarAutoUseCase);
    historialService = module.get<HistorialService>(HistorialService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const usuarioId = 'user-789';

    it('debería restaurar un auto exitosamente y registrar en historial', async () => {
      // Arrange
      mockAutoRepository.findOneById.mockResolvedValue(mockAutoEliminado);
      mockAutoRepository.restore.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      const observaciones = 'Error en la eliminación, se restaura el auto';

      // Act
      await useCase.execute('auto-123', usuarioId, observaciones);

      // Assert
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith('auto-123');
      expect(mockAutoRepository.restore).toHaveBeenCalledWith('auto-123');

      // Verificar que se registró en el historial
      expect(mockHistorialRepository.crear).toHaveBeenCalledTimes(1);
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            entidadId: 'auto-123',
            tipoEntidad: TipoEntidad.AUTO,
            tipoAccion: TipoAccion.RESTAURAR,
            observaciones: observaciones,
            createdBy: usuarioId,
            metadata: expect.objectContaining({
              autoNombre: mockAutoEliminado.nombre,
              autoMatricula: mockAutoEliminado.matricula,
              autoMarca: mockAutoEliminado.marca,
              autoModelo: mockAutoEliminado.modelo,
              autoAno: mockAutoEliminado.ano,
              autoPrecio: mockAutoEliminado.precio,
              autoEstado: mockAutoEliminado.estado,
              motivoRestauracion: observaciones,
              estadoAnterior: 'eliminado',
              estadoNuevo: 'activo',
            }),
          }),
        })
      );
    });

    it('debería restaurar un auto sin observaciones y usar mensaje por defecto', async () => {
      // Arrange
      mockAutoRepository.findOneById.mockResolvedValue(mockAutoEliminado);
      mockAutoRepository.restore.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      // Act
      await useCase.execute('auto-123', usuarioId);

      // Assert
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith('auto-123');
      expect(mockAutoRepository.restore).toHaveBeenCalledWith('auto-123');

      // Verificar que se registró en el historial con mensaje por defecto
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            entidadId: 'auto-123',
            tipoEntidad: TipoEntidad.AUTO,
            tipoAccion: TipoAccion.RESTAURAR,
            observaciones: `Auto restaurado: ${mockAutoEliminado.nombre} - ${mockAutoEliminado.matricula}`,
            createdBy: usuarioId,
            metadata: expect.objectContaining({
              motivoRestauracion: 'Restauración solicitada',
              estadoAnterior: 'eliminado',
              estadoNuevo: 'activo',
            }),
          }),
        })
      );
    });

    it('debería fallar si el auto no existe', async () => {
      // Arrange
      mockAutoRepository.findOneById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute('auto-inexistente', usuarioId)
      ).rejects.toThrow(new NotFoundException('Auto no encontrado'));

      // No debe intentar restaurar ni registrar historial
      expect(mockAutoRepository.restore).not.toHaveBeenCalled();
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería fallar si el auto ya está activo', async () => {
      // Arrange
      mockAutoRepository.findOneById.mockResolvedValue(mockAutoActivo);

      // Act & Assert
      await expect(
        useCase.execute('auto-456', usuarioId)
      ).rejects.toThrow(new BadRequestException('El auto ya está activo'));

      // No debe intentar restaurar ni registrar historial
      expect(mockAutoRepository.restore).not.toHaveBeenCalled();
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería propagar errores del repository al buscar el auto', async () => {
      // Arrange
      const repositoryError = new Error('Error de conexión a BD');
      mockAutoRepository.findOneById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(
        useCase.execute('auto-123', usuarioId)
      ).rejects.toThrow('Error de conexión a BD');

      // No debe intentar restaurar ni registrar historial
      expect(mockAutoRepository.restore).not.toHaveBeenCalled();
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería propagar errores del repository al restaurar', async () => {
      // Arrange
      const repositoryError = new Error('Error al restaurar en BD');
      mockAutoRepository.findOneById.mockResolvedValue(mockAutoEliminado);
      mockAutoRepository.restore.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(
        useCase.execute('auto-123', usuarioId)
      ).rejects.toThrow('Error al restaurar en BD');

      // Debe haber intentado buscar el auto
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith('auto-123');
      // No debe registrar historial si falló la restauración
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería propagar errores del historial service', async () => {
      // Arrange
      const historialError = new Error('Error al registrar historial');
      mockAutoRepository.findOneById.mockResolvedValue(mockAutoEliminado);
      mockAutoRepository.restore.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockRejectedValue(historialError);

      // Act & Assert
      await expect(
        useCase.execute('auto-123', usuarioId, 'Observaciones test')
      ).rejects.toThrow('Error al registrar historial');

      // Debe haber restaurado el auto antes de fallar en el historial
      expect(mockAutoRepository.restore).toHaveBeenCalledWith('auto-123');
    });
  });
}); 