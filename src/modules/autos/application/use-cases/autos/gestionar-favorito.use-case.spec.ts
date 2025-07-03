import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GestionarFavoritoUseCase } from './gestionar-favorito.use-case';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { HistorialService } from '../../../../shared/services/historial.service';
import { Auto } from '@autos/domain/auto.entity';
import { AutoProps } from '@autos/domain/interfaces/auto.interfaces';
import { Marca, EstadoAuto, Transmision, Color } from '@autos/domain/auto.enum';
import { GestionarFavoritoDto } from '@autos/application/dtos/favoritos/gestionar-favorito.dto';

describe('GestionarFavoritoUseCase', () => {
  let useCase: GestionarFavoritoUseCase;
  let mockAutoRepository: jest.Mocked<IAutoRepository>;
  let mockHistorialService: jest.Mocked<HistorialService>;

  const validAutoProps: AutoProps = {
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
    updatedBy: 'user-123',
  };

  beforeEach(async () => {
    const mockRepository = {
      findOneById: jest.fn(),
      countFavoritos: jest.fn(),
      update: jest.fn(),
    };

    const mockHistorial = {
      registrarCambio: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GestionarFavoritoUseCase,
        {
          provide: 'IAutoRepository',
          useValue: mockRepository,
        },
        {
          provide: HistorialService,
          useValue: mockHistorial,
        },
      ],
    }).compile();

    useCase = module.get<GestionarFavoritoUseCase>(GestionarFavoritoUseCase);
    mockAutoRepository = module.get('IAutoRepository');
    mockHistorialService = module.get(HistorialService);
  });

  describe('execute', () => {
    const autoId = '123e4567-e89b-12d3-a456-426614174000';
    const usuarioId = 'user-123';

    it('debería marcar un auto como favorito exitosamente', async () => {
      const auto = new Auto(validAutoProps);
      const dto: GestionarFavoritoDto = { esFavorito: true };

      mockAutoRepository.findOneById.mockResolvedValue(auto);
      mockAutoRepository.countFavoritos.mockResolvedValue(3);
      mockAutoRepository.update.mockResolvedValue(undefined);
      mockHistorialService.registrarCambio.mockResolvedValue({} as any);

      await useCase.execute(autoId, dto, usuarioId);

      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.countFavoritos).toHaveBeenCalled();
      expect(mockAutoRepository.update).toHaveBeenCalledWith(autoId, expect.any(Auto));
      expect(mockHistorialService.registrarCambio).toHaveBeenCalled();
    });

    it('debería remover un auto de favoritos exitosamente', async () => {
      const autoFavorito = new Auto({ ...validAutoProps, esFavorito: true });
      const dto: GestionarFavoritoDto = { esFavorito: false };

      mockAutoRepository.findOneById.mockResolvedValue(autoFavorito);
      mockAutoRepository.update.mockResolvedValue(undefined);
      mockHistorialService.registrarCambio.mockResolvedValue({} as any);

      await useCase.execute(autoId, dto, usuarioId);

      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.countFavoritos).not.toHaveBeenCalled();
      expect(mockAutoRepository.update).toHaveBeenCalledWith(autoId, expect.any(Auto));
      expect(mockHistorialService.registrarCambio).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si el auto no existe', async () => {
      const dto: GestionarFavoritoDto = { esFavorito: true };

      mockAutoRepository.findOneById.mockResolvedValue(null);

      await expect(useCase.execute(autoId, dto, usuarioId)).rejects.toThrow(NotFoundException);
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
    });

    it('debería lanzar BadRequestException si se intenta gestionar favoritos de un auto eliminado', async () => {
      const autoEliminado = new Auto({ ...validAutoProps, active: false });
      const dto: GestionarFavoritoDto = { esFavorito: true };

      mockAutoRepository.findOneById.mockResolvedValue(autoEliminado);

      await expect(useCase.execute(autoId, dto, usuarioId)).rejects.toThrow(BadRequestException);
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
    });

    it('debería lanzar BadRequestException si se excede el límite de favoritos', async () => {
      const auto = new Auto(validAutoProps);
      const dto: GestionarFavoritoDto = { esFavorito: true };

      mockAutoRepository.findOneById.mockResolvedValue(auto);
      mockAutoRepository.countFavoritos.mockResolvedValue(6); // Máximo alcanzado

      await expect(useCase.execute(autoId, dto, usuarioId)).rejects.toThrow(BadRequestException);
      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.countFavoritos).toHaveBeenCalled();
    });

    it('no debería hacer nada si el estado de favorito ya es el mismo', async () => {
      const autoFavorito = new Auto({ ...validAutoProps, esFavorito: true });
      const dto: GestionarFavoritoDto = { esFavorito: true };

      mockAutoRepository.findOneById.mockResolvedValue(autoFavorito);

      await useCase.execute(autoId, dto, usuarioId);

      expect(mockAutoRepository.findOneById).toHaveBeenCalledWith(autoId);
      expect(mockAutoRepository.update).not.toHaveBeenCalled();
      expect(mockHistorialService.registrarCambio).not.toHaveBeenCalled();
    });
  });
}); 