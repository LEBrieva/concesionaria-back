/**
 * 🧪 SETUP AUTOMÁTICO PARA TESTS E2E
 * 
 * Este archivo se ejecuta ANTES de todos los tests e2e
 * Configura automáticamente la base de datos exclusiva para tests
 */

import { setupTestDatabase, verifyTestDatabase, TEST_DATABASE_URL } from './test-database.config';
import { execSync } from 'child_process';

// 🚨 CONFIGURACIÓN CRÍTICA: BD exclusiva para tests
console.log('\n🔧 Configurando entorno de test...');

// 1. FORZAR CONFIGURACIÓN DE TEST (sin importar environment)
process.env.NODE_ENV = 'test';
process.env.USE_FIREBASE_MOCK = 'true';
process.env.FIREBASE_PROJECT_ID = 'test-project-mock';
process.env.FIREBASE_STORAGE_BUCKET = 'test-bucket.appspot.com';
console.log('🧪 Mock Firebase FORZADO para tests');

// 2. Configurar BD de test
setupTestDatabase();

// 3. Verificar seguridad
verifyTestDatabase();

// 4. Ejecutar migraciones en BD de test
console.log('🗄️ Ejecutando migraciones en BD de test...');
try {
  // Primero generar el cliente Prisma
  console.log('📦 Generando cliente Prisma...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }
  });
  
  // Luego ejecutar migraciones
  console.log('🗄️ Aplicando migraciones...');
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }
  });
  console.log('✅ Migraciones ejecutadas correctamente');
} catch (error) {
  console.error('❌ Error ejecutando migraciones:', error.message);
  console.error('Stack:', error.stack);
  
  // En CI/CD, fallar si no se pueden ejecutar migraciones
  if (process.env.CI) {
    throw new Error('Migraciones fallaron en CI/CD');
  }
}

console.log('✅ Entorno de test configurado correctamente\n');

/**
 * 📋 REGLAS PARA TODOS LOS TESTS E2E:
 * 
 * ✅ SIEMPRE usar BD exclusiva para tests
 * ✅ NUNCA usar BD de desarrollo en tests
 * ✅ Limpiar datos antes y después de cada suite
 * ✅ Usar timestamps únicos para evitar conflictos
 * ✅ Verificar que la BD sea de test antes de ejecutar
 */ 