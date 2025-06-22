/**
 * 🧪 SETUP AUTOMÁTICO PARA TESTS E2E
 * 
 * Este archivo se ejecuta ANTES de todos los tests e2e
 * Configura automáticamente la base de datos exclusiva para tests
 */

import { setupTestDatabase, verifyTestDatabase } from './test-database.config';

// 🚨 CONFIGURACIÓN CRÍTICA: BD exclusiva para tests
console.log('\n🔧 Configurando entorno de test...');

// 1. Configurar BD de test
setupTestDatabase();

// 2. Verificar seguridad
verifyTestDatabase();

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