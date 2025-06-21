import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/shared/prisma.service';

describe('Roles E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let vendedorToken: string;
  let clienteToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Limpiar base de datos
    await prisma.usuario.deleteMany();

    // Crear usuarios de prueba
    await createTestUsers();
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany();
    await app.close();
  });

  async function createTestUsers() {
    // Crear ADMIN
    const adminResponse = await request(app.getHttpServer())
      .post('/usuarios')
      .send({
        nombre: 'Admin',
        apellido: 'Test',
        email: 'admin@test.com',
        password: 'password123',
        rol: 'CLIENTE', // Se creará como CLIENTE inicialmente
      });

    // Actualizar manualmente a ADMIN en la base de datos
    await prisma.usuario.update({
      where: { email: 'admin@test.com' },
      data: { rol: 'ADMIN' },
    });

    // Login como ADMIN
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });
    adminToken = adminLogin.body.access_token;

    // Crear VENDEDOR usando el token de ADMIN
    const vendedorResponse = await request(app.getHttpServer())
      .post('/usuarios/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Vendedor',
        apellido: 'Test',
        email: 'vendedor@test.com',
        password: 'password123',
        rol: 'VENDEDOR',
      });

    // Login como VENDEDOR
    const vendedorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'vendedor@test.com',
        password: 'password123',
      });
    vendedorToken = vendedorLogin.body.access_token;

    // Crear CLIENTE usando endpoint público
    await request(app.getHttpServer())
      .post('/usuarios')
      .send({
        nombre: 'Cliente',
        apellido: 'Test',
        email: 'cliente@test.com',
        password: 'password123',
      });

    // Login como CLIENTE
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
          email: 'nuevo.cliente@test.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.rol).toBe('CLIENTE');
    });

    it('debe rechazar crear usuario ADMIN sin autenticación', async () => {
      await request(app.getHttpServer())
        .post('/usuarios')
        .send({
          nombre: 'Fake',
          apellido: 'Admin',
          email: 'fake.admin@test.com',
          password: 'password123',
          rol: 'ADMIN',
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
          email: 'nuevo.vendedor@test.com',
          password: 'password123',
          rol: 'VENDEDOR',
        })
        .expect(201);

      expect(response.body.rol).toBe('VENDEDOR');
    });

    it('ADMIN debe poder crear usuario ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/usuarios/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Nuevo',
          apellido: 'Admin',
          email: 'nuevo.admin@test.com',
          password: 'password123',
          rol: 'ADMIN',
        })
        .expect(201);

      expect(response.body.rol).toBe('ADMIN');
    });

    it('VENDEDOR debe poder crear solo usuario CLIENTE', async () => {
      const response = await request(app.getHttpServer())
        .post('/usuarios/admin')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          nombre: 'Cliente',
          apellido: 'Por Vendedor',
          email: 'cliente.vendedor@test.com',
          password: 'password123',
          rol: 'CLIENTE',
        })
        .expect(201);

      expect(response.body.rol).toBe('CLIENTE');
    });

    it('VENDEDOR NO debe poder crear usuario ADMIN', async () => {
      await request(app.getHttpServer())
        .post('/usuarios/admin')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          nombre: 'Fake',
          apellido: 'Admin',
          email: 'fake.admin2@test.com',
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
          email: 'test.user@test.com',
          password: 'password123',
          rol: 'CLIENTE',
        })
        .expect(403);
    });
  });

  describe('Autenticación con roles', () => {
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
    });
  });
}); 