import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/shared/prisma.service';
import { verifyTestDatabase } from '../test-database.config';

/**
 * 🎯 TESTS E2E OPTIMIZADOS - Solo Integración Crítica
 * 
 * Estos tests cubren lo que los unitarios NO pueden:
 * ✅ HTTP + JWT + Guards + BD real
 * ✅ Serialización completa DTO ↔ JSON ↔ HTTP
 * ✅ Sistema de permisos end-to-end
 * ✅ Flujos de autenticación completos
 * 
 * ❌ NO duplicamos lógica ya cubierta por 130 tests unitarios
 * ❌ NO testeamos validaciones simples de campos
 * ❌ NO testeamos lógica de negocio pura
 */
describe('Usuarios con Roles E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let vendedorToken: string;
  let clienteToken: string;

  // Helper para evitar rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  beforeAll(async () => {
    // 🔒 VERIFICACIÓN DE SEGURIDAD: Asegurar que usamos BD de test
    verifyTestDatabase();
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // 🧹 LIMPIAR BD DE TEST (seguro porque es BD exclusiva)
    await prisma.usuario.deleteMany();

    // 👥 Crear usuarios de prueba en BD de test
    await createTestUsers();
  });

  afterAll(async () => {
    // 🧹 LIMPIAR BD DE TEST después de los tests
    await prisma.usuario.deleteMany();
    await app.close();
  });

  async function createTestUsers() {
    // 1. Crear ADMIN inicial
    await request(app.getHttpServer())
      .post('/usuarios')
      .send({
        nombre: 'Admin',
        apellido: 'Test',
        email: 'admin@test.com',
        password: 'password123',
      });

    await delay(500); // Evitar rate limiting

    // 2. Actualizar manualmente a ADMIN en BD de test
    await prisma.usuario.update({
      where: { email: 'admin@test.com' },
      data: { rol: 'ADMIN' },
    });

    // 3. Login como ADMIN para obtener token
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });
    
    adminToken = adminLogin.body.access_token;
    await delay(500);

    // 4. Crear VENDEDOR usando el token de ADMIN
    await request(app.getHttpServer())
      .post('/usuarios/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Vendedor',
        apellido: 'Test',
        email: 'vendedor@test.com',
        password: 'password123',
        rol: 'VENDEDOR',
      });

    await delay(500);

    // 5. Login como VENDEDOR
    const vendedorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'vendedor@test.com',
        password: 'password123',
      });
    vendedorToken = vendedorLogin.body.access_token;
    await delay(500);

    // 6. Crear CLIENTE usando endpoint público
    await request(app.getHttpServer())
      .post('/usuarios')
      .send({
        nombre: 'Cliente',
        apellido: 'Test',
        email: 'cliente@test.com',
        password: 'password123',
      });

    await delay(500);

    // 7. Login como CLIENTE
    const clienteLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'cliente@test.com',
        password: 'password123',
      });
    clienteToken = clienteLogin.body.access_token;
  }

  describe('🔗 Integración HTTP + BD + Autenticación', () => {
    it('debe permitir crear usuario CLIENTE sin autenticación (flujo completo)', async () => {
      await delay(1000); // Evitar rate limiting
      
      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .send({
          nombre: 'Nuevo',
          apellido: 'Cliente',
          email: `cliente.${Date.now()}@test.com`,
          password: 'password123',
        })
        .expect(201);

      // Verificar que el flujo HTTP + validaciones + BD funciona
      expect(response.body.rol).toBe('CLIENTE');
      expect(response.body.nombre).toBe('Nuevo');
      expect(response.body.email).toContain('@test.com');
      expect(response.body.password).toBeUndefined(); // No debe exponer password
      expect(response.body.id).toBeDefined();
    });

    it('debe rechazar creación de ADMIN sin autenticación (seguridad end-to-end)', async () => {
      await delay(1000);
      
      await request(app.getHttpServer())
        .post('/usuarios')
        .send({
          nombre: 'Fake',
          apellido: 'Admin',
          email: `fake.admin.${Date.now()}@test.com`,
          password: 'password123',
          rol: 'ADMIN', // Intentar bypass de seguridad
        })
        .expect(403);
    });
  });

  describe('🔐 Sistema de Permisos End-to-End (JWT + Guards + BD)', () => {
    it('ADMIN debe crear cualquier rol con JWT válido (autorización completa)', async () => {
      await delay(1000);
      
      const response = await request(app.getHttpServer())
        .post('/usuarios/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Super',
          apellido: 'Admin',
          email: `super.admin.${Date.now()}@test.com`,
          password: 'password123',
          rol: 'ADMIN',
        })
        .expect(201);

      // Verificar que todo el stack de autorización funciona
      expect(response.body.rol).toBe('ADMIN');
      expect(response.body.id).toBeDefined(); // Usuario creado
      expect(response.body.password).toBeUndefined(); // Seguridad
    });

    it('VENDEDOR limitado a CLIENTE (guards + roles funcionando)', async () => {
      await delay(1000);
      
      const response = await request(app.getHttpServer())
        .post('/usuarios/admin')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          nombre: 'Cliente',
          apellido: 'Autorizado',
          email: `cliente.autorizado.${Date.now()}@test.com`,
          password: 'password123',
          rol: 'CLIENTE',
        })
        .expect(201);

      expect(response.body.rol).toBe('CLIENTE');
    });

    it('debe rechazar VENDEDOR intentando crear ADMIN (seguridad crítica)', async () => {
      await delay(1000);
      
      await request(app.getHttpServer())
        .post('/usuarios/admin')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          nombre: 'Fake',
          apellido: 'Admin',
          email: `fake.admin.vendedor.${Date.now()}@test.com`,
          password: 'password123',
          rol: 'ADMIN', // Intento de escalación de privilegios
        })
        .expect(403);
    });

    it('debe rechazar CLIENTE en endpoint admin (autorización estricta)', async () => {
      await delay(1000);
      
      await request(app.getHttpServer())
        .post('/usuarios/admin')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          nombre: 'Test',
          apellido: 'User',
          email: `test.cliente.${Date.now()}@test.com`,
          password: 'password123',
          rol: 'CLIENTE',
        })
        .expect(403);
    });

    it('debe rechazar acceso sin JWT (autenticación requerida)', async () => {
      await delay(1000);
      
      await request(app.getHttpServer())
        .post('/usuarios/admin')
        .send({
          nombre: 'Sin',
          apellido: 'Auth',
          email: `sin.auth.${Date.now()}@test.com`,
          password: 'password123',
          rol: 'CLIENTE',
        })
        .expect(401);
    });
  });

  describe('🔑 Autenticación JWT End-to-End', () => {
    it('debe generar JWT válido con roles (login completo)', async () => {
      await delay(1000);
      
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        })
        .expect(200);

      // Verificar que el flujo completo de autenticación funciona
      expect(response.body.user.rol).toBe('ADMIN');
      expect(response.body.access_token).toBeDefined();
      expect(response.body.access_token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/); // JWT format
      expect(response.body.user.nombre).toBe('Admin');
      expect(response.body.user.email).toBe('admin@test.com');
      expect(response.body.user.password).toBeUndefined(); // Seguridad
    });

    it('debe rechazar credenciales inválidas (seguridad)', async () => {
      await delay(1000);
      
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
}); 