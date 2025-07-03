/**
 * 🧪 MOCK DE FIREBASE STORAGE PARA TESTS
 * 
 * Este mock reemplaza FirebaseStorageService en tests para:
 * ✅ Evitar costos reales de Firebase Storage
 * ✅ Acelerar la ejecución de tests
 * ✅ Evitar dependencias externas
 * ✅ Mantener la funcionalidad de tests intacta
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { ImageUploadResult, ImageUploadOptions, ImageInfo } from '../../src/modules/shared/interfaces/firebase';

@Injectable()
export class FirebaseStorageMock {
  private mockStorage: Map<string, any> = new Map();

  /**
   * Mock de subida de imagen individual
   */
  async uploadImage(
    file: Express.Multer.File,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    // Simular validaciones básicas
    if (!file || !file.buffer) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('El archivo es demasiado grande. Tamaño máximo: 10MB');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido. Tipos aceptados: JPEG, PNG, WebP');
    }

    // Validar firma de archivo (como el servicio real)
    this.validateFileSignature(file);

    // Generar datos mock
    const fileName = this.generateMockFileName(file.originalname);
    const folder = options.folder || 'images';
    const filePath = `${folder}/${fileName}`;
    const mockUrl = `https://storage.googleapis.com/mock-bucket/${filePath}`;

    // Simular almacenamiento
    this.mockStorage.set(filePath, {
      file,
      uploadedAt: new Date(),
      url: mockUrl,
    });

    return {
      url: mockUrl,
      path: filePath,
      fileName: fileName,
      size: file.size,
    };
  }

  /**
   * Mock de subida de múltiples imágenes
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos para subir');
    }

    if (files.length > 10) {
      throw new BadRequestException('Máximo 10 archivos permitidos por vez');
    }

    // Procesar cada archivo
    const uploadPromises = files.map(file => this.uploadImage(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Mock de eliminación de imagen
   */
  async deleteImage(filePath: string): Promise<void> {
    if (this.mockStorage.has(filePath)) {
      this.mockStorage.delete(filePath);
    }
    // Simular éxito silencioso como el servicio real
  }

  /**
   * Mock de eliminación de múltiples imágenes
   */
  async deleteMultipleImages(filePaths: string[]): Promise<void> {
    filePaths.forEach(path => {
      if (this.mockStorage.has(path)) {
        this.mockStorage.delete(path);
      }
    });
  }

  /**
   * Mock de obtener información de imagen
   */
  async getImageInfo(filePath: string): Promise<ImageInfo> {
    const stored = this.mockStorage.get(filePath);
    if (!stored) {
      throw new BadRequestException('Imagen no encontrada');
    }

    return {
      name: stored.file.originalname,
      size: stored.file.size,
      contentType: stored.file.mimetype,
      created: stored.uploadedAt.toISOString(),
      updated: stored.uploadedAt.toISOString(),
      publicUrl: stored.url,
    };
  }

  /**
   * Mock de obtener URL pública
   */
  getPublicUrl(filePath: string): string {
    return `https://storage.googleapis.com/mock-bucket/${filePath}`;
  }

  /**
   * Mock de health check
   */
  async healthCheck(): Promise<any> {
    return {
      status: 'ok',
      message: 'Firebase Storage Mock configurado correctamente',
      details: {
        bucketName: 'mock-bucket',
        maxSizeMB: 10,
        maxFiles: 10,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        isTestEnvironment: true,
      }
    };
  }

  /**
   * Generar nombre de archivo mock
   */
  private generateMockFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
    
    return `${cleanName}-${timestamp}-${randomId}.${extension}`;
  }

  /**
   * Utilidades para tests
   */
  
  /**
   * Limpiar storage mock (útil para tests)
   */
  clearMockStorage(): void {
    this.mockStorage.clear();
  }

  /**
   * Obtener archivos almacenados (útil para verificaciones en tests)
   */
  getMockStorageContents(): Map<string, any> {
    return new Map(this.mockStorage);
  }

  /**
   * Verificar si un archivo existe en el mock
   */
  mockFileExists(filePath: string): boolean {
    return this.mockStorage.has(filePath);
  }

  /**
   * Obtener cantidad de archivos en el mock
   */
  getMockFileCount(): number {
    return this.mockStorage.size;
  }

  /**
   * Simular error de Firebase (útil para tests de error)
   */
  simulateFirebaseError(errorMessage: string = 'Mock Firebase Storage error'): void {
    // Esto se puede usar en tests específicos para simular errores
    throw new Error(errorMessage);
  }

  /**
   * Validar firma de archivo (como el servicio real)
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
} 