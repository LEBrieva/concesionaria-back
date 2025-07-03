import { ActualizarAutoDTO } from '@autos/application/dtos/autos/actualizar/actualizar-auto.dto';
import { Auto } from '@autos/domain/auto.entity';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { Inject, Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { HistorialService } from '../../../../shared/services/historial.service';
import { TipoEntidad, TipoAccion } from '../../../../shared/entities/historial.entity';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';

@Injectable()
export class ActualizarAutoUseCase {
  private readonly logger = new Logger(ActualizarAutoUseCase.name);

  constructor(
    @Inject('IAutoRepository') private readonly autoRepo: IAutoRepository,
    private readonly historialService: HistorialService,
    private readonly firebaseStorageService: FirebaseStorageService,
  ) {}

  async execute(id: string, dto: ActualizarAutoDTO, files: Express.Multer.File[], userId: string): Promise<Auto> {
    const auto = await this.autoRepo.findOneById(id);
    if (!auto) throw new NotFoundException('Auto no encontrado');

    this.logger.log(`Actualizando auto ${id} con ${files?.length || 0} imágenes nuevas`);

    // 1. Gestionar imágenes de forma inteligente (solo si se proporcionan imágenes en el DTO o archivos)
    let imagenesFinales = auto.imagenes || [];
    if (dto.imagenes !== undefined || (files && files.length > 0)) {
      imagenesFinales = await this.gestionarImagenes(auto, dto.imagenes || [], files || []);
    }

    // 2. Preparar DTO con las imágenes finales
    const dtoConImagenes = { ...dto, imagenes: imagenesFinales };

    // 3. Detectar cambios antes de actualizar (incluyendo imágenes)
    const cambios = this.detectarCambios(auto, dtoConImagenes);

    // 4. Actualizar el auto
    const updatedAuto = auto.actualizarCon({ ...dtoConImagenes, updatedBy: userId }); 
    await this.autoRepo.update(id, updatedAuto);

    // 5. Registrar cada cambio en el historial
    await this.registrarCambiosEnHistorial(id, cambios, userId, auto);

    this.logger.log(`Auto ${id} actualizado exitosamente con ${imagenesFinales.length} imágenes`);

    return updatedAuto;
  }

  private detectarCambios(autoActual: Auto, dto: ActualizarAutoDTO): Array<{
    campo: string;
    valorAnterior: any;
    valorNuevo: any;
  }> {
    const cambios: Array<{ campo: string; valorAnterior: any; valorNuevo: any }> = [];

    // Lista de campos que pueden cambiar
    const camposAComparar = [
      'nombre', 'descripcion', 'observaciones', 'matricula', 'marca', 'modelo', 
      'version', 'ano', 'kilometraje', 'precio', 'costo', 'transmision', 
      'color', 'imagenes', 'equipamientoDestacado', 'caracteristicasGenerales',
      'exterior', 'confort', 'seguridad', 'interior', 'entretenimiento'
    ];

    camposAComparar.forEach(campo => {
      if (dto[campo] !== undefined) {
        const valorActual = autoActual[campo];
        const valorNuevo = dto[campo];

        // Comparar valores (arrays requieren comparación especial)
        if (Array.isArray(valorActual) && Array.isArray(valorNuevo)) {
          if (JSON.stringify(valorActual) !== JSON.stringify(valorNuevo)) {
            cambios.push({
              campo,
              valorAnterior: valorActual,
              valorNuevo: valorNuevo,
            });
          }
        } else if (valorActual !== valorNuevo) {
          cambios.push({
            campo,
            valorAnterior: valorActual,
            valorNuevo: valorNuevo,
          });
        }
      }
    });

    return cambios;
  }

  private async registrarCambiosEnHistorial(
    autoId: string,
    cambios: Array<{ campo: string; valorAnterior: any; valorNuevo: any }>,
    usuarioId: string,
    autoOriginal: Auto
  ): Promise<void> {
    // Si no hay cambios, no registrar nada
    if (cambios.length === 0) return;

    // Registrar todos los cambios en paralelo para mejor performance
    const promesasHistorial = cambios.map(cambio => {
      // Metadata especial para cambios de imágenes
      let metadata: any = {
        autoNombre: autoOriginal.nombre,
        autoMatricula: autoOriginal.matricula,
        tipoActualizacion: 'campo_individual',
        campo: cambio.campo,
      };

      // Agregar información detallada para cambios de imágenes
      if (cambio.campo === 'imagenes') {
        const imagenesAnteriores = Array.isArray(cambio.valorAnterior) ? cambio.valorAnterior : [];
        const imagenesNuevas = Array.isArray(cambio.valorNuevo) ? cambio.valorNuevo : [];
        
        metadata = {
          ...metadata,
          tipoActualizacion: 'imagenes_inteligente',
          cantidadImagenesAnterior: imagenesAnteriores.length,
          cantidadImagenesNueva: imagenesNuevas.length,
          imagenesEliminadas: imagenesAnteriores.filter(img => !imagenesNuevas.includes(img)).length,
          imagenesAgregadas: imagenesNuevas.filter(img => !imagenesAnteriores.includes(img)).length,
          imagenesMantenidas: imagenesAnteriores.filter(img => imagenesNuevas.includes(img)).length,
        };
      }

      return this.historialService.registrarCambio({
        entidadId: autoId,
        tipoEntidad: TipoEntidad.AUTO,
        tipoAccion: TipoAccion.ACTUALIZAR,
        campoAfectado: cambio.campo,
        valorAnterior: this.formatearValor(cambio.valorAnterior),
        valorNuevo: this.formatearValor(cambio.valorNuevo),
        observaciones: cambio.campo === 'imagenes' 
          ? this.generarObservacionesImagenes(cambio.valorAnterior, cambio.valorNuevo)
          : `Campo '${cambio.campo}' actualizado`,
        usuarioId,
        metadata,
      });
    });

    await Promise.all(promesasHistorial);
  }

  /**
   * Genera observaciones detalladas para cambios de imágenes
   */
  private generarObservacionesImagenes(imagenesAnteriores: any, imagenesNuevas: any): string {
    const anteriores: string[] = Array.isArray(imagenesAnteriores) ? imagenesAnteriores : [];
    const nuevas: string[] = Array.isArray(imagenesNuevas) ? imagenesNuevas : [];
    
    const eliminadas = anteriores.filter((img: string) => !nuevas.includes(img)).length;
    const agregadas = nuevas.filter((img: string) => !anteriores.includes(img)).length;
    const mantenidas = anteriores.filter((img: string) => nuevas.includes(img)).length;

    const operaciones: string[] = [];
    if (eliminadas > 0) operaciones.push(`${eliminadas} eliminada(s)`);
    if (agregadas > 0) operaciones.push(`${agregadas} agregada(s)`);
    if (mantenidas > 0) operaciones.push(`${mantenidas} mantenida(s)`);

    return `Imágenes actualizadas: ${operaciones.join(', ')}. Total: ${anteriores.length} → ${nuevas.length}`;
  }

  private formatearValor(valor: any): string {
    if (valor === null || valor === undefined) return 'null';
    if (Array.isArray(valor)) return JSON.stringify(valor);
    if (typeof valor === 'object') return JSON.stringify(valor);
    return String(valor);
  }

  /**
   * Gestiona las imágenes de forma inteligente:
   * 1. Mantiene las imágenes existentes que están en imagenesAMantener
   * 2. Elimina las imágenes que no están en imagenesAMantener
   * 3. Sube las nuevas imágenes de archivos
   * 4. Valida que no se excedan los límites
   */
  private async gestionarImagenes(
    auto: Auto,
    imagenesAMantener: string[],
    nuevosArchivos: Express.Multer.File[]
  ): Promise<string[]> {
    const imagenesExistentes = auto.imagenes || [];
    
    this.logger.log(`Gestionando imágenes: ${imagenesExistentes.length} existentes, ${imagenesAMantener.length} a mantener, ${nuevosArchivos.length} nuevas`);

    // 1. Identificar imágenes a eliminar
    const imagenesAEliminar = imagenesExistentes.filter(url => !imagenesAMantener.includes(url));
    
    // 2. Validar límite total de imágenes
    const totalImagenesFinales = imagenesAMantener.length + nuevosArchivos.length;
    if (totalImagenesFinales > 10) {
      throw new BadRequestException(`Total de imágenes excede el límite de 10. Actual: ${totalImagenesFinales}`);
    }

    // 3. Eliminar imágenes que ya no se necesitan
    if (imagenesAEliminar.length > 0) {
      this.logger.log(`Eliminando ${imagenesAEliminar.length} imágenes obsoletas`);
      await this.eliminarImagenesObsoletas(imagenesAEliminar, auto.matricula);
    }

    // 4. Subir nuevas imágenes si las hay
    let urlsNuevasImagenes: string[] = [];
    if (nuevosArchivos.length > 0) {
      this.logger.log(`Subiendo ${nuevosArchivos.length} imágenes nuevas`);
      urlsNuevasImagenes = await this.subirNuevasImagenes(nuevosArchivos, auto.matricula);
    }

    // 5. Combinar imágenes finales
    const imagenesFinales = [...imagenesAMantener, ...urlsNuevasImagenes];

    this.logger.log(`Gestión de imágenes completada: ${imagenesFinales.length} imágenes finales`);
    
    return imagenesFinales;
  }

  /**
   * Elimina imágenes obsoletas de Firebase Storage
   */
  private async eliminarImagenesObsoletas(imagenesAEliminar: string[], matricula: string): Promise<void> {
    try {
      // Extraer nombres de archivo de las URLs
      const filePaths = imagenesAEliminar.map(url => {
        try {
          // Obtener el path desde la URL pública
          const urlParts = url.split('/');
          const bucketIndex = urlParts.findIndex(part => part.includes('.appspot.com'));
          if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
            return decodeURIComponent(urlParts.slice(bucketIndex + 1).join('/'));
          }
          return null;
        } catch (error) {
          this.logger.warn(`Error extrayendo path de URL: ${url}`, error);
          return null;
        }
      }).filter(path => path !== null) as string[];

      if (filePaths.length > 0) {
        await this.firebaseStorageService.deleteMultipleImages(filePaths);
        this.logger.log(`${filePaths.length} imágenes eliminadas de Firebase Storage`);
      }
    } catch (error) {
      this.logger.error('Error eliminando imágenes obsoletas:', error);
      // No lanzar error para no fallar la actualización completa
    }
  }

  /**
   * Sube nuevas imágenes a Firebase Storage
   */
  private async subirNuevasImagenes(archivos: Express.Multer.File[], matricula: string): Promise<string[]> {
    try {
      const folderPath = `autos/${matricula}`;
      const uploadOptions = {
        folder: folderPath,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      };

      const uploadResults = await this.firebaseStorageService.uploadMultipleImages(
        archivos,
        uploadOptions
      );

      const urls = uploadResults.map(result => result.url);
      this.logger.log(`${urls.length} imágenes nuevas subidas exitosamente`);
      
      return urls;
    } catch (error) {
      this.logger.error('Error subiendo nuevas imágenes:', error);
      throw new BadRequestException(`Error al subir las imágenes: ${error.message}`);
    }
  }
}
