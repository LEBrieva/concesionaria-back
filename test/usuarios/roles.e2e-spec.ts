import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/shared/prisma.service';
import { verifyTestDatabase } from '../test-database.config';

describe('Usuarios con Roles E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let vendedorToken: string;
  let clienteToken: string;

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

    // 5. Login como VENDEDOR
    const vendedorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'vendedor@test.com',
        password: 'password123',
      });
    vendedorToken = vendedorLogin.body.access_token;

    // 6. Crear CLIENTE usando endpoint público
    await request(app.getHttpServer())
      .post('/usuarios')
      .send({
        nombre: 'Cliente',
        apellido: 'Test',
        email: 'cliente@test.com',
        password: 'password123',
      });

    // 7. Login como CLIENTE
    const clienteLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'cliente@test.com',
        password: 'password123',
      });
    clienteToken = clienteLogin.body.access_token;
  }

  describe('Creación de usuarios públicos', () => {
    it('debe permitir crear usuario CLIENTE sin autenticación', async () => {
      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .send({
          nombre: 'Nuevo',
          apellido: 'Cliente',
          email: `cliente.${Date.now()}@test.com`,
          password: 'password123',
        })
        .expect(201);

      expect(response.body.rol).toBe('CLIENTE');
      expect(response.body.nombre).toBe('Nuevo');
      expect(response.body.email).toContain('@test.com');
    });

    it('NO debe permitir especificar rol ADMIN en endpoint público', async () => {
      await request(app.getHttpServer())
        .post('/usuarios')
        .send({
          nombre: 'Fake',
          apellido: 'Admin',
          email: `fake.admin.${Date.now()}@test.com`,
          password: 'password123',
          rol: 'ADMIN', // Esto debería ser ignorado
        })
        .expect(403);
    });
  });

  describe('Creación de usuarios administrativos', () => {
    it('ADMIN debe poder crear usuario VENDEDOR', async () => {
      const response = await request(app.getHttpServer())
        .post('/usuarios/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Nuevo',
          apellido: 'Vendedor',
          email: `vendedor.${Date.now()}@test.com`,
          password: 'password123',
          rol: 'VENDEDOR',
        })
        .expect(201);

      expect(response.body.rol).toBe('VENDEDOR');
      expect(response.body.nombre).toBe('Nuevo');
    });

    it('ADMIN debe poder crear usuario ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/usuarios/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Nuevo',
          apellido: 'Admin',
          email: `admin.${Date.now()}@test.com`,
          password: 'password123',
          rol: 'ADMIN',
        })
        .expect(201);

      expect(response.body.rol).toBe('ADMIN');
      expect(response.body.nombre).toBe('Nuevo');
    });

    it('VENDEDOR debe poder crear solo usuario CLIENTE', async () => {
      const response = await request(app.getHttpServer())
        .post('/usuarios/admin')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          nombre: 'Cliente',
          apellido: 'Por Vendedor',
          email: `cliente.por.vendedor.${Date.now()}@test.com`,
          password: 'password123',
          rol: 'CLIENTE',
        })
        .expect(201);

      expect(response.body.rol).toBe('CLIENTE');
      expect(response.body.nombre).toBe('Cliente');
    });

    it('VENDEDOR NO debe poder crear usuario ADMIN', async () => {
      await request(app.getHttpServer())
        .post('/usuarios/admin')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          nombre: 'Fake',
          apellido: 'Admin',
          email: `fake.admin.vendedor.${Date.now()}@test.com`,
          password: 'password123',
          rol: 'ADMIN',
        })
        .expect(403);
    });

    it('CLIENTE NO debe poder acceder al endpoint administrativo', async () => {
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

    it('Usuario sin autenticación NO debe poder acceder al endpoint administrativo', async () => {
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

  describe('Autenticación y roles', () => {
    it('debe incluir rol en la respuesta de login', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.user.rol).toBe('ADMIN');
      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.nombre).toBe('Admin');
      expect(response.body.user.email).toBe('admin@test.com');
    });

    it('debe rechazar credenciales inválidas', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('debe rechazar usuario inexistente', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'noexiste@test.com',
          password: 'password123',
        })
        .expect(401);
    });
  });
}); 