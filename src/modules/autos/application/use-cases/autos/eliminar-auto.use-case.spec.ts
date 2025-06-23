import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EliminarAutoUseCase } from './eliminar-auto.use-case';
import { IAutoRepository } from '../../../domain/auto.repository';
import { HistorialService } from '../../../../shared/services/historial.service';
import { IHistorialRepository } from '../../../../shared/interfaces/historial-repository.interface';
import { Auto } from '../../../domain/auto.entity';
import { Marca, EstadoAuto, Transmision, Color } from '../../../domain/auto.enum';
import { TipoEntidad, TipoAccion } from '../../../../shared/entities/historial.entity';

describe('EliminarAutoUseCase', () => {
  let useCase: EliminarAutoUseCase;
  let mockAutoRepository: jest.Mocked<IAutoRepository>;
  let mockHistorialRepository: jest.Mocked<IHistorialRepository>;
  let historialService: HistorialService;

  const mockAuto = new Auto({
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
    createdBy: 'user-456',
    updatedBy: 'user-456',
  });

  const mockHistorial = {
    id: 'historial-789',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockAutoRepository = {
      findOneById: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findByMatricula: jest.fn(),
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
        EliminarAutoUseCase,
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

    useCase = module.get<EliminarAutoUseCase>(EliminarAutoUseCase);
    historialService = module.get<HistorialService>(HistorialService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const usuarioId = 'user-789';

    it('debería eliminar un auto exitosamente y registrar en historial', async () => {
      // Arrange
      mockAutoRepository.findOneById.mockResolvedValue(mockAuto);
      mockAutoRepository.softDelete.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      const observaciones = 'Auto con problemas mecánicos';

      // Act
      await useCase.execute('auto-123', usuarioId, observaciones);

      // Assert
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith('auto-123');
      expect(mockAutoRepository.softDelete).toHaveBeenCalledWith('auto-123');

      // Verificar que se registró en el historial
      expect(mockHistorialRepository.crear).toHaveBeenCalledTimes(1);
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            entidadId: 'auto-123',
            tipoEntidad: TipoEntidad.AUTO,
            tipoAccion: TipoAccion.ELIMINAR,
            observaciones: observaciones,
            createdBy: usuarioId,
            metadata: expect.objectContaining({
              autoNombre: mockAuto.nombre,
              autoMatricula: mockAuto.matricula,
              autoMarca: mockAuto.marca,
              autoModelo: mockAuto.modelo,
              autoAno: mockAuto.ano,
              autoPrecio: mockAuto.precio,
              autoEstado: mockAuto.estado,
              motivoEliminacion: observaciones,
            }),
          }),
        })
      );
    });

    it('debería eliminar un auto sin observaciones y usar mensaje por defecto', async () => {
      // Arrange
      mockAutoRepository.findOneById.mockResolvedValue(mockAuto);
      mockAutoRepository.softDelete.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      // Act
      await useCase.execute('auto-123', usuarioId);

      // Assert
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith('auto-123');
      expect(mockAutoRepository.softDelete).toHaveBeenCalledWith('auto-123');

      // Verificar que se registró en el historial con mensaje por defecto
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            entidadId: 'auto-123',
            tipoEntidad: TipoEntidad.AUTO,
            tipoAccion: TipoAccion.ELIMINAR,
            observaciones: `Auto eliminado: ${mockAuto.nombre} - ${mockAuto.matricula}`,
            createdBy: usuarioId,
            metadata: expect.objectContaining({
              motivoEliminacion: 'Sin motivo especificado',
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

      // No debe intentar eliminar ni registrar historial
      expect(mockAutoRepository.softDelete).not.toHaveBeenCalled();
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería fallar si el auto ya está eliminado', async () => {
      // Arrange
      const autoEliminado = new Auto({
        ...mockAuto['props'],
        active: false, // Auto ya eliminado
      });
      mockAutoRepository.findOneById.mockResolvedValue(autoEliminado);

      // Act & Assert
      await expect(
        useCase.execute('auto-123', usuarioId)
      ).rejects.toThrow(new BadRequestException('El auto ya está eliminado'));

      // No debe intentar eliminar ni registrar historial
      expect(mockAutoRepository.softDelete).not.toHaveBeenCalled();
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

      // No debe intentar eliminar ni registrar historial
      expect(mockAutoRepository.softDelete).not.toHaveBeenCalled();
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería propagar errores del repository al eliminar', async () => {
      // Arrange
      const repositoryError = new Error('Error al eliminar en BD');
      mockAutoRepository.findOneById.mockResolvedValue(mockAuto);
      mockAutoRepository.softDelete.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(
        useCase.execute('auto-123', usuarioId)
      ).rejects.toThrow('Error al eliminar en BD');

      // Debe haber intentado buscar el auto
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith('auto-123');
      // No debe registrar historial si falló la eliminación
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería propagar errores del historial service', async () => {
      // Arrange
      const historialError = new Error('Error al registrar historial');
      mockAutoRepository.findOneById.mockResolvedValue(mockAuto);
      mockAutoRepository.softDelete.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockRejectedValue(historialError);

      // Act & Assert
      await expect(
        useCase.execute('auto-123', usuarioId, 'Observaciones test')
      ).rejects.toThrow('Error al registrar historial');

      // Debe haber eliminado el auto antes de fallar en el historial
      expect(mockAutoRepository.softDelete).toHaveBeenCalledWith('auto-123');
    });
  });
}); 