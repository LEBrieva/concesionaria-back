import { Test, TestingModule } from '@nestjs/testing';
import { AutoQueryService } from './auto-query.service';
import { IAutoRepository } from '../../domain/auto.repository';
import { Auto } from '../../domain/auto.entity';
import { Marca, EstadoAuto, Transmision, Color } from '../../domain/auto.enum';
import { AutoProps } from '../../domain/auto.interfaces';

describe('AutoQueryService', () => {
  let service: AutoQueryService;
  let mockAutoRepository: jest.Mocked<IAutoRepository>;

  const createTestAuto = (overrides: Partial<AutoProps> = {}): Auto => {
    const defaultProps: AutoProps = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      nombre: 'Toyota Corolla',
      descripcion: 'Sedán compacto',
      observaciones: 'En excelente estado',
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
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-123',
      updatedBy: 'user-123',
      ...overrides,
    };
    return new Auto(defaultProps);
  };

  beforeEach(async () => {
    mockAutoRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findOneById: jest.fn(),
      update: jest.fn(),
      findByMatricula: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoQueryService,
        {
          provide: 'IAutoRepository',
          useValue: mockAutoRepository,
        },
      ],
    }).compile();

    service = module.get<AutoQueryService>(AutoQueryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debería retornar todos los autos', async () => {
      // Arrange
      const expectedAutos = [
        createTestAuto({ id: '1', nombre: 'Toyota Corolla' }),
        createTestAuto({ id: '2', nombre: 'Honda Civic', marca: Marca.HONDA }),
        createTestAuto({ id: '3', nombre: 'Ford Focus', marca: Marca.FORD }),
      ];
      mockAutoRepository.findAll.mockResolvedValue(expectedAutos);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(expectedAutos);
      expect(result).toHaveLength(3);
      expect(mockAutoRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('debería retornar array vacío cuando no hay autos', async () => {
      // Arrange
      mockAutoRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockAutoRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('debería propagar errores del repository', async () => {
      // Arrange
      const repositoryError = new Error('Error de conexión a BD');
      mockAutoRepository.findAll.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow('Error de conexión a BD');
      expect(mockAutoRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllActive', () => {
    it('debería retornar solo los autos activos', async () => {
      // Arrange
      const expectedActiveAutos = [
        createTestAuto({ id: '1', estado: EstadoAuto.DISPONIBLE }),
        createTestAuto({ id: '2', estado: EstadoAuto.DISPONIBLE }),
      ];
      mockAutoRepository.findAllActive.mockResolvedValue(expectedActiveAutos);

      // Act
      const result = await service.findAllActive();

      // Assert
      expect(result).toEqual(expectedActiveAutos);
      expect(result).toHaveLength(2);
      expect(result.every(auto => auto.estado === EstadoAuto.DISPONIBLE)).toBe(true);
      expect(mockAutoRepository.findAllActive).toHaveBeenCalledTimes(1);
    });

    it('debería retornar array vacío cuando no hay autos activos', async () => {
      // Arrange
      mockAutoRepository.findAllActive.mockResolvedValue([]);

      // Act
      const result = await service.findAllActive();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockAutoRepository.findAllActive).toHaveBeenCalledTimes(1);
    });

    it('debería propagar errores del repository', async () => {
      // Arrange
      const repositoryError = new Error('Error al filtrar autos activos');
      mockAutoRepository.findAllActive.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.findAllActive()).rejects.toThrow('Error al filtrar autos activos');
      expect(mockAutoRepository.findAllActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('debería retornar un auto cuando existe', async () => {
      // Arrange
      const autoId = '123e4567-e89b-12d3-a456-426614174000';
      const expectedAuto = createTestAuto({ id: autoId });
      mockAutoRepository.findOneById.mockResolvedValue(expectedAuto);

      // Act
      const result = await service.findById(autoId);

      // Assert
      expect(result).toEqual(expectedAuto);
      expect(result?.id).toBe(autoId);
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.findOneById).toHaveBeenCalledTimes(1);
    });

    it('debería retornar null cuando el auto no existe', async () => {
      // Arrange
      const autoId = 'non-existing-id';
      mockAutoRepository.findOneById.mockResolvedValue(null);

      // Act
      const result = await service.findById(autoId);

      // Assert
      expect(result).toBeNull();
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.findOneById).toHaveBeenCalledTimes(1);
    });

    it('debería propagar errores del repository', async () => {
      // Arrange
      const autoId = '123e4567-e89b-12d3-a456-426614174000';
      const repositoryError = new Error('Error al buscar por ID');
      mockAutoRepository.findOneById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.findById(autoId)).rejects.toThrow('Error al buscar por ID');
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.findOneById).toHaveBeenCalledTimes(1);
    });

    it('debería manejar diferentes tipos de IDs válidos', async () => {
      // Arrange
      const testCases = [
        '123e4567-e89b-12d3-a456-426614174000',
        'another-valid-uuid-here-12345',
        'short-id',
      ];

      for (const autoId of testCases) {
        const expectedAuto = createTestAuto({ id: autoId });
        mockAutoRepository.findOneById.mockResolvedValue(expectedAuto);

        // Act
        const result = await service.findById(autoId);

        // Assert
        expect(result?.id).toBe(autoId);
        expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      }

      expect(mockAutoRepository.findOneById).toHaveBeenCalledTimes(testCases.length);
    });
  });

  describe('integración entre métodos', () => {
    it('debería mantener consistencia entre findAll y findById', async () => {
      // Arrange
      const auto1 = createTestAuto({ id: '1', nombre: 'Auto 1' });
      const auto2 = createTestAuto({ id: '2', nombre: 'Auto 2' });
      const allAutos = [auto1, auto2];

      mockAutoRepository.findAll.mockResolvedValue(allAutos);
      mockAutoRepository.findOneById.mockImplementation(async (id) => {
        return allAutos.find(auto => auto.id === id) || null;
      });

      // Act
      const allResults = await service.findAll();
      const individualResult1 = await service.findById('1');
      const individualResult2 = await service.findById('2');
      const nonExistentResult = await service.findById('999');

      // Assert
      expect(allResults).toHaveLength(2);
      expect(individualResult1?.id).toBe('1');
      expect(individualResult2?.id).toBe('2');
      expect(nonExistentResult).toBeNull();
    });
  });
}); 