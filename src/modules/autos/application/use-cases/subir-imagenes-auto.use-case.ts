import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { ImageUploadResult } from '../../../shared/interfaces';
import { IAutoRepository } from '../../domain/auto.repository';
import { SubirImagenesResponseDto, ImagenSubidaResponseDto } from '../dtos/imagenes/imagenes-response.dto';
import { HistorialService } from '../../../shared/services/historial.service';
import { TipoEntidad, TipoAccion } from '../../../shared/entities/historial.entity';

@Injectable()
export class SubirImagenesAutoUseCase {
  private readonly logger = new Logger(SubirImagenesAutoUseCase.name);

  constructor(
    private readonly firebaseStorageService: FirebaseStorageService,
    @Inject('IAutoRepository') private readonly autoRepository: IAutoRepository,
    private readonly historialService: HistorialService,
  ) {}

  async execute(
    autoId: string,
    files: Express.Multer.File[],
    usuarioId: string
  ): Promise<SubirImagenesResponseDto> {
    // 1. Validar que existan archivos
    if (!files || files.length === 0) {
      throw new BadRequestException('Debe proporcionar al menos una imagen');
    }

    // Validar límite de archivos
    if (files.length > 10) {
      throw new BadRequestException('Máximo 10 imágenes por vez');
    }

    // 2. Verificar que el auto existe
    const auto = await this.autoRepository.findOneById(autoId);
    if (!auto) {
      throw new NotFoundException(`Auto con ID ${autoId} no encontrado`);
    }

    this.logger.log(`Subiendo ${files.length} imágenes para auto ${autoId}`);

    // 3. Obtener imágenes existentes antes de la subida
    const imagenesAnteriores = auto.imagenes || [];

    // 4. Configurar opciones de subida con estructura basada en matrícula
    const folderPath = `autos/${auto.matricula}`;
    const uploadOptions = {
      folder: folderPath,
      // maxSizeInMB se usa del servicio (configurable via env var)
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    };

    // 5. Subir imágenes a Firebase Storage
    const uploadResults: ImageUploadResult[] = await this.firebaseStorageService.uploadMultipleImages(
      files,
      uploadOptions
    );

    // 6. Preparar respuesta (solo datos útiles para el frontend)
    const imagenesResponse: ImagenSubidaResponseDto[] = uploadResults.map(result => ({
      url: result.url,
      fileName: result.fileName,
    }));

    // 7. Actualizar el auto con las URLs de las imágenes
    await this.actualizarImagenesEnAuto(autoId, uploadResults);

    // 8. Registrar en historial - UN SOLO REGISTRO por operación
    const nuevasImagenes = uploadResults.map(result => result.url);
    await this.historialService.registrarCambio({
      entidadId: autoId,
      tipoEntidad: TipoEntidad.AUTO,
      tipoAccion: TipoAccion.ACTUALIZAR,
      campoAfectado: 'imagenes',
      valorAnterior: `${imagenesAnteriores.length} imagen(es)`,
      valorNuevo: `${imagenesAnteriores.length + nuevasImagenes.length} imagen(es)`,
      observaciones: `Se subieron ${nuevasImagenes.length} imagen(es) al auto: ${auto.nombre} - ${auto.matricula}`,
      usuarioId,
      metadata: {
        autoNombre: auto.nombre,
        autoMatricula: auto.matricula,
        autoMarca: auto.marca,
        autoModelo: auto.modelo,
        tipoOperacion: 'SUBIR_IMAGENES',
        cantidadImagenesSubidas: nuevasImagenes.length,
        cantidadImagenesAnterior: imagenesAnteriores.length,
        cantidadImagenesNueva: imagenesAnteriores.length + nuevasImagenes.length,
        nombresArchivos: uploadResults.map(r => r.fileName),
        urlsSubidas: nuevasImagenes,
      },
    });

    const response: SubirImagenesResponseDto = {
      imagenes: imagenesResponse,
      total: imagenesResponse.length,
      mensaje: `${imagenesResponse.length} imagen(es) subida(s) exitosamente`,
    };

    this.logger.log(`Imágenes subidas exitosamente para auto ${autoId}: ${uploadResults.length} archivos`);
    return response;
  }

  /**
   * Actualiza el auto con las URLs de las imágenes
   * Nota: Esto requiere que tengas un campo para almacenar las imágenes en el modelo Auto
   */
  private async actualizarImagenesEnAuto(autoId: string, uploadResults: ImageUploadResult[]): Promise<void> {
    try {
      // Obtener el auto actual
      const auto = await this.autoRepository.findOneById(autoId);
      if (!auto) return;

      // Obtener imágenes existentes (si las hay)
      const imagenesExistentes = auto.imagenes || [];
      
      // Agregar las nuevas URLs
      const nuevasImagenes = uploadResults.map(result => result.url);
      const todasLasImagenes = [...imagenesExistentes, ...nuevasImagenes];

      // Actualizar el auto
      const autoActualizado = auto.actualizarCon({
        imagenes: todasLasImagenes,
        updatedAt: new Date(),
      });

      await this.autoRepository.update(autoId, autoActualizado);
      
      this.logger.log(`Auto ${autoId} actualizado con ${nuevasImagenes.length} nuevas imágenes`);

    } catch (error) {
      this.logger.error(`Error actualizando imágenes en auto ${autoId}:`, error);
      // No lanzar error para evitar fallar la subida completa
    }
  }
} 