import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/shared/prisma.service';
import { AllExceptionsFilter } from '../../src/modules/shared/filters/all-exceptions.filter';

describe('Google Auth (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Configurar PrismaService para usar la base de datos de test
    const testDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/concesionaria_test';
    prismaService['_url'] = testDatabaseUrl;

    // Configurar pipes y filtros como en main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
  });

  beforeEach(async () => {
    // Limpiar la base de datos antes de cada test
    await prismaService.usuario.deleteMany({});
  });

  afterAll(async () => {
    // Limpiar la base de datos después de todos los tests
    await prismaService.usuario.deleteMany({});
    await app.close();
  });

  describe('/auth/google (POST)', () => {
    it('debería crear un nuevo cliente con Google Auth (modo desarrollo)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({
          firebaseToken: 'token-simulado-desarrollo'
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'cliente.dev@gmail.com');
      expect(response.body.user).toHaveProperty('rol', 'CLIENTE');
      expect(response.body.user).toHaveProperty('nombre', 'Cliente');

      // Verificar que se creó en la base de datos
      const usuario = await prismaService.usuario.findUnique({
        where: { email: 'cliente.dev@gmail.com' }
      });

      expect(usuario).toBeDefined();
      expect(usuario?.rol).toBe('CLIENTE');
      expect(usuario?.active).toBe(true);
    });

    it('debería autenticar un cliente existente', async () => {
      // Crear un cliente previamente
      await prismaService.usuario.create({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          nombre: 'Cliente',
          apellido: 'Desarrollo',
          email: 'cliente.dev@gmail.com',
          password: 'password-no-usado',
          rol: 'CLIENTE',
          createdBy: 'test',
          updatedBy: 'test',
        }
      });

      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({
          firebaseToken: 'token-simulado-desarrollo'
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toHaveProperty('email', 'cliente.dev@gmail.com');
      expect(response.body.user).toHaveProperty('rol', 'CLIENTE');

      // Verificar que no se creó un usuario duplicado
      const usuarios = await prismaService.usuario.findMany({
        where: { email: 'cliente.dev@gmail.com' }
      });

      expect(usuarios).toHaveLength(1);
    });

    it('debería rechazar un empleado que intente usar Google Auth', async () => {
      // Crear un empleado previamente
      await prismaService.usuario.create({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          nombre: 'Admin',
          apellido: 'Sistema',
          email: 'cliente.dev@gmail.com', // Mismo email pero rol diferente
          password: 'password123',
          rol: 'ADMIN',
          createdBy: 'test',
          updatedBy: 'test',
        }
      });

      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({
          firebaseToken: 'token-simulado-desarrollo'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      // El mensaje puede ser un string o un array, verificamos ambos casos
      const message = Array.isArray(response.body.message) ? response.body.message[0] : response.body.message;
      expect(message).toContain('empleado');
    });

    it('debería rechazar un token vacío', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({
          firebaseToken: ''
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
      expect(response.body.message).toContain('El token de Firebase es requerido');
    });

    it('debería rechazar una petición sin token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
      expect(response.body.message).toContain('El token de Firebase es requerido');
    });

    it('debería rechazar un usuario inactivo', async () => {
      // Crear un cliente inactivo con email diferente
      await prismaService.usuario.create({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174002',
          nombre: 'Cliente',
          apellido: 'Inactivo',
          email: 'cliente.inactivo@gmail.com',
          password: 'password-no-usado',
          rol: 'CLIENTE',
          active: false, // Usuario inactivo
          createdBy: 'test',
          updatedBy: 'test',
        }
      });

      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({
          firebaseToken: 'token-inactivo-desarrollo'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      // El mensaje puede ser un string o un array, verificamos ambos casos
      const message = Array.isArray(response.body.message) ? response.body.message[0] : response.body.message;
      expect(message).toContain('desactivada');
    });
  });

  describe('Integración con login tradicional', () => {
    it('debería mantener el login tradicional funcionando para empleados', async () => {
      // Crear un admin
      await prismaService.usuario.create({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          nombre: 'Admin',
          apellido: 'Sistema',
          email: 'admin@empresa.com',
          password: '$2b$12$HB3xzZNOLfUI68apsf0KVuDceFJ2PlgslmXn6.Kvbg8xswdeYCrVC', // "password123"
          rol: 'ADMIN',
          createdBy: 'test',
          updatedBy: 'test',
        }
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toHaveProperty('rol', 'ADMIN');
    });
  });
}); 