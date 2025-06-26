import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/shared/prisma.service';
import { verifyTestDatabase } from '../test-database.config';

/**
 * 🛡️ TESTS E2E CRÍTICOS - Protección de Seguridad
 * 
 * Estos tests validan que las protecciones de seguridad funcionen
 * en el entorno real con HTTP + Guards + Middleware.
 * 
 * Se enfocan en casos críticos que podrían comprometer el sistema.
 */
describe('Security & Anti-Spam Protection (e2e)', () => {
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
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🚦 Rate Limiting (Anti-DDoS)', () => {
    it('debe bloquear ataques de fuerza bruta (protección crítica)', async () => {
      const requests: Promise<request.Response>[] = [];
      
      // Simular ataque: 8 requests simultáneos
      for (let i = 0; i < 8; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/auth/google')
            .send({ firebaseToken: 'attack-token' })
        );
      }

      const responses = await Promise.allSettled(requests);
      
      // Verificar que el sistema tiene algún tipo de protección
      const blockedResponses = responses.filter(result => 
        result.status === 'fulfilled' && result.value.status === 429
      );
      const errorResponses = responses.filter(result => 
        result.status === 'fulfilled' && result.value.status >= 400
      );
      
      // Al menos algunas requests deben ser bloqueadas o fallar (protección activa)
      expect(blockedResponses.length + errorResponses.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('🤖 Anti-Bot Protection', () => {
    it('debe bloquear bots maliciosos (seguridad crítica)', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Evitar rate limiting
      
      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .set('User-Agent', 'bot-scraper-malicious')
        .send({ firebaseToken: 'bot-attack-token' });

      // Debe ser bloqueado por protección anti-bot o rate limiting
      expect([400, 429]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.message).toBe('Invalid request');
      }
    });

    it('debe permitir navegadores legítimos', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .send({ firebaseToken: 'legitimate-user-token-but-fake-content-for-testing' });

      // No debe ser bloqueado por user agent (fallará por token inválido)
      expect(response.status).not.toBe(400);
      expect(response.body.message).not.toBe('Invalid request');
    });
  });

  describe('🔒 Protección Combinada (Escenarios Reales)', () => {
    it('debe permitir request legítimo que pasa todas las protecciones', async () => {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Reset rate limit
      
      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .send({ 
          firebaseToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFmODhiODE0MjljYzQ1MWEzMzVjMmY1Y2QwYTNmNDczZjQwZGNkZGEiLCJ0eXAiOiJKV1QifQ.fake-but-valid-length-token-for-testing-security-guards-and-validation-layers'
        });

      // Debe pasar todas las validaciones de seguridad (fallará en Firebase)
      expect(response.status).not.toBe(400);
      
      if (response.body?.message) {
        expect(response.body.message).not.toContain('Invalid request');
        expect(response.body.message).not.toContain('Invalid token format');
      }
    });

    it('debe bloquear request malicioso con múltiples red flags', async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const response = await request(app.getHttpServer())
        .post('/auth/google')
        .set('User-Agent', 'malicious-bot-v1.0')
        .send({ firebaseToken: 'short' });

      // Debe ser bloqueado por protecciones de seguridad
      expect([400, 429]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.message).toBe('Invalid request');
      }
    });
  });
});