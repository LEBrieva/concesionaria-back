/**
 * CONFIGURACIÓN DE BASE DE DATOS EXCLUSIVA PARA TESTS E2E
 * 
 * ⚠️  IMPORTANTE: Esta BD es SOLO para tests, nunca usar la de desarrollo
 * 🗄️  Usa BD Neon exclusiva para tests tanto en local como en CI
 * 🔧  Misma configuración en todos los entornos para consistencia
 */

// 🚨 HARDCODEADO: URL de BD exclusiva para tests (Neon)
export const TEST_DATABASE_URL = "postgresql://concesionariadb_owner:npg_q0uhkIiDcZ9V@ep-patient-lake-acbkiclt-pooler.sa-east-1.aws.neon.tech/concesionariadb?sslmode=require&channel_binding=require";

// ⚠️ IMPORTANTE: Esta es la BD de TEST - NO la de desarrollo
// 🔒 Verificar que sea diferente a la BD de desarrollo

/**
 * Configuración de Prisma para tests
 * Sobrescribe la variable de entorno para usar la BD de test
 */
export function setupTestDatabase() {
  // Forzar uso de BD de test Neon
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  
  console.log('🧪 Usando BD de test:', TEST_DATABASE_URL);
  console.log('✅ BD de desarrollo protegida');
}

/**
 * Verificación de seguridad
 * Asegura que no estemos usando la BD de desarrollo
 */
export function verifyTestDatabase() {
  const currentUrl = process.env.DATABASE_URL;
  
  // Verificar que estamos usando la URL de test específica
  if (currentUrl !== TEST_DATABASE_URL) {
    throw new Error(`
      🚨 ERROR DE SEGURIDAD: No se está usando BD de test
      
      URL actual: ${currentUrl}
      URL esperada: ${TEST_DATABASE_URL}
      
      ❌ RIESGO: Los tests podrían borrar datos de desarrollo
      ✅ SOLUCIÓN: La BD de test debe ser exactamente la configurada
    `);
  }
  
  // Verificar que es la BD de test Neon correcta
  if (!currentUrl.includes('ep-patient-lake-acbkiclt')) {
    throw new Error(`
      🚨 ERROR: BD de test no reconocida
      
      ❌ La URL no corresponde a la BD de test Neon configurada
      ✅ Verificar configuración en test-database.config.ts
    `);
  }
  
  console.log('🔒 Verificación de seguridad: BD de test Neon confirmada');
  console.log('✅ Endpoint: ep-patient-lake-acbkiclt-pooler.sa-east-1.aws.neon.tech');
} 