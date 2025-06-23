import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/shared/prisma.service';
import { AllExceptionsFilter } from '../../src/modules/shared/filters/all-exceptions.filter';
import { verifyTestDatabase } from '../test-database.config';

/**
 * 🎯 TESTS E2E SIMPLIFICADOS - Google Auth
 * 
 * NOTA: Estos tests están simplificados porque Google Auth requiere
 * configuración de Firebase que no está disponible en el entorno de test.
 * 
 * Se enfocan en validar la estructura de la API y manejo de errores básicos.
 * La lógica de negocio específica está cubierta por tests unitarios.
 */
describe('Google Auth (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    // 🔒 VERIFICACIÓN DE SEGURIDAD: Asegurar que usamos BD de test
    verifyTestDatabase();
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

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

  describe('🔗 API Structure & Basic Validation', () => {
    it('debe rechazar petición sin token (validación básica)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
      // El Firebase Guard puede bloquear antes que la validación DTO
      expect(response.body.message).toContain('Invalid request');
    });

    it('debe rechazar token vacío (validación DTO)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({
          firebaseToken: ''
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
      // El Firebase Guard puede bloquear antes que la validación DTO
      expect(response.body.message).toContain('Invalid request');
    });

    it('debe tener endpoint disponible (estructura API)', async () => {
      // Este test valida que el endpoint existe y tiene la estructura correcta
      // Aunque falle por Firebase, debe fallar con error específico, no 404
      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .send({
          firebaseToken: 'test-token'
        });

      // Debe responder con algo específico de Google Auth, no 404
      expect(response.status).not.toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

});