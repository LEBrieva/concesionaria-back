import { Test, TestingModule } from '@nestjs/testing';
import { CrearAutoUseCase } from './crear-auto.use-case';
import { IAutoRepository } from '../../../domain/auto.repository';
import { CrearAutoDTO } from '../../dtos/autos/crear/crear-auto.dto';
import { Marca, EstadoAuto, Transmision, Color } from '../../../domain/auto.enum';
import { Auto } from '../../../domain/auto.entity';
import { HistorialService } from '../../../../shared/services/historial.service';
import { IHistorialRepository } from '../../../../shared/interfaces/historial-repository.interface';
import { TipoEntidad } from '../../../../shared/entities/historial.entity';

describe('CrearAutoUseCase', () => {
  let useCase: CrearAutoUseCase;
  let mockAutoRepository: jest.Mocked<IAutoRepository>;
  let mockHistorialRepository: jest.Mocked<IHistorialRepository>;
  let historialService: HistorialService;

  const validCrearAutoDTO: CrearAutoDTO = {
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
    equipamientoDestacado: ['GPS', 'Bluetooth'],
    caracteristicasGenerales: ['4 puertas'],
    exterior: ['Espejos eléctricos'],
    confort: ['Aire acondicionado'],
    seguridad: ['ABS', 'Airbags'],
    interior: ['Tapizado de cuero'],
    entretenimiento: ['Radio AM/FM'],
  };

  beforeEach(async () => {
    // Crear mock del repository
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

    // Crear mock del historial repository
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
        CrearAutoUseCase,
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

    useCase = module.get<CrearAutoUseCase>(CrearAutoUseCase);
    historialService = module.get<HistorialService>(HistorialService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('debería crear un auto exitosamente con datos válidos y registrar en historial', async () => {
      // Arrange
      const userId = 'user-123';
      const mockHistorial = { id: 'historial-456', createdAt: new Date() };
      
      mockAutoRepository.save.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      // Act
      const result = await useCase.execute(validCrearAutoDTO, userId);

      // Assert
      expect(result).toBeInstanceOf(Auto);
      expect(result.nombre).toBe(validCrearAutoDTO.nombre);
      expect(result.marca).toBe(validCrearAutoDTO.marca);
      expect(result.precio).toBe(validCrearAutoDTO.precio);
      expect(result.createdBy).toBe(userId);
      expect(result.updatedBy).toBe(userId);
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      
      // Verificar que se llamó al repository del auto
      expect(mockAutoRepository.save).toHaveBeenCalledTimes(1);
      expect(mockAutoRepository.save).toHaveBeenCalledWith(expect.any(Auto));

      // Verificar que se registró en el historial
      expect(mockHistorialRepository.crear).toHaveBeenCalledTimes(1);
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            entidadId: result.id,
            tipoEntidad: TipoEntidad.AUTO,
            tipoAccion: 'CREAR',
            createdBy: userId,
            metadata: expect.objectContaining({
              nombre: validCrearAutoDTO.nombre,
              marca: validCrearAutoDTO.marca,
              modelo: validCrearAutoDTO.modelo,
              ano: validCrearAutoDTO.ano,
              precio: validCrearAutoDTO.precio,
              estado: validCrearAutoDTO.estado,
              matricula: validCrearAutoDTO.matricula,
              observaciones: `Auto creado: ${validCrearAutoDTO.nombre} - ${validCrearAutoDTO.matricula}`,
            }),
          }),
        })
      );
    });

    it('debería generar un UUID válido para el auto', async () => {
      // Arrange
      const userId = 'user-123';
      mockAutoRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validCrearAutoDTO, userId);

      // Assert
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result.id).toMatch(uuidRegex);
    });

    it('debería asignar correctamente el userId como createdBy y updatedBy', async () => {
      // Arrange
      const userId = 'test-user-456';
      mockAutoRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validCrearAutoDTO, userId);

      // Assert
      expect(result.createdBy).toBe(userId);
      expect(result.updatedBy).toBe(userId);
    });

    it('debería propagar errores de validación de la entidad Auto', async () => {
      // Arrange
      const userId = 'user-123';
      const invalidDTO = { ...validCrearAutoDTO, precio: -1000 }; // Precio negativo
      mockAutoRepository.save.mockResolvedValue(undefined);

      // Act & Assert
      await expect(useCase.execute(invalidDTO, userId)).rejects.toThrow(
        'El precio y costo no pueden ser negativos'
      );
      
      // No debería llamar al repository si la validación falla
      expect(mockAutoRepository.save).not.toHaveBeenCalled();
    });

    it('debería propagar errores del repository', async () => {
      // Arrange
      const userId = 'user-123';
      const repositoryError = new Error('Error de base de datos');
      mockAutoRepository.save.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(validCrearAutoDTO, userId)).rejects.toThrow(
        'Error de base de datos'
      );
      
      expect(mockAutoRepository.save).toHaveBeenCalledTimes(1);
    });

    it('debería crear autos con diferentes datos manteniendo la estructura', async () => {
      // Arrange
      const userId = 'user-123';
      const otroAutoDTO = {
        ...validCrearAutoDTO,
        nombre: 'Honda Civic',
        marca: Marca.HONDA,
        precio: 18000,
        ano: 2021,
      };
      mockAutoRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(otroAutoDTO, userId);

      // Assert
      expect(result.nombre).toBe('Honda Civic');
      expect(result.marca).toBe(Marca.HONDA);
      expect(result.precio).toBe(18000);
      expect(result.ano).toBe(2021);
      expect(result.createdBy).toBe(userId);
      expect(mockAutoRepository.save).toHaveBeenCalledWith(expect.any(Auto));
    });

    it('debería preservar todos los arrays del DTO en la entidad', async () => {
      // Arrange
      const userId = 'user-123';
      const dtoConArrays = {
        ...validCrearAutoDTO,
        equipamientoDestacado: ['GPS', 'Bluetooth', 'Cámara'],
        seguridad: ['ABS', 'Airbags', 'Control de estabilidad'],
        entretenimiento: ['Radio AM/FM', 'USB', 'Pantalla táctil'],
      };
      mockAutoRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(dtoConArrays, userId);

      // Assert
      expect(result.equipamientoDestacado).toEqual(dtoConArrays.equipamientoDestacado);
      expect(result.seguridad).toEqual(dtoConArrays.seguridad);
      expect(result.entretenimiento).toEqual(dtoConArrays.entretenimiento);
    });
  });
}); 