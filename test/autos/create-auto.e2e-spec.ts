import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { validCar, invalidCars } from './test-data/autos.data';
import { AppModule } from '../../src/app.module';

describe('AutosController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
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
});
