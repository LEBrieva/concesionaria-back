import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { validCar, invalidCars } from './test-data/autos.data';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/modules/shared/filters/all-exceptions.filter';
import { PrismaService } from '../../src/modules/shared/prisma.service';
import { verifyTestDatabase } from '../test-database.config';

describe('AutosController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    // 🔒 VERIFICACIÓN DE SEGURIDAD: Asegurar que usamos BD de test
    verifyTestDatabase();
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    // 🧹 LIMPIAR BD DE TEST (seguro porque es BD exclusiva)
    await prisma.auto.deleteMany();
    await prisma.usuario.deleteMany();

    // 👤 Crear usuario ADMIN de prueba
    await createTestUser();
  });

  afterAll(async () => {
    // 🧹 LIMPIAR BD DE TEST después de los tests
    await prisma.auto.deleteMany();
    await prisma.usuario.deleteMany();
    await app.close();
  });

  async function createTestUser() {
    // 1. Crear usuario base
    await request(app.getHttpServer())
      .post('/usuarios')
      .send({
        nombre: 'Admin',
        apellido: 'Test',
        email: 'admin@test.com',
        password: 'password123',
      });

    // 2. Actualizar a ADMIN en BD de test
    await prisma.usuario.update({
      where: { email: 'admin@test.com' },
      data: { rol: 'ADMIN' },
    });

    // 3. Obtener token de autenticación
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });
    
    adminToken = loginResponse.body.access_token;
  }

  it('debería crear un auto exitosamente', async () => {
    const response = await request(app.getHttpServer())
      .post('/autos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCar);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.nombre).toBe(validCar.nombre);
  });

  it('debería devolver error si faltan campos requeridos', async () => {
    const response = await request(app.getHttpServer())
      .post('/autos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidCars.missingFields);

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
    expect(Array.isArray(response.body.message)).toBe(true);
  });

  it('debería devolver error si el precio es negativo', async () => {
    const response = await request(app.getHttpServer())
      .post('/autos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidCars.negativePrice);

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('precio')]),
    );
  });

  it('debería devolver error si el año es mayor al actual', async () => {
    const response = await request(app.getHttpServer())
      .post('/autos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidCars.futureYear);

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('ano')]),
    );
  });

  it('debería devolver error si el kilometraje es negativo', async () => {
    const response = await request(app.getHttpServer())
      .post('/autos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidCars.negativeMileage);

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('kilometraje')]),
    );
  });

  it('debería permitir un precio de 0', async () => {
    const response = await request(app.getHttpServer())
      .post('/autos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidCars.zeroPrice);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.precio).toBe(0);
  });

  it('debería devolver error 409 si la matrícula ya existe', async () => {
    const carData = { ...validCar, matricula: 'TEST-DUPLICATE' };
    
    // Crear el primer auto
    await request(app.getHttpServer())
      .post('/autos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(carData);

    // Intentar crear otro auto con la misma matrícula
    const response = await request(app.getHttpServer())
      .post('/autos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(carData);

    expect(response.status).toBe(409);
    expect(response.body.statusCode).toBe(409);
    expect(response.body.message).toBe('La matrícula ya existe en el sistema.');
    expect(response.body.error).toBe('Conflict');
  });
});
