import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CambiarEstadoAutoUseCase } from './cambiar-estado-auto.use-case';
import { IAutoRepository } from '../../../domain/auto.repository';
import { HistorialService } from '../../../../shared/services/historial.service';
import { IHistorialRepository } from '../../../../shared/interfaces/historial-repository.interface';
import { Auto } from '../../../domain/auto.entity';
import { EstadoAuto, Marca, Color, Transmision } from '../../../domain/auto.enum';
import { TipoEntidad } from '../../../../shared/entities/historial.entity';
import { CambiarEstadoAutoDto } from '@autos/application/dtos/autos/cambio-estado/cambiar-estado-auto.dto';

describe('CambiarEstadoAutoUseCase', () => {
  let useCase: CambiarEstadoAutoUseCase;
  let autoRepository: jest.Mocked<IAutoRepository>;
  let historialRepository: jest.Mocked<IHistorialRepository>;
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
    esFavorito: false,
    createdBy: 'user-456',
    updatedBy: 'user-456',
  });

  const mockHistorial = {
    id: 'historial-789',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockAutoRepository = {
      findOneById: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findByMatricula: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      findFavoritos: jest.fn(),
      countFavoritos: jest.fn(),
    };

    const mockHistorialRepository = {
      crear: jest.fn(),
      obtenerHistorialCompleto: jest.fn(),
      obtenerPorEntidadYTipoAccion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CambiarEstadoAutoUseCase,
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

    useCase = module.get<CambiarEstadoAutoUseCase>(CambiarEstadoAutoUseCase);
    autoRepository = module.get('IAutoRepository');
    historialRepository = module.get('IHistorialRepository');
    historialService = module.get(HistorialService);
  });

  describe('execute', () => {
    const validDto = {
      nuevoEstado: EstadoAuto.RESERVADO as EstadoAuto.DISPONIBLE | EstadoAuto.RESERVADO,
      observaciones: 'Cliente interesado, reserva por 48 horas',
    };

    const usuarioId = 'user-789';

    it('debería cambiar el estado exitosamente', async () => {
      // Arrange
      autoRepository.findOneById.mockResolvedValue(mockAuto);
      autoRepository.update.mockResolvedValue(undefined);
      historialRepository.crear.mockResolvedValue(mockHistorial as any);

      // Act
      const result = await useCase.execute('auto-123', validDto, usuarioId);

      // Assert
      expect(autoRepository.findOneById).toHaveBeenCalledWith('auto-123');
      expect(autoRepository.update).toHaveBeenCalledWith(
        'auto-123',
        expect.objectContaining({
          estado: EstadoAuto.RESERVADO,
        })
      );
      expect(historialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          entidadId: 'auto-123',
          tipoEntidad: TipoEntidad.AUTO,
          campoAfectado: 'estado',
          valorAnterior: EstadoAuto.DISPONIBLE,
          valorNuevo: EstadoAuto.RESERVADO,
          observaciones: 'Cliente interesado, reserva por 48 horas',
        })
      );

      expect(result).toEqual({
        id: 'auto-123',
        estadoAnterior: EstadoAuto.DISPONIBLE,
        estadoNuevo: EstadoAuto.RESERVADO,
        observaciones: 'Cliente interesado, reserva por 48 horas',
        fechaCambio: mockHistorial.createdAt,
        usuarioId,
        historialId: 'historial-789',
        mensaje: 'El vehículo ha sido reservado exitosamente',
      });
    });

    it('debería fallar si el auto no existe', async () => {
      // Arrange
      autoRepository.findOneById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute('auto-inexistente', validDto, usuarioId)
      ).rejects.toThrow(new NotFoundException('Auto con ID auto-inexistente no encontrado'));
    });

    it('debería fallar si el auto está eliminado', async () => {
      // Arrange
      const autoEliminado = new Auto({
        ...mockAuto['props'],
        active: false,
      });
      autoRepository.findOneById.mockResolvedValue(autoEliminado);

      // Act & Assert
      await expect(
        useCase.execute('auto-123', validDto, usuarioId)
      ).rejects.toThrow(new BadRequestException('No se puede cambiar el estado de un auto eliminado'));
    });

    it('debería fallar si el nuevo estado es igual al actual', async () => {
      // Arrange
      autoRepository.findOneById.mockResolvedValue(mockAuto);

      const dtoMismoEstado = {
        nuevoEstado: EstadoAuto.DISPONIBLE as EstadoAuto.DISPONIBLE | EstadoAuto.RESERVADO,
        observaciones: 'Observación',
      };

      // Act & Assert
      await expect(
        useCase.execute('auto-123', dtoMismoEstado, usuarioId)
      ).rejects.toThrow(new BadRequestException('El auto ya se encuentra en estado DISPONIBLE'));
    });

    it('debería fallar si el estado no está permitido', async () => {
      // Arrange
      autoRepository.findOneById.mockResolvedValue(mockAuto);

      const dtoEstadoNoPermitido = {
        nuevoEstado: EstadoAuto.VENDIDO as any,
        observaciones: 'Observación',
      };

      // Act & Assert
      await expect(
        useCase.execute('auto-123', dtoEstadoNoPermitido, usuarioId)
      ).rejects.toThrow(new BadRequestException('Solo se permite cambiar a estados DISPONIBLE o RESERVADO'));
    });

    it('debería fallar si la transición de estado no es válida', async () => {
      // Arrange
      const autoVendido = new Auto({
        ...mockAuto['props'],
        estado: EstadoAuto.VENDIDO,
      });
      autoRepository.findOneById.mockResolvedValue(autoVendido);

      // Act & Assert
      await expect(
        useCase.execute('auto-123', validDto, usuarioId)
      ).rejects.toThrow(new BadRequestException('No se puede cambiar de estado VENDIDO a RESERVADO. Transiciones válidas: '));
    });

    it('debería cambiar de RESERVADO a DISPONIBLE', async () => {
      // Arrange
      const autoReservado = new Auto({
        ...mockAuto['props'],
        estado: EstadoAuto.RESERVADO,
      });
      autoRepository.findOneById.mockResolvedValue(autoReservado);
      autoRepository.update.mockResolvedValue(undefined);
      historialRepository.crear.mockResolvedValue(mockHistorial as any);

      const dtoDisponible = {
        nuevoEstado: EstadoAuto.DISPONIBLE as EstadoAuto.DISPONIBLE | EstadoAuto.RESERVADO,
        observaciones: 'Cliente canceló la reserva',
      };

      // Act
      const result = await useCase.execute('auto-123', dtoDisponible, usuarioId);

      // Assert
      expect(result.estadoAnterior).toBe(EstadoAuto.RESERVADO);
      expect(result.estadoNuevo).toBe(EstadoAuto.DISPONIBLE);
      expect(result.mensaje).toBe('El vehículo ha sido marcado como disponible para la venta');
    });

    it('debería cambiar de POR_INGRESAR a DISPONIBLE', async () => {
      // Arrange
      const autoPorIngresar = new Auto({
        ...mockAuto['props'],
        estado: EstadoAuto.POR_INGRESAR,
      });
      autoRepository.findOneById.mockResolvedValue(autoPorIngresar);
      autoRepository.update.mockResolvedValue(undefined);
      historialRepository.crear.mockResolvedValue(mockHistorial as any);

      const dtoDisponible = {
        nuevoEstado: EstadoAuto.DISPONIBLE as EstadoAuto.DISPONIBLE | EstadoAuto.RESERVADO,
        observaciones: 'Auto ingresado al inventario y listo para venta',
      };

      // Act
      const result = await useCase.execute('auto-123', dtoDisponible, usuarioId);

      // Assert
      expect(result.estadoAnterior).toBe(EstadoAuto.POR_INGRESAR);
      expect(result.estadoNuevo).toBe(EstadoAuto.DISPONIBLE);
      expect(result.mensaje).toBe('El vehículo ha sido marcado como disponible para la venta');
    });

    it('debería cambiar de POR_INGRESAR a RESERVADO directamente', async () => {
      // Arrange
      const autoPorIngresar = new Auto({
        ...mockAuto['props'],
        estado: EstadoAuto.POR_INGRESAR,
      });
      autoRepository.findOneById.mockResolvedValue(autoPorIngresar);
      autoRepository.update.mockResolvedValue(undefined);
      historialRepository.crear.mockResolvedValue(mockHistorial as any);

      const dtoReservado = {
        nuevoEstado: EstadoAuto.RESERVADO as EstadoAuto.DISPONIBLE | EstadoAuto.RESERVADO,
        observaciones: 'Cliente interesado antes de que ingrese oficialmente',
      };

      // Act
      const result = await useCase.execute('auto-123', dtoReservado, usuarioId);

      // Assert
      expect(result.estadoAnterior).toBe(EstadoAuto.POR_INGRESAR);
      expect(result.estadoNuevo).toBe(EstadoAuto.RESERVADO);
      expect(result.mensaje).toBe('El vehículo ha sido reservado exitosamente');
    });
  });
}); 