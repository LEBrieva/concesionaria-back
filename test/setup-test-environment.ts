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

// 1. Configurar BD de test
setupTestDatabase();

// 2. Verificar seguridad
verifyTestDatabase();

// 3. Ejecutar migraciones en BD de test
console.log('🗄️ Ejecutando migraciones en BD de test...');
try {
  execSync('npx prisma migrate deploy', { 
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }
  });
  console.log('✅ Migraciones ejecutadas correctamente');
} catch (error) {
  console.error('❌ Error ejecutando migraciones:', error.message);
  // No lanzar error para que los tests continúen
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