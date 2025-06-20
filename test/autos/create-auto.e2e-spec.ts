import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { validCar, invalidCars } from './test-data/autos.data';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/modules/shared/filters/all-exceptions.filter';

describe('AutosController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('debería crear un auto exitosamente`', async () => {
    const response = await request(app.getHttpServer())
      .post('/autos')
      .send(validCar);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.nombre).toBe(validCar.nombre);
  });

  it('debería devolver error si faltan campos requeridos', async () => {
    const response = await request(app.getHttpServer())
      .post('/autos')
      .send(invalidCars.missingFields);

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
    expect(Array.isArray(response.body.message)).toBe(true);
  });

  it('debería devolver error si el precio es negativo', async () => {
    const response = await request(app.getHttpServer())
      .post('/autos')
      .send(invalidCars.negativePrice);

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('precio')]),
    );
  });

  it('debería devolver error si el año es mayor al actual', async () => {
    const response = await request(app.getHttpServer())
      .post('/autos')
      .send(invalidCars.futureYear);

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('ano')]),
    );
  });

  it('debería devolver error si el kilometraje es negativo', async () => {
    const response = await request(app.getHttpServer())
      .post('/autos')
      .send(invalidCars.negativeMileage);

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('kilometraje')]),
    );
  });

  it('debería permitir un precio de 0', async () => {
    const response = await request(app.getHttpServer())
      .post('/autos')
      .send(invalidCars.zeroPrice);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.precio).toBe(0);
  });

  it('debería devolver error 409 si la matrícula ya existe', async () => {
    // Crear el primer auto
    await request(app.getHttpServer())
      .post('/autos')
      .send(validCar);

    // Intentar crear otro auto con la misma matrícula
    const response = await request(app.getHttpServer())
      .post('/autos')
      .send(validCar);

    expect(response.status).toBe(409);
    expect(response.body.statusCode).toBe(409);
    expect(response.body.message).toBe('La matrícula ya existe en el sistema.');
    expect(response.body.error).toBe('Conflict');
  });
});
