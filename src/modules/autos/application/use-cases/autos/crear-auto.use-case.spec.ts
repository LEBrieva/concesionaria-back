import { Test, TestingModule } from '@nestjs/testing';
import { CrearAutoUseCase } from './crear-auto.use-case';
import { IAutoRepository } from '../../../domain/auto.repository';
import { CrearAutoDTO } from '../../dtos/autos/crear/crear-auto.dto';
import { Marca, EstadoAuto, Transmision, Color } from '../../../domain/auto.enum';
import { Auto } from '../../../domain/auto.entity';
import { HistorialService } from '../../../../shared/services/historial.service';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { IHistorialRepository } from '../../../../shared/interfaces/historial';
import { TipoEntidad } from '../../../../shared/entities/historial.entity';
import { BadRequestException } from '@nestjs/common';

describe('CrearAutoUseCase', () => {
  let useCase: CrearAutoUseCase;
  let mockAutoRepository: jest.Mocked<IAutoRepository>;
  let mockHistorialRepository: jest.Mocked<IHistorialRepository>;
  let mockFirebaseStorageService: jest.Mocked<FirebaseStorageService>;
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
    equipamientoDestacado: ['GPS', 'Bluetooth'],
    caracteristicasGenerales: ['4 puertas'],
    exterior: ['Espejos eléctricos'],
    confort: ['Aire acondicionado'],
    seguridad: ['ABS', 'Airbags'],
    interior: ['Tapizado de cuero'],
    entretenimiento: ['Radio AM/FM'],
  };

  const mockImageFile: Express.Multer.File = {
    fieldname: 'imagenes',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('fake-image-data'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
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

    // Crear mock del FirebaseStorageService
    mockFirebaseStorageService = {
      uploadImage: jest.fn(),
      uploadMultipleImages: jest.fn(),
      deleteImage: jest.fn(),
      deleteMultipleImages: jest.fn(),
      getImageInfo: jest.fn(),
      getPublicUrl: jest.fn(),
      healthCheck: jest.fn(),
    } as any;

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
        {
          provide: FirebaseStorageService,
          useValue: mockFirebaseStorageService,
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
    it('debería crear un auto exitosamente sin imágenes', async () => {
      // Arrange
      const userId = 'user-123';
      const mockHistorial = { id: 'historial-456', createdAt: new Date() };
      
      mockAutoRepository.save.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue(mockHistorial as any);

      // Act
      const result = await useCase.execute(validCrearAutoDTO, [], userId);

      // Assert
      expect(result).toBeInstanceOf(Auto);
      expect(result.nombre).toBe(validCrearAutoDTO.nombre);
      expect(result.marca).toBe(validCrearAutoDTO.marca);
      expect(result.precio).toBe(validCrearAutoDTO.precio);
      expect(result.createdBy).toBe(userId);
      expect(result.updatedBy).toBe(userId);
      expect(result.imagenes).toEqual([]);
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      
      // Verificar que se llamó al repository del auto
      expect(mockAutoRepository.save).toHaveBeenCalledTimes(1);
      expect(mockAutoRepository.save).toHaveBeenCalledWith(expect.any(Auto));

      // Verificar que NO se llamó al servicio de Firebase
      expect(mockFirebaseStorageService.uploadMultipleImages).not.toHaveBeenCalled();

      // Verificar que se registró en el historial
      expect(mockHistorialRepository.crear).toHaveBeenCalledTimes(1);
    });

    it('debería crear un auto exitosamente con imágenes', async () => {
      // Arrange
      const userId = 'user-123';
      const files = [mockImageFile];
      const mockUploadResults = [
        {
          url: 'https://storage.googleapis.com/bucket/autos/ABC-123/image1.jpg',
          path: 'autos/ABC-123/image1.jpg',
          fileName: 'image1.jpg',
          size: 1024,
        },
      ];
      
      mockAutoRepository.save.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue({} as any);
      mockFirebaseStorageService.uploadMultipleImages.mockResolvedValue(mockUploadResults);

      // Act
      const result = await useCase.execute(validCrearAutoDTO, files, userId);

      // Assert
      expect(result).toBeInstanceOf(Auto);
      expect(result.imagenes).toEqual(['https://storage.googleapis.com/bucket/autos/ABC-123/image1.jpg']);
      
      // Verificar que se llamó al servicio de Firebase con las opciones correctas
      expect(mockFirebaseStorageService.uploadMultipleImages).toHaveBeenCalledTimes(1);
      expect(mockFirebaseStorageService.uploadMultipleImages).toHaveBeenCalledWith(
        files,
        {
          folder: 'autos/ABC-123',
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }
      );

      // Verificar que se guardó el auto con las imágenes
      expect(mockAutoRepository.save).toHaveBeenCalledTimes(1);
      expect(mockAutoRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        imagenes: ['https://storage.googleapis.com/bucket/autos/ABC-123/image1.jpg'],
      }));
    });

    it('debería crear un auto exitosamente con múltiples imágenes', async () => {
      // Arrange
      const userId = 'user-123';
      const files = [mockImageFile, { ...mockImageFile, originalname: 'test-image2.jpg' }];
      const mockUploadResults = [
        {
          url: 'https://storage.googleapis.com/bucket/autos/ABC-123/image1.jpg',
          path: 'autos/ABC-123/image1.jpg',
          fileName: 'image1.jpg',
          size: 1024,
        },
        {
          url: 'https://storage.googleapis.com/bucket/autos/ABC-123/image2.jpg',
          path: 'autos/ABC-123/image2.jpg',
          fileName: 'image2.jpg',
          size: 2048,
        },
      ];
      
      mockAutoRepository.save.mockResolvedValue(undefined);
      mockHistorialRepository.crear.mockResolvedValue({} as any);
      mockFirebaseStorageService.uploadMultipleImages.mockResolvedValue(mockUploadResults);

      // Act
      const result = await useCase.execute(validCrearAutoDTO, files, userId);

      // Assert
      expect(result.imagenes).toHaveLength(2);
      expect(result.imagenes).toEqual([
        'https://storage.googleapis.com/bucket/autos/ABC-123/image1.jpg',
        'https://storage.googleapis.com/bucket/autos/ABC-123/image2.jpg',
      ]);

      // Verificar que se registró en el historial con la información de las imágenes
      expect(mockHistorialRepository.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            metadata: expect.objectContaining({
              cantidadImagenes: 2,
              observaciones: expect.stringContaining('con 2 imagen(es)'),
            }),
          }),
        })
      );
    });

    it('debería lanzar BadRequestException si falla la subida de imágenes', async () => {
      // Arrange
      const userId = 'user-123';
      const files = [mockImageFile];
      const firebaseError = new Error('Error de Firebase Storage');
      
      mockFirebaseStorageService.uploadMultipleImages.mockRejectedValue(firebaseError);

      // Act & Assert
      await expect(useCase.execute(validCrearAutoDTO, files, userId)).rejects.toThrow(
        BadRequestException
      );
      await expect(useCase.execute(validCrearAutoDTO, files, userId)).rejects.toThrow(
        'Error al subir las imágenes: Error de Firebase Storage'
      );
      
      // Verificar que NO se guardó el auto si falló la subida de imágenes
      expect(mockAutoRepository.save).not.toHaveBeenCalled();
    });

    it('debería generar un UUID válido para el auto', async () => {
      // Arrange
      const userId = 'user-123';
      mockAutoRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validCrearAutoDTO, [], userId);

      // Assert
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result.id).toMatch(uuidRegex);
    });

    it('debería asignar correctamente el userId como createdBy y updatedBy', async () => {
      // Arrange
      const userId = 'test-user-456';
      mockAutoRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validCrearAutoDTO, [], userId);

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
      await expect(useCase.execute(invalidDTO, [], userId)).rejects.toThrow(
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
      await expect(useCase.execute(validCrearAutoDTO, [], userId)).rejects.toThrow(
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
      const result = await useCase.execute(otroAutoDTO, [], userId);

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
      const result = await useCase.execute(dtoConArrays, [], userId);

      // Assert
      expect(result.equipamientoDestacado).toEqual(dtoConArrays.equipamientoDestacado);
      expect(result.seguridad).toEqual(dtoConArrays.seguridad);
      expect(result.entretenimiento).toEqual(dtoConArrays.entretenimiento);
    });
  });
}); 