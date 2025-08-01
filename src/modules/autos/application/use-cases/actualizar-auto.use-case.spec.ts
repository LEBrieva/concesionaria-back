import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ActualizarAutoUseCase } from './actualizar-auto.use-case';
import { IAutoRepository } from '../../domain/auto.repository';
import { ActualizarAutoDTO } from '../dtos/actualizar/actualizar-auto.dto';
import { Auto } from '../../domain/auto.entity';
import { Marca, EstadoAuto, Transmision, Color } from '../../domain/auto.enum';
import { AutoProps } from '../../domain/interfaces/auto.interfaces';
import { HistorialService } from '@shared/services/historial.service';
import { IHistorialRepository } from '@shared/interfaces/historial';
import { TipoEntidad, TipoAccion } from '@shared/entities/historial.entity';

describe('ActualizarAutoUseCase', () => {
  let useCase: ActualizarAutoUseCase;
  let mockAutoRepository: jest.Mocked<IAutoRepository>;
  let mockHistorialRepository: jest.Mocked<IHistorialRepository>;
  let historialService: HistorialService;

  const existingAutoProps: AutoProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nombre: 'Toyota Corolla',
    descripcion: 'Sedán compacto',
    observaciones: 'En buen estado',
    matricula: 'ABC-123',
    marca: Marca.TOYOTA,
    modelo: 'Corolla',
    version: 'XLI',
    ano: 2022,
    kilometraje: 10000,
    precio: 20000,
    costo: 15000,
    transmision: Transmision.MANUAL,
    estado: EstadoAuto.DISPONIBLE,
    color: Color.BLANCO,
    imagenes: ['https://example.com/image1.jpg'],
    equipamientoDestacado: ['GPS'],
    caracteristicasGenerales: ['4 puertas'],
    exterior: ['Espejos eléctricos'],
    confort: ['Aire acondicionado'],
    seguridad: ['ABS'],
    interior: ['Tapizado'],
    entretenimiento: ['Radio'],
    esFavorito: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-original',
    updatedBy: 'user-original',
  };

  const validActualizarAutoDTO: ActualizarAutoDTO = {
    precio: 22000,
    kilometraje: 12000,
    observaciones: 'Actualizado - En excelente estado',
  };

  beforeEach(async () => {
    mockAutoRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findOneById: jest.fn(),
      update: jest.fn(),
      findByMatricula: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      findFavoritos: jest.fn(),
      countFavoritos: jest.fn(),
      findWithPagination: jest.fn(),
      findWithAdvancedFilters: jest.fn(),
      getMarcasDisponibles: jest.fn(),
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
        ActualizarAutoUseCase,
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

    useCase = module.get<ActualizarAutoUseCase>(ActualizarAutoUseCase);
    historialService = module.get<HistorialService>(HistorialService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('debería actualizar un auto exitosamente y registrar cambios en historial', async () => {
      // Arrange
      const autoId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-updater';
      const existingAuto = new Auto(existingAutoProps);
      const mockHistorial = { id: 'historial-123', createdAt: new Date() };

      mockAutoRepository.findOneById.mockResolvedValue(existingAuto);
      mockAutoRepository.update.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      // Act
      const result = await useCase.execute(autoId, validActualizarAutoDTO, userId);

      // Assert
      expect(result).toBeInstanceOf(Auto);
      expect(result.id).toBe(autoId);
      expect(result.precio).toBe(validActualizarAutoDTO.precio);
      expect(result.kilometraje).toBe(validActualizarAutoDTO.kilometraje);
      expect(result.observaciones).toBe(validActualizarAutoDTO.observaciones);
      expect(result.updatedBy).toBe(userId);
      
      // Propiedades no actualizadas deben mantenerse
      expect(result.nombre).toBe(existingAutoProps.nombre);
      expect(result.marca).toBe(existingAutoProps.marca);
      expect(result.createdBy).toBe(existingAutoProps.createdBy);

      // Verificar llamadas al repository
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.update).toHaveBeenCalledWith(autoId, expect.any(Auto));

      // Verificar que se registraron los cambios en el historial (3 campos cambiaron)
      expect(mockHistorialRepository.crear).toHaveBeenCalledTimes(3);
      
      // Verificar registro del cambio de precio
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            entidadId: autoId,
            tipoEntidad: TipoEntidad.AUTO,
            tipoAccion: TipoAccion.ACTUALIZAR,
            campoAfectado: 'precio',
            valorAnterior: '20000',
            valorNuevo: '22000',
            observaciones: "Campo 'precio' actualizado",
            createdBy: userId,
          }),
        })
      );

      // Verificar registro del cambio de kilometraje
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            entidadId: autoId,
            tipoEntidad: TipoEntidad.AUTO,
            tipoAccion: TipoAccion.ACTUALIZAR,
            campoAfectado: 'kilometraje',
            valorAnterior: '10000',
            valorNuevo: '12000',
            observaciones: "Campo 'kilometraje' actualizado",
            createdBy: userId,
          }),
        })
      );

      // Verificar registro del cambio de observaciones
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            entidadId: autoId,
            tipoEntidad: TipoEntidad.AUTO,
            tipoAccion: TipoAccion.ACTUALIZAR,
            campoAfectado: 'observaciones',
            valorAnterior: 'En buen estado',
            valorNuevo: 'Actualizado - En excelente estado',
            observaciones: "Campo 'observaciones' actualizado",
            createdBy: userId,
          }),
        })
      );
    });

    it('no debería registrar historial si no hay cambios', async () => {
      // Arrange
      const autoId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-updater';
      const existingAuto = new Auto(existingAutoProps);
      const sinCambios = { precio: 20000 }; // Mismo precio que ya tiene

      mockAutoRepository.findOneById.mockResolvedValue(existingAuto);
      mockAutoRepository.update.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(autoId, sinCambios, userId);

      // Assert
      expect(result).toBeInstanceOf(Auto);
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.update).toHaveBeenCalledWith(autoId, expect.any(Auto));
      
      // No debe registrar historial si no hay cambios
      expect(mockHistorialRepository.crear).not.toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si el auto no existe', async () => {
      // Arrange
      const autoId = 'non-existing-id';
      const userId = 'user-updater';

      mockAutoRepository.findOneById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(autoId, validActualizarAutoDTO, userId))
        .rejects.toThrow(NotFoundException);
      
      await expect(useCase.execute(autoId, validActualizarAutoDTO, userId))
        .rejects.toThrow('Auto no encontrado');

      // No debería llamar a update si no encuentra el auto
      expect(mockAutoRepository.update).not.toHaveBeenCalled();
    });

    it('debería actualizar solo los campos proporcionados', async () => {
      // Arrange
      const autoId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-updater';
      const existingAuto = new Auto(existingAutoProps);
      const parcialUpdate = { precio: 25000 }; // Solo actualizar precio

      mockAutoRepository.findOneById.mockResolvedValue(existingAuto);
      mockAutoRepository.update.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(autoId, parcialUpdate, userId);

      // Assert
      expect(result.precio).toBe(25000);
      expect(result.kilometraje).toBe(existingAutoProps.kilometraje); // Sin cambios
      expect(result.observaciones).toBe(existingAutoProps.observaciones); // Sin cambios
      expect(result.updatedBy).toBe(userId);
    });

    it('debería propagar errores de validación de la entidad', async () => {
      // Arrange
      const autoId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-updater';
      const existingAuto = new Auto(existingAutoProps);
      const invalidUpdate = { precio: -1000 }; // Precio negativo

      mockAutoRepository.findOneById.mockResolvedValue(existingAuto);

      // Act & Assert
      await expect(useCase.execute(autoId, invalidUpdate, userId))
        .rejects.toThrow('El precio y costo no pueden ser negativos');

      // No debería llamar a update si la validación falla
      expect(mockAutoRepository.update).not.toHaveBeenCalled();
    });

    it('debería propagar errores del repository en findOneById', async () => {
      // Arrange
      const autoId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-updater';
      const repositoryError = new Error('Error de conexión a BD');

      mockAutoRepository.findOneById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(autoId, validActualizarAutoDTO, userId))
        .rejects.toThrow('Error de conexión a BD');
    });

    it('debería propagar errores del repository en update', async () => {
      // Arrange
      const autoId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-updater';
      const existingAuto = new Auto(existingAutoProps);
      const repositoryError = new Error('Error al actualizar en BD');

      mockAutoRepository.findOneById.mockResolvedValue(existingAuto);
      mockAutoRepository.update.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(autoId, validActualizarAutoDTO, userId))
        .rejects.toThrow('Error al actualizar en BD');
    });

    it('debería actualizar múltiples campos correctamente', async () => {
      // Arrange
      const autoId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-updater';
      const existingAuto = new Auto(existingAutoProps);
      const multipleFieldsUpdate = {
        precio: 30000,
        kilometraje: 15000,
        observaciones: 'Completamente renovado',
        equipamientoDestacado: ['GPS', 'Bluetooth', 'Cámara de reversa'],
      };

      mockAutoRepository.findOneById.mockResolvedValue(existingAuto);
      mockAutoRepository.update.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(autoId, multipleFieldsUpdate, userId);

      // Assert
      expect(result.precio).toBe(multipleFieldsUpdate.precio);
      expect(result.kilometraje).toBe(multipleFieldsUpdate.kilometraje);
      expect(result.observaciones).toBe(multipleFieldsUpdate.observaciones);
      expect(result.equipamientoDestacado).toEqual(multipleFieldsUpdate.equipamientoDestacado);
      expect(result.updatedBy).toBe(userId);
      // El estado debe mantenerse sin cambios ya que no se puede actualizar a través de este endpoint
      expect(result.estado).toBe(existingAutoProps.estado);
    });

    it('debería mantener el ID original del auto', async () => {
      // Arrange
      const autoId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-updater';
      const existingAuto = new Auto(existingAutoProps);

      mockAutoRepository.findOneById.mockResolvedValue(existingAuto);
      mockAutoRepository.update.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(autoId, validActualizarAutoDTO, userId);

      // Assert
      expect(result.id).toBe(autoId);
      expect(result.id).toBe(existingAutoProps.id);
    });
  });
}); 