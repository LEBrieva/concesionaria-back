import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { ImageUploadResult, ImageUploadOptions } from '../interfaces/firebase-storage.interfaces';
import { FirebaseService } from './firebase.service';

interface FirebaseStorageConfig {
  bucketName: string;
  maxSizeMB: number;
  allowedTypes: string[];
  maxFiles: number;
}

@Injectable()
export class FirebaseStorageService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseStorageService.name);
  private config: FirebaseStorageConfig;
  private bucket: any | null = null;

  constructor(private readonly firebaseService: FirebaseService) {}

  async onModuleInit() {
    this.initializeConfig();
    await this.initializeBucket();
  }

  /**
   * Inicializa la configuración del servicio
   */
  private initializeConfig(): void {
    this.config = {
      bucketName: this.getBucketName(),
      maxSizeMB: parseInt(process.env.MAX_IMAGE_SIZE_MB || '5'),
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxFiles: parseInt(process.env.MAX_FILES || '10'),
    };

    this.logger.log(`Firebase Storage configurado con bucket: ${this.config.bucketName}`);
  }

  /**
   * Determina el nombre correcto del bucket con fallbacks inteligentes
   */
  private getBucketName(): string {
    // 1. Usar variable específica si está definida
    if (process.env.FIREBASE_STORAGE_BUCKET) {
      return process.env.FIREBASE_STORAGE_BUCKET;
    }

    // 2. Generar basado en PROJECT_ID con nuevo formato
    if (process.env.FIREBASE_PROJECT_ID) {
      return `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`;
    }

    // 3. Fallback al formato antiguo
    if (process.env.FIREBASE_PROJECT_ID) {
      return `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    }

    throw new Error('No se pudo determinar el nombre del bucket de Firebase Storage');
  }

  /**
   * Inicializa la conexión al bucket de forma lazy
   */
  private async initializeBucket(): Promise<void> {
    try {
      if (!admin.apps.length) {
        this.logger.warn('Firebase Admin SDK no inicializado, esperando...');
        return;
      }

      this.bucket = admin.storage().bucket(this.config.bucketName);
      
      // Verificar que el bucket existe
      await this.bucket.getMetadata();
      this.logger.log('Conexión a Firebase Storage establecida correctamente');
      
    } catch (error) {
      this.logger.error(`Error inicializando Firebase Storage: ${error.message}`);
      this.bucket = null;
    }
  }

  /**
   * Obtiene la instancia del bucket, inicializándola si es necesario
   */
  private async getBucket(): Promise<any> {
    if (!this.bucket) {
      await this.initializeBucket();
    }

    if (!this.bucket) {
      throw new BadRequestException('Firebase Storage no está disponible');
    }

    return this.bucket;
  }

  /**
   * Sube una imagen a Firebase Storage
   */
  async uploadImage(
    file: Express.Multer.File,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    try {
      // Configuración con valores por defecto
      const uploadConfig = {
        folder: options.folder || 'images',
        maxSizeInMB: options.maxSizeInMB || this.config.maxSizeMB,
        allowedTypes: options.allowedTypes || this.config.allowedTypes,
        generateThumbnail: options.generateThumbnail || false,
      };

      // Validaciones
      this.validateImage(file, uploadConfig);

      // Generar nombre único para el archivo
      const fileName = this.generateFileName(file.originalname);
      const filePath = `${uploadConfig.folder}/${fileName}`;

      // Obtener bucket y crear referencia al archivo
      const bucket = await this.getBucket();
      const fileRef = bucket.file(filePath);

      // Subir archivo
      await this.uploadFileToStorage(file, fileRef);

      // Hacer el archivo público
      await fileRef.makePublic();

      // Construir URL pública
      const publicUrl = this.buildPublicUrl(filePath);

      const result: ImageUploadResult = {
        url: publicUrl,
        path: filePath,
        fileName: fileName,
        size: file.size,
      };

      this.logger.log(`Imagen subida exitosamente: ${fileName} (${file.size} bytes)`);
      return result;

    } catch (error) {
      this.logger.error(`Error subiendo imagen: ${error.message}`);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Error interno al procesar la imagen: ${error.message}`);
    }
  }

  /**
   * Maneja la subida del archivo al storage
   */
  private async uploadFileToStorage(
    file: Express.Multer.File, 
    fileRef: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedAt: new Date().toISOString(),
            originalName: file.originalname,
            size: file.size.toString(),
          },
        },
      });

      stream.on('error', (error) => {
        this.logger.error(`Error en stream de subida: ${error.message}`);
        reject(new BadRequestException('Error al subir la imagen'));
      });

      stream.on('finish', () => {
        resolve();
      });

      stream.end(file.buffer);
    });
  }

  /**
   * Construye la URL pública del archivo
   */
  private buildPublicUrl(filePath: string): string {
    return `https://storage.googleapis.com/${this.config.bucketName}/${filePath}`;
  }

  /**
   * Sube múltiples imágenes
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos para subir');
    }

    if (files.length > this.config.maxFiles) {
      throw new BadRequestException(`Máximo ${this.config.maxFiles} archivos permitidos por vez`);
    }

    this.logger.log(`Subiendo ${files.length} archivos...`);

    const uploadPromises = files.map((file, index) => 
      this.uploadImage(file, options).catch(error => {
        this.logger.error(`Error subiendo archivo ${index + 1}: ${error.message}`);
        throw error;
      })
    );
    
    try {
      const results = await Promise.all(uploadPromises);
      this.logger.log(`${results.length} archivos subidos exitosamente`);
      return results;
    } catch (error) {
      this.logger.error('Error subiendo múltiples imágenes:', error);
      throw new BadRequestException('Error al subir una o más imágenes');
    }
  }

  /**
   * Elimina una imagen de Firebase Storage
   */
  async deleteImage(filePath: string): Promise<void> {
    try {
      const bucket = await this.getBucket();
      const file = bucket.file(filePath);

      const [exists] = await file.exists();
      if (!exists) {
        this.logger.warn(`Archivo no encontrado para eliminar: ${filePath}`);
        return;
      }

      await file.delete();
      this.logger.log(`Imagen eliminada: ${filePath}`);

    } catch (error) {
      this.logger.error(`Error eliminando imagen ${filePath}: ${error.message}`);
      // No lanzar error para evitar fallos en cascada
    }
  }

  /**
   * Elimina múltiples imágenes
   */
  async deleteMultipleImages(filePaths: string[]): Promise<void> {
    if (!filePaths || filePaths.length === 0) {
      return;
    }

    this.logger.log(`Eliminando ${filePaths.length} archivos...`);

    const deletePromises = filePaths.map(path => this.deleteImage(path));
    const results = await Promise.allSettled(deletePromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    this.logger.log(`Eliminación completada: ${successful} exitosos, ${failed} fallidos`);
  }

  /**
   * Obtiene información de una imagen
   */
  async getImageInfo(filePath: string): Promise<any> {
    try {
      const bucket = await this.getBucket();
      const file = bucket.file(filePath);

      const [metadata] = await file.getMetadata();
      return {
        name: metadata.name,
        size: metadata.size ? parseInt(metadata.size.toString()) : 0,
        contentType: metadata.contentType,
        created: metadata.timeCreated,
        updated: metadata.updated,
        publicUrl: this.buildPublicUrl(filePath),
      };

    } catch (error) {
      this.logger.error(`Error obteniendo info de imagen ${filePath}: ${error.message}`);
      throw new BadRequestException('Error al obtener información de la imagen');
    }
  }

  /**
   * Valida que el archivo sea una imagen válida
   */
  private validateImage(file: Express.Multer.File, config: any): void {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!config.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Tipos aceptados: ${config.allowedTypes.join(', ')}`
      );
    }

    const maxSizeInBytes = config.maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new BadRequestException(
        `El archivo es demasiado grande. Tamaño máximo: ${config.maxSizeInMB}MB`
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('El archivo está vacío');
    }

    // Validación de firma de archivo
    this.validateFileSignature(file);
  }

  /**
   * Valida la firma del archivo para asegurar que sea una imagen real
   */
  private validateFileSignature(file: Express.Multer.File): void {
    const imageSignatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/webp': [0x52, 0x49, 0x46, 0x46], // "RIFF"
    };

    const signature = imageSignatures[file.mimetype];
    if (!signature) return;

    const fileHeader = Array.from(file.buffer.slice(0, signature.length));
    const isValidSignature = signature.every((byte, index) => fileHeader[index] === byte);
    
    if (!isValidSignature) {
      throw new BadRequestException('El archivo no es una imagen válida');
    }
  }

  /**
   * Genera un nombre único para el archivo basado en el nombre original
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const uuid = randomUUID().split('-')[0];
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    
    const cleanName = this.cleanFileName(originalName.replace(/\.[^/.]+$/, ''));
    
    return `${cleanName}-${timestamp}-${uuid}.${extension}`;
  }

  /**
   * Limpia el nombre del archivo para usar en la URL
   */
  private cleanFileName(fileName: string): string {
    return fileName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Obtiene la URL pública de una imagen (método público para uso externo)
   */
  getPublicUrl(filePath: string): string {
    return this.buildPublicUrl(filePath);
  }

  /**
   * Verifica si Firebase Storage está configurado correctamente
   */
  async healthCheck(): Promise<{ status: string; message: string; details?: any }> {
    try {
      const bucket = await this.getBucket();
      await bucket.getMetadata();
      
      return {
        status: 'ok',
        message: 'Firebase Storage configurado correctamente',
        details: {
          bucketName: this.config.bucketName,
          maxSizeMB: this.config.maxSizeMB,
          maxFiles: this.config.maxFiles,
          allowedTypes: this.config.allowedTypes
        }
      };
    } catch (error) {
      this.logger.error('Health check falló:', error);
      return {
        status: 'error',
        message: `Firebase Storage error: ${error.message || 'Error desconocido'}`,
        details: {
          bucketName: this.config?.bucketName || 'No configurado',
          error: error.message
        }
      };
    }
  }

  /**
   * Obtiene la configuración actual del servicio
   */
  getConfig(): FirebaseStorageConfig {
    return { ...this.config };
  }
} 