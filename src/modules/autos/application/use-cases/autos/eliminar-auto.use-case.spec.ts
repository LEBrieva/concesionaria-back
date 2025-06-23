import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EliminarAutoUseCase } from './eliminar-auto.use-case';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { HistorialService } from '../../../../shared/services/historial.service';
import { Auto } from '@autos/domain/auto.entity';
import { Marca, EstadoAuto, Transmision, Color } from '@autos/domain/auto.enum';

describe('EliminarAutoUseCase', () => {
  let useCase: EliminarAutoUseCase;
  let mockAutoRepository: jest.Mocked<IAutoRepository>;
  let mockHistorialService: jest.Mocked<HistorialService>;

  // Mock data
  const mockAuto = new Auto({
    id: 'auto-123',
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
    esFavorito: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    updatedBy: 'user-456',
  });

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
      findFavoritos: jest.fn(),
      countFavoritos: jest.fn(),
    };

    const mockHistorial = {
      registrarEliminacion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EliminarAutoUseCase,
        {
          provide: 'IAutoRepository',
          useValue: mockAutoRepository,
        },
        {
          provide: HistorialService,
          useValue: mockHistorial,
        },
      ],
    }).compile();

    useCase = module.get<EliminarAutoUseCase>(EliminarAutoUseCase);
    mockHistorialService = module.get(HistorialService);
  });

  describe('execute', () => {
    const autoId = 'auto-123';
    const usuarioId = 'user-123';

    it('debería eliminar un auto exitosamente', async () => {
      mockAutoRepository.findOneById.mockResolvedValue(mockAuto);
      mockAutoRepository.softDelete.mockResolvedValue(undefined);
      mockHistorialService.registrarEliminacion.mockResolvedValue({} as any);

      await useCase.execute(autoId, usuarioId);

      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.softDelete).toHaveBeenCalledWith(autoId);
      expect(mockHistorialService.registrarEliminacion).toHaveBeenCalled();
    });

    it('debería eliminar un auto con observaciones personalizadas', async () => {
      const observaciones = 'Auto eliminado por daños graves';

      mockAutoRepository.findOneById.mockResolvedValue(mockAuto);
      mockAutoRepository.softDelete.mockResolvedValue(undefined);
      mockHistorialService.registrarEliminacion.mockResolvedValue({} as any);

      await useCase.execute(autoId, usuarioId, observaciones);

      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.softDelete).toHaveBeenCalledWith(autoId);
      expect(mockHistorialService.registrarEliminacion).toHaveBeenCalledWith(
        autoId,
        expect.any(String), // TipoEntidad.AUTO
        usuarioId,
        observaciones,
        expect.any(Object)
      );
    });

    it('debería lanzar NotFoundException si el auto no existe', async () => {
      mockAutoRepository.findOneById.mockResolvedValue(null);

      await expect(useCase.execute(autoId, usuarioId)).rejects.toThrow(NotFoundException);
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.softDelete).not.toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException si el auto ya está eliminado', async () => {
      const autoEliminado = mockAuto.actualizarCon({ active: false });

      mockAutoRepository.findOneById.mockResolvedValue(autoEliminado);

      await expect(useCase.execute(autoId, usuarioId)).rejects.toThrow(BadRequestException);
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.softDelete).not.toHaveBeenCalled();
    });
  });
}); 