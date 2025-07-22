import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { 
  ImageUploadResult, 
  ImageUploadOptions,
  FirebaseStorageConfig,
  ImageInfo,
  ValidationConfig,
  HealthCheckSuccess
} from '../interfaces/firebase';

/**
 * 🧪 MOCK SERVICE - Firebase Storage para Tests
 * 
 * Este servicio simula todas las operaciones de Firebase Storage
 * sin requerir credenciales reales. Útil para:
 * - Tests E2E en CI/CD
 * - Desarrollo local sin Firebase
 * - Pruebas unitarias
 */
@Injectable()
export class FirebaseStorageMockService {
  private readonly logger = new Logger(FirebaseStorageMockService.name);
  private config: FirebaseStorageConfig;
  private mockStorage: Map<string, any> = new Map();

  constructor() {
    this.initializeConfig();
    this.logger.warn('🧪 USANDO FIREBASE STORAGE MOCK - Solo para tests/desarrollo');
    this.logger.warn(`🧪 Mock configurado con NODE_ENV=${process.env.NODE_ENV}, USE_FIREBASE_MOCK=${process.env.USE_FIREBASE_MOCK}`);
  }

  /**
   * Inicializa la configuración del servicio mock
   */
  private initializeConfig(): void {
    this.config = {
      bucketName: 'mock-bucket.appspot.com',
      maxSizeMB: parseInt(process.env.MAX_IMAGE_SIZE_MB || '5'),
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxFiles: parseInt(process.env.MAX_FILES || '10'),
    };

    this.logger.log(`Firebase Storage Mock configurado con bucket: ${this.config.bucketName}`);
  }

  /**
   * Simula la subida de una imagen
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

      // Validaciones (mismas que el servicio real)
      this.validateImage(file, uploadConfig);

      // Generar nombre único para el archivo
      const fileName = this.generateFileName(file.originalname);
      const filePath = `${uploadConfig.folder}/${fileName}`;

      // Simular almacenamiento
      this.mockStorage.set(filePath, {
        fileName,
        filePath,
        size: file.size,
        contentType: file.mimetype,
        uploadedAt: new Date().toISOString(),
        originalName: file.originalname,
      });

      // Construir URL pública simulada
      const publicUrl = this.buildMockPublicUrl(filePath);

      const result: ImageUploadResult = {
        url: publicUrl,
        path: filePath,
        fileName: fileName,
        size: file.size,
      };

      this.logger.log(`🧪 Mock: Imagen "subida" exitosamente: ${fileName} (${file.size} bytes)`);
      return result;

    } catch (error) {
      this.logger.error(`🧪 Mock: Error simulando subida de imagen: ${error.message}`);
      throw error;
    }
  }

  /**
   * Simula la subida de múltiples imágenes
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

    this.logger.log(`🧪 Mock: Subiendo ${files.length} archivos...`);

    const uploadPromises = files.map((file, index) => 
      this.uploadImage(file, options).catch(error => {
        this.logger.error(`🧪 Mock: Error subiendo archivo ${index + 1}: ${error.message}`);
        throw error;
      })
    );
    
    try {
      const results = await Promise.all(uploadPromises);
      this.logger.log(`🧪 Mock: ${results.length} archivos "subidos" exitosamente`);
      return results;
    } catch (error) {
      this.logger.error('🧪 Mock: Error subiendo múltiples imágenes:', error);
      throw new BadRequestException('Error al subir una o más imágenes');
    }
  }

  /**
   * Simula la eliminación de una imagen
   */
  async deleteImage(filePath: string): Promise<void> {
    try {
      const exists = this.mockStorage.has(filePath);
      if (!exists) {
        this.logger.warn(`🧪 Mock: Archivo no encontrado para eliminar: ${filePath}`);
        return;
      }

      this.mockStorage.delete(filePath);
      this.logger.log(`🧪 Mock: Imagen "eliminada": ${filePath}`);

    } catch (error) {
      this.logger.error(`🧪 Mock: Error eliminando imagen ${filePath}: ${error.message}`);
      // No lanzar error para evitar fallos en cascada
    }
  }

  /**
   * Simula obtener información de una imagen
   */
  async getImageInfo(filePath: string): Promise<ImageInfo> {
    try {
      const mockData = this.mockStorage.get(filePath);
      if (!mockData) {
        throw new BadRequestException('Imagen no encontrada');
      }

      return {
        name: mockData.fileName,
        size: mockData.size,
        contentType: mockData.contentType,
        created: mockData.uploadedAt,
        updated: mockData.uploadedAt,
        publicUrl: this.buildMockPublicUrl(filePath),
      };

    } catch (error) {
      this.logger.error(`🧪 Mock: Error obteniendo info de imagen ${filePath}: ${error.message}`);
      throw new BadRequestException('Error al obtener información de la imagen');
    }
  }

  /**
   * Valida que el archivo sea una imagen válida (misma lógica que el servicio real)
   */
  private validateImage(file: Express.Multer.File, config: ValidationConfig): void {
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
   * Valida la firma del archivo (versión más permisiva para tests)
   */
  private validateFileSignature(file: Express.Multer.File): void {
    // En modo mock, ser más permisivo con la validación
    if (process.env.NODE_ENV === 'test' || process.env.USE_FIREBASE_MOCK === 'true') {
      this.logger.debug(`🧪 Mock: Validación permisiva para ${file.mimetype} (${file.buffer.length} bytes)`);
      
      // Solo validar que el buffer no esté vacío y tenga un mimetype válido
      if (!file.buffer || file.buffer.length === 0) {
        throw new BadRequestException('El archivo no es una imagen válida');
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException('El archivo no es una imagen válida');
      }
      
      return; // Skip signature validation in mock mode
    }

    // Validación estricta solo en producción
    const imageSignatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/webp': [0x52, 0x49, 0x46, 0x46], // "RIFF"
    };

    const signature = imageSignatures[file.mimetype];
    if (!signature) return;

    // Verificar que el buffer tenga al menos el tamaño de la firma
    if (file.buffer.length < signature.length) {
      throw new BadRequestException('El archivo no es una imagen válida');
    }

    const fileHeader = Array.from(file.buffer.slice(0, signature.length));
    const isValidSignature = signature.every((byte, index) => fileHeader[index] === byte);
    
    if (!isValidSignature) {
      this.logger.warn(`🧪 Mock: Firma inválida para ${file.mimetype}. Esperado: [${signature.join(', ')}], Recibido: [${fileHeader.join(', ')}]`);
      throw new BadRequestException('El archivo no es una imagen válida');
    }
  }

  /**
   * Genera un nombre único para el archivo (misma lógica que el servicio real)
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const uuid = randomUUID().split('-')[0];
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    
    const cleanName = this.cleanFileName(originalName.replace(/\.[^/.]+$/, ''));
    
    return `${cleanName}-${timestamp}-${uuid}.${extension}`;
  }

  /**
   * Limpia el nombre del archivo (misma lógica que el servicio real)
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
   * Construye la URL pública simulada
   */
  private buildMockPublicUrl(filePath: string): string {
    return `https://storage.googleapis.com/${this.config.bucketName}/${filePath}`;
  }

  /**
   * Obtiene la URL pública de una imagen (método público)
   */
  getPublicUrl(filePath: string): string {
    return this.buildMockPublicUrl(filePath);
  }

  /**
   * Health check simulado - siempre exitoso
   */
  async healthCheck(): Promise<HealthCheckSuccess> {
    return {
      status: 'ok',
      message: '🧪 Firebase Storage Mock configurado correctamente (archivos almacenados: ' + this.mockStorage.size + ')',
      details: {
        bucketName: this.config.bucketName,
        maxSizeMB: this.config.maxSizeMB,
        maxFiles: this.config.maxFiles,
        allowedTypes: this.config.allowedTypes
      }
    };
  }

  /**
   * Obtiene la configuración actual del servicio
   */
  getConfig(): FirebaseStorageConfig {
    return { ...this.config };
  }

  /**
   * Limpia el almacenamiento mock (útil para tests)
   */
  clearMockStorage(): void {
    this.mockStorage.clear();
    this.logger.log('🧪 Mock: Almacenamiento mock limpiado');
  }

  /**
   * Obtiene el estado del almacenamiento mock (útil para debugging)
   */
  getMockStorageState(): any {
    return Array.from(this.mockStorage.entries()).map(([path, data]) => ({
      path,
      ...data
    }));
  }
} 