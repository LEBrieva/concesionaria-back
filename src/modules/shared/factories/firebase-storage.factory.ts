/**
 * 🏭 FACTORY DE FIREBASE STORAGE
 * 
 * Automáticamente decide qué implementación usar:
 * 🧪 Tests: FirebaseStorageMock (evita costos)
 * 🚀 Producción: FirebaseStorageService (real)
 */

import { Injectable, Provider } from '@nestjs/common';
import { FirebaseStorageService } from '../services/firebase-storage.service';
import { FirebaseStorageMock } from '../../../../test/mocks/firebase-storage.mock';

/**
 * Determina si estamos en entorno de test
 */
function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.FIREBASE_STORAGE_MOCK === 'true' ||
    process.env.JEST_WORKER_ID !== undefined
  );
}

/**
 * Factory que crea el provider correcto según el entorno
 */
export const FirebaseStorageProvider: Provider = {
  provide: FirebaseStorageService,
  useFactory: (...deps: any[]) => {
    if (isTestEnvironment()) {
      console.log('🧪 Usando Firebase Storage Mock (evitando costos)');
      return new FirebaseStorageMock();
    } else {
      console.log('🚀 Usando Firebase Storage real');
      // Crear instancia real con dependencias
      return new FirebaseStorageService(deps[0]); // deps[0] es FirebaseService
    }
  },
  inject: [
    // Solo inyectar FirebaseService si no estamos en test
    ...(isTestEnvironment() ? [] : ['FirebaseService'])
  ],
};

/**
 * Provider alternativo para casos donde necesites inyectar explícitamente
 */
export const createFirebaseStorageProvider = (forceReal = false): Provider => ({
  provide: FirebaseStorageService,
  useFactory: (...deps: any[]) => {
    if (!forceReal && isTestEnvironment()) {
      return new FirebaseStorageMock();
    } else {
      return new FirebaseStorageService(deps[0]);
    }
  },
  inject: [
    ...((!forceReal && isTestEnvironment()) ? [] : ['FirebaseService'])
  ],
}); 