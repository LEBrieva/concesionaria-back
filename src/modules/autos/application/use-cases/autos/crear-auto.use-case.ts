import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { Auto } from '../../../domain/auto.entity';
import { v4 as uuidv4 } from 'uuid';
import { CrearAutoDTO } from '@autos/application/dtos/autos/crear/crear-auto.dto';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { HistorialService } from '../../../../shared/services/historial.service';
import { TipoEntidad } from '../../../../shared/entities/historial.entity';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';

@Injectable()
export class CrearAutoUseCase {
  private readonly logger = new Logger(CrearAutoUseCase.name);

  constructor(
    @Inject('IAutoRepository') private readonly autoRepo: IAutoRepository,
    private readonly historialService: HistorialService,
    private readonly firebaseStorageService: FirebaseStorageService,
  ) {}

  async execute(dto: CrearAutoDTO, files: Express.Multer.File[], userId: string): Promise<Auto> {
    // 1. Crear el auto con los datos básicos
    const auto = new Auto({
      ...dto,
      imagenes: [], // Inicialmente vacío, se llenará después de subir las imágenes
      esFavorito: false,
      id: uuidv4(),
      createdBy: userId,
      updatedBy: userId,
    });
    
    // 2. Subir imágenes a Firebase Storage si se proporcionaron
    let imagenesUrls: string[] = [];
    if (files && files.length > 0) {
      this.logger.log(`Subiendo ${files.length} imágenes para el auto ${auto.nombre}`);
      
      // Configurar opciones de subida con estructura basada en matrícula
      const folderPath = `autos/${auto.matricula}`;
      const uploadOptions = {
        folder: folderPath,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      };

      try {
        // Subir todas las imágenes
        const uploadResults = await this.firebaseStorageService.uploadMultipleImages(
          files,
          uploadOptions
        );
        
        // Extraer las URLs de las imágenes subidas
        imagenesUrls = uploadResults.map(result => result.url);
        
        this.logger.log(`${imagenesUrls.length} imágenes subidas exitosamente para el auto ${auto.nombre}`);
      } catch (error) {
        this.logger.error(`Error subiendo imágenes para el auto ${auto.nombre}: ${error.message}`);
        throw new BadRequestException(`Error al subir las imágenes: ${error.message}`);
      }
    }

    // 3. Actualizar el auto con las URLs de las imágenes
    const autoConImagenes = auto.actualizarCon({
      imagenes: imagenesUrls,
    });

    // 4. Guardar el auto en la base de datos
    await this.autoRepo.save(autoConImagenes);

    // 5. Registrar en el historial
    await this.historialService.registrarCreacion(
      autoConImagenes.id,
      TipoEntidad.AUTO,
      userId,
      {
        nombre: autoConImagenes.nombre,
        marca: autoConImagenes.marca,
        modelo: autoConImagenes.modelo,
        ano: autoConImagenes.ano,
        precio: autoConImagenes.precio,
        estado: autoConImagenes.estado,
        matricula: autoConImagenes.matricula,
        cantidadImagenes: imagenesUrls.length,
        observaciones: `Auto creado: ${autoConImagenes.nombre} - ${autoConImagenes.matricula}${imagenesUrls.length > 0 ? ` con ${imagenesUrls.length} imagen(es)` : ''}`,
      }
    );

    return autoConImagenes;
  }
}
