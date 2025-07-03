import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { IAutoRepository } from '../../../domain/auto.repository';
import { HistorialService } from '../../../../shared/services/historial.service';
import { TipoEntidad, TipoAccion } from '../../../../shared/entities/historial.entity';

@Injectable()
export class EliminarImagenAutoUseCase {
  private readonly logger = new Logger(EliminarImagenAutoUseCase.name);

  constructor(
    private readonly firebaseStorageService: FirebaseStorageService,
    @Inject('IAutoRepository') private readonly autoRepository: IAutoRepository,
    private readonly historialService: HistorialService,
  ) {}

  async execute(autoId: string, fileName: string, usuarioId: string): Promise<{ mensaje: string }> {
    try {
      // 1. Verificar que el auto existe
      const auto = await this.autoRepository.findOneById(autoId);
      if (!auto) {
        throw new NotFoundException(`Auto con ID ${autoId} no encontrado`);
      }

      // 2. Construir el path de la imagen basado en la matrícula y fileName
      const filePath = `autos/${auto.matricula}/${fileName}`;
      const urlAEliminar = this.firebaseStorageService.getPublicUrl(filePath);
      
      // 3. Verificar que la imagen existe en el auto
      const imagenesActuales = auto.imagenes || [];
      if (!imagenesActuales.includes(urlAEliminar)) {
        throw new BadRequestException('La imagen no está asociada a este auto');
      }

      this.logger.log(`Eliminando imagen ${filePath} del auto ${autoId}`);

      // 4. Eliminar imagen de Firebase Storage
      await this.firebaseStorageService.deleteImage(filePath);

      // 5. Actualizar el auto removiendo la URL de la imagen
      const imagenesActualizadas = imagenesActuales.filter(url => url !== urlAEliminar);
      
      const autoActualizado = auto.actualizarCon({
        imagenes: imagenesActualizadas,
        updatedAt: new Date(),
      });

      await this.autoRepository.update(autoId, autoActualizado);

      // 6. Registrar en historial - UN SOLO REGISTRO por operación
      await this.historialService.registrarCambio({
        entidadId: autoId,
        tipoEntidad: TipoEntidad.AUTO,
        tipoAccion: TipoAccion.ACTUALIZAR,
        campoAfectado: 'imagenes',
        valorAnterior: `${imagenesActuales.length} imagen(es)`,
        valorNuevo: `${imagenesActualizadas.length} imagen(es)`,
        observaciones: `Se eliminó 1 imagen del auto: ${auto.nombre} - ${auto.matricula}`,
        usuarioId,
        metadata: {
          autoNombre: auto.nombre,
          autoMatricula: auto.matricula,
          autoMarca: auto.marca,
          autoModelo: auto.modelo,
          tipoOperacion: 'ELIMINAR_IMAGEN',
          cantidadImagenesAnterior: imagenesActuales.length,
          cantidadImagenesNueva: imagenesActualizadas.length,
          archivoEliminado: fileName,
          urlEliminada: urlAEliminar,
        },
      });

      this.logger.log(`Imagen eliminada exitosamente del auto ${autoId}`);

      return {
        mensaje: 'Imagen eliminada exitosamente'
      };

    } catch (error) {
      this.logger.error(`Error eliminando imagen del auto ${autoId}:`, error);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Error interno al eliminar la imagen');
    }
  }

  /**
   * Elimina todas las imágenes de un auto (útil cuando se elimina el auto)
   */
  async eliminarTodasLasImagenes(autoId: string, usuarioId?: string): Promise<void> {
    try {
      const auto = await this.autoRepository.findOneById(autoId);
      if (!auto || !auto.imagenes || auto.imagenes.length === 0) {
        return;
      }

      const cantidadImagenesAnterior = auto.imagenes.length;
      this.logger.log(`Eliminando ${cantidadImagenesAnterior} imágenes del auto ${autoId}`);

      // Extraer paths de las URLs
      const filePaths = auto.imagenes.map(url => {
        // Extraer el path de la URL pública
        const urlParts = url.split('/');
        const bucketIndex = urlParts.findIndex(part => part.includes('.appspot.com'));
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
          return urlParts.slice(bucketIndex + 1).join('/');
        }
        return null;
      }).filter(path => path !== null) as string[];

      // Eliminar todas las imágenes de Firebase Storage
      await this.firebaseStorageService.deleteMultipleImages(filePaths);

      // Actualizar el auto removiendo todas las imágenes
      const autoActualizado = auto.actualizarCon({
        imagenes: [],
        updatedAt: new Date(),
      });

      await this.autoRepository.update(autoId, autoActualizado);

      // Registrar en historial solo si hay usuarioId (operación manual)
      if (usuarioId) {
        await this.historialService.registrarCambio({
          entidadId: autoId,
          tipoEntidad: TipoEntidad.AUTO,
          tipoAccion: TipoAccion.ACTUALIZAR,
          campoAfectado: 'imagenes',
          valorAnterior: `${cantidadImagenesAnterior} imagen(es)`,
          valorNuevo: '0 imagen(es)',
          observaciones: `Se eliminaron todas las imágenes del auto: ${auto.nombre} - ${auto.matricula}`,
          usuarioId,
          metadata: {
            autoNombre: auto.nombre,
            autoMatricula: auto.matricula,
            autoMarca: auto.marca,
            autoModelo: auto.modelo,
            tipoOperacion: 'ELIMINAR_TODAS_IMAGENES',
            cantidadImagenesEliminadas: cantidadImagenesAnterior,
            cantidadImagenesAnterior,
            cantidadImagenesNueva: 0,
          },
        });
      }

      this.logger.log(`Todas las imágenes eliminadas del auto ${autoId}`);

    } catch (error) {
      this.logger.error(`Error eliminando todas las imágenes del auto ${autoId}:`, error);
      // No lanzar error para evitar fallar operaciones en cascada
    }
  }
} 