# 🧪 GUÍA DE TESTS E2E - CONCESIONARIA

## 🚨 REGLAS CRÍTICAS (OBLIGATORIAS)

### 1. **BASE DE DATOS EXCLUSIVA PARA TESTS**
- ✅ **SIEMPRE** usar BD exclusiva para tests
- ❌ **NUNCA** usar BD de desarrollo en tests
- 🔒 **VERIFICAR** BD de test antes de ejecutar

### 2. **CONFIGURACIÓN AUTOMÁTICA**
- La BD de test se configura automáticamente
- No modificar `DATABASE_URL` manualmente en tests
- Usar `verifyTestDatabase()` en cada test

### 3. **LIMPIEZA DE DATOS**
- Limpiar BD antes y después de cada suite
- Usar timestamps únicos para evitar conflictos
- Solo usar `deleteMany()` en BD de test

## 📋 PLANTILLA PARA NUEVOS TESTS E2E

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/shared/prisma.service';
import { verifyTestDatabase } from '../test-database.config';

describe('NuevoModulo E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string; // Si necesita autenticación

  beforeAll(async () => {
    // 🔒 VERIFICACIÓN DE SEGURIDAD: Asegurar que usamos BD de test
    verifyTestDatabase();
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    // Configurar pipes y filtros si es necesario
    await app.init();

    // 🧹 LIMPIAR BD DE TEST (seguro porque es BD exclusiva)
    await prisma.entidad.deleteMany(); // Cambiar por la entidad correspondiente
    await prisma.usuario.deleteMany();

    // 👤 Crear usuarios de prueba si es necesario
    await createTestUsers();
  });

  afterAll(async () => {
    // 🧹 LIMPIAR BD DE TEST después de los tests
    await prisma.entidad.deleteMany();
    await prisma.usuario.deleteMany();
    await app.close();
  });

  async function createTestUsers() {
    // Solo si el test necesita autenticación
    // Implementar creación de usuarios de prueba
  }

  describe('Funcionalidad Principal', () => {
    it('debe funcionar correctamente', async () => {
      // Usar timestamps únicos para datos únicos
      const uniqueData = {
        campo: `valor_${Date.now()}`,
        email: `test_${Date.now()}@test.com`,
      };

      const response = await request(app.getHttpServer())
        .post('/endpoint')
        .set('Authorization', `Bearer ${adminToken}`) // Si necesita auth
        .send(uniqueData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.campo).toBe(uniqueData.campo);
    });
  });
});
```

## 🔧 CONFIGURACIÓN DE BD DE TEST

### Archivo: `test/test-database.config.ts`
```typescript
// 🚨 HARDCODEADO: URL de BD exclusiva para tests (Neon)
export const TEST_DATABASE_URL = "postgresql://concesionariadb_owner:npg_q0uhkIiDcZ9V@ep-black-mountain-ac9fgd6h-pooler.sa-east-1.aws.neon.tech/concesionariadb?sslmode=require";
```

**✅ CONFIGURADO:** BD de test usando Neon PostgreSQL
- **Endpoint:** `ep-black-mountain-ac9fgd6h-pooler.sa-east-1.aws.neon.tech`
- **Base de datos:** `concesionariadb` (exclusiva para tests)
- **SSL:** Requerido (`sslmode=require`)

## 🛡️ VERIFICACIONES DE SEGURIDAD

### Automáticas:
- ✅ Setup automático de BD de test
- ✅ Verificación de seguridad antes de cada test
- ✅ Error si no se usa BD de test

### Manuales:
- 🔍 Verificar que la BD de test existe
- 🔍 Confirmar que no se conecta a BD de desarrollo
- 🔍 Revisar logs de configuración

## 📊 EJECUCIÓN DE TESTS

```bash
# Ejecutar todos los tests e2e
npm run test:e2e

# Ejecutar test específico
npm run test:e2e -- --testNamePattern="nombre del test"

# Ver logs de configuración
npm run test:e2e | grep "🧪"
```

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "No se está usando BD de test"
```
🚨 ERROR DE SEGURIDAD: No se está usando BD de test
```
**Solución:** Verificar `TEST_DATABASE_URL` en `test/test-database.config.ts`

### Error: "Connection refused"
```
Error: connect ECONNREFUSED
```
**Solución:** 
1. Verificar conexión a Neon: `ep-black-mountain-ac9fgd6h-pooler.sa-east-1.aws.neon.tech`
2. Confirmar credenciales en `TEST_DATABASE_URL`
3. Verificar que la BD `concesionariadb` existe en Neon
4. Asegurar que SSL está habilitado (`sslmode=require`)

### Tests lentos
**Solución:**
- Usar `maxWorkers: 1` en `jest-e2e.json`
- Limpiar solo datos necesarios
- Usar transacciones para tests más rápidos

## 📝 CHECKLIST PARA NUEVOS TESTS

- [ ] Importar `verifyTestDatabase` de `../test-database.config`
- [ ] Llamar `verifyTestDatabase()` en `beforeAll`
- [ ] Limpiar BD antes y después de tests
- [ ] Usar timestamps únicos para datos únicos
- [ ] Documentar qué funcionalidad testea
- [ ] Verificar que no afecte BD de desarrollo
- [ ] Probar que el test pasa y falla correctamente

## 🎯 MEJORES PRÁCTICAS

1. **Nombres descriptivos:** `debe crear usuario ADMIN correctamente`
2. **Datos únicos:** `email: \`test_${Date.now()}@test.com\``
3. **Verificaciones completas:** Status code + body + propiedades
4. **Limpieza:** Antes y después de cada suite
5. **Seguridad:** Siempre verificar BD de test
6. **Documentación:** Comentar funcionalidad compleja

---

**🔒 RECUERDA:** La seguridad de los datos de desarrollo depende de seguir estas reglas. 