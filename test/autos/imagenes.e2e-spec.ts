import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/shared/prisma.service';
import { verifyTestDatabase } from '../test-database.config';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 📸 TESTS E2E CRÍTICOS - Gestión de Imágenes
 * 
 * Estos tests validan que los endpoints de imágenes funcionen
 * correctamente con autenticación, autorización y Firebase Storage.
 * 
 * Cubren:
 * ✅ HTTP + JWT + Guards + BD real + Firebase Storage
 * ✅ Subida de archivos multipart/form-data
 * ✅ Validaciones de tipo y tamaño de archivo  
 * ✅ Sistema de permisos por roles (ADMIN/VENDEDOR)
 * ✅ Manejo de errores y casos edge
 */
describe('Gestión de Imágenes E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let vendedorToken: string;
  let clienteToken: string;
  let autoId: string;

  // Helper para evitar rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper para crear archivos de prueba en memoria
  const createTestImageBuffer = (type: 'jpeg' | 'png' | 'webp' | 'invalid' = 'jpeg'): Buffer => {
    // Firmas de archivos reales para validación
    const signatures = {
      jpeg: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG header
      png: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG header
      webp: Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF header for WebP
      invalid: Buffer.from([0x00, 0x01, 0x02, 0x03]) // Invalid signature
    };
    
    const signature = signatures[type];
    const padding = Buffer.alloc(1024); // 1KB de datos
    return Buffer.concat([signature, padding]);
  };

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
    await prisma.auto.deleteMany();
    await prisma.usuario.deleteMany();

    // 👥 Crear usuarios y auto de prueba
    await createTestUsersAndAuto();
  });

  afterAll(async () => {
    // 🧹 LIMPIAR BD DE TEST después de los tests
    await prisma.auto.deleteMany();
    await prisma.usuario.deleteMany();
    await app.close();
  });

  async function createTestUsersAndAuto() {
    // 1. Crear ADMIN inicial
    await request(app.getHttpServer())
      .post('/usuarios')
      .send({
        nombre: 'Admin',
        apellido: 'Test',
        email: 'admin@test.com',
        password: 'password123',
      });

    await delay(500);

    // 2. Actualizar manualmente a ADMIN en BD de test
    await prisma.usuario.update({
      where: { email: 'admin@test.com' },
      data: { rol: 'ADMIN' },
    });

    // 3. Login como ADMIN
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });
    
    adminToken = adminLogin.body.access_token;
    await delay(500);

    // 4. Crear VENDEDOR
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

    // 6. Crear CLIENTE
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
    await delay(500);

    // 8. Crear AUTO de prueba con ADMIN
    const autoResponse = await request(app.getHttpServer())
      .post('/autos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Auto Test Imágenes',
        descripcion: 'Auto para tests de imágenes',
        observaciones: 'Observaciones de test',
        matricula: 'IMG123',
        marca: 'TOYOTA',
        modelo: 'Test Model',
        version: 'Standard',
        ano: 2023,
        kilometraje: 0,
        precio: 25000,
        costo: 20000,
        color: 'BLANCO',
        transmision: 'AUTOMATICA',
        estado: 'DISPONIBLE',
        imagenes: [],
        equipamientoDestacado: [],
        caracteristicasGenerales: [],
        exterior: [],
        confort: [],
        seguridad: [],
        interior: [],
        entretenimiento: []
      });

    autoId = autoResponse.body.id;
    await delay(500);
  }

  describe('🔗 Subida de Imágenes (POST /autos/:id/imagenes)', () => {
    it('ADMIN debe subir imagen JPEG válida (flujo completo exitoso)', async () => {
      await delay(1000);
      
      const imageBuffer = createTestImageBuffer('jpeg');
      
      const response = await request(app.getHttpServer())
        .post(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('imagenes', imageBuffer, 'test-image.jpg');

      // Debug: mostrar respuesta si falla
      if (response.status !== 201) {
        console.log('Error response:', response.status, response.body);
      }
      
      expect(response.status).toBe(201);

      // Verificar estructura de respuesta
      expect(response.body.imagenes).toBeDefined();
      expect(response.body.total).toBe(1);
      expect(response.body.mensaje).toContain('1 imagen(es) subida(s) exitosamente');
      
      // Verificar datos de la imagen
      const imagen = response.body.imagenes[0];
      expect(imagen.url).toBeDefined();
      expect(imagen.url).toContain('storage.googleapis.com');
      expect(imagen.fileName).toBeDefined();
      expect(imagen.fileName).toMatch(/\.jpg$/);
    });

    it('VENDEDOR debe subir múltiples imágenes PNG (autorización correcta)', async () => {
      await delay(1000);
      
      const imageBuffer1 = createTestImageBuffer('png');
      const imageBuffer2 = createTestImageBuffer('png');
      
      const response = await request(app.getHttpServer())
        .post(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .attach('imagenes', imageBuffer1, 'test-1.png')
        .attach('imagenes', imageBuffer2, 'test-2.png')
        .expect(201);

      expect(response.body.total).toBe(2);
      expect(response.body.imagenes).toHaveLength(2);
      expect(response.body.mensaje).toContain('2 imagen(es) subida(s) exitosamente');
      
      // Verificar ambas imágenes
      response.body.imagenes.forEach(imagen => {
        expect(imagen.url).toContain('storage.googleapis.com');
        expect(imagen.fileName).toMatch(/\.png$/);
      });
    });

    it('debe subir imagen WebP válida (soporte de formato moderno)', async () => {
      await delay(1000);
      
      const imageBuffer = createTestImageBuffer('webp');
      
      const response = await request(app.getHttpServer())
        .post(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('imagenes', imageBuffer, 'modern-image.webp')
        .expect(201);

      expect(response.body.total).toBe(1);
      expect(response.body.imagenes[0].fileName).toMatch(/\.webp$/);
    });
  });

  describe('🔒 Seguridad y Autorización', () => {
    it('debe rechazar CLIENTE sin permisos (seguridad crítica)', async () => {
      await delay(1000);
      
      const imageBuffer = createTestImageBuffer('jpeg');
      
      await request(app.getHttpServer())
        .post(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .attach('imagenes', imageBuffer, 'unauthorized.jpg')
        .expect(403);
    });

    it('debe rechazar request sin autenticación (seguridad básica)', async () => {
      await delay(1000);
      
      const imageBuffer = createTestImageBuffer('jpeg');
      
      await request(app.getHttpServer())
        .post(`/autos/${autoId}/imagenes`)
        .attach('imagenes', imageBuffer, 'no-auth.jpg')
        .expect(401);
    });

    it('debe rechazar token JWT inválido', async () => {
      await delay(1000);
      
      const imageBuffer = createTestImageBuffer('jpeg');
      
      await request(app.getHttpServer())
        .post(`/autos/${autoId}/imagenes`)
        .set('Authorization', 'Bearer token-invalido')
        .attach('imagenes', imageBuffer, 'invalid-token.jpg')
        .expect(401);
    });
  });

  describe('🛡️ Validaciones de Archivos', () => {
    it('debe rechazar archivo con firma inválida (seguridad)', async () => {
      await delay(1000);
      
      const invalidBuffer = createTestImageBuffer('invalid');
      
      await request(app.getHttpServer())
        .post(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('imagenes', invalidBuffer, 'malicious.jpg')
        .expect(400);
    });

    it('debe rechazar más de 10 imágenes (límite de archivos)', async () => {
      await delay(1000);
      
      const req = request(app.getHttpServer())
        .post(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Intentar subir 11 imágenes
      for (let i = 0; i < 11; i++) {
        const imageBuffer = createTestImageBuffer('jpeg');
        req.attach('imagenes', imageBuffer, `overflow-${i}.jpg`);
      }

      await req.expect(400);
    });

    it('debe rechazar request sin archivos', async () => {
      await delay(1000);
      
      await request(app.getHttpServer())
        .post(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('debe rechazar auto inexistente (validación de entidad)', async () => {
      await delay(1000);
      
      const imageBuffer = createTestImageBuffer('jpeg');
      const fakeAutoId = '123e4567-e89b-12d3-a456-426614174000';
      
      await request(app.getHttpServer())
        .post(`/autos/${fakeAutoId}/imagenes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('imagenes', imageBuffer, 'no-auto.jpg')
        .expect(404);
    });
  });

  describe('🗑️ Eliminación de Imágenes (DELETE /autos/:id/imagenes)', () => {
    let imageFileName: string;

    beforeEach(async () => {
      // Subir una imagen para luego eliminarla
      await delay(1000);
      
      const imageBuffer = createTestImageBuffer('jpeg');
      const uploadResponse = await request(app.getHttpServer())
        .post(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('imagenes', imageBuffer, 'to-delete.jpg');

      imageFileName = uploadResponse.body.imagenes[0].fileName;
      await delay(500);
    });

    it('ADMIN debe eliminar imagen exitosamente', async () => {
      await delay(1000);
      
      const response = await request(app.getHttpServer())
        .delete(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fileName: imageFileName })
        .expect(200);

      expect(response.body.mensaje).toBe('Imagen eliminada exitosamente');
    });

    it('VENDEDOR debe eliminar imagen (autorización correcta)', async () => {
      await delay(1000);
      
      // Subir otra imagen para el vendedor
      const imageBuffer = createTestImageBuffer('jpeg');
      const uploadResponse = await request(app.getHttpServer())
        .post(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .attach('imagenes', imageBuffer, 'vendedor-delete.jpg');

      const fileName = uploadResponse.body.imagenes[0].fileName;
      await delay(500);

      const response = await request(app.getHttpServer())
        .delete(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({ fileName })
        .expect(200);

      expect(response.body.mensaje).toBe('Imagen eliminada exitosamente');
    });

    it('debe rechazar CLIENTE sin permisos', async () => {
      await delay(1000);
      
      await request(app.getHttpServer())
        .delete(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ fileName: imageFileName })
        .expect(403);
    });

    it('debe manejar imagen inexistente correctamente', async () => {
      await delay(1000);
      
      await request(app.getHttpServer())
        .delete(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fileName: 'imagen-inexistente.jpg' })
        .expect(400);
    });

    it('debe rechazar fileName vacío', async () => {
      await delay(1000);
      
      await request(app.getHttpServer())
        .delete(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fileName: '' })
        .expect(400);
    });
  });

  describe('🔄 Flujos Completos End-to-End', () => {
    it('debe completar ciclo completo: subir → verificar → eliminar', async () => {
      await delay(2000);
      
      // 1. Subir imagen
      const imageBuffer = createTestImageBuffer('png');
      const uploadResponse = await request(app.getHttpServer())
        .post(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('imagenes', imageBuffer, 'full-cycle.png')
        .expect(201);

      const fileName = uploadResponse.body.imagenes[0].fileName;
      expect(fileName).toBeDefined();
      await delay(1000);

      // 2. Verificar que la imagen está en el auto (obtener auto)
      const autoResponse = await request(app.getHttpServer())
        .get(`/autos/${autoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(autoResponse.body.imagenes).toContain(uploadResponse.body.imagenes[0].url);
      await delay(1000);

      // 3. Eliminar imagen
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/autos/${autoId}/imagenes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fileName })
        .expect(200);

      expect(deleteResponse.body.mensaje).toBe('Imagen eliminada exitosamente');
      await delay(1000);

      // 4. Verificar que la imagen ya no está en el auto
      const autoUpdatedResponse = await request(app.getHttpServer())
        .get(`/autos/${autoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(autoUpdatedResponse.body.imagenes).not.toContain(uploadResponse.body.imagenes[0].url);
    });

    it('debe manejar múltiples operaciones concurrentes', async () => {
      await delay(2000);
      
      const imageBuffer1 = createTestImageBuffer('jpeg');
      const imageBuffer2 = createTestImageBuffer('png');
      
      // Subir dos imágenes simultáneamente
      const [response1, response2] = await Promise.all([
        request(app.getHttpServer())
          .post(`/autos/${autoId}/imagenes`)
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('imagenes', imageBuffer1, 'concurrent-1.jpg'),
        request(app.getHttpServer())
          .post(`/autos/${autoId}/imagenes`)
          .set('Authorization', `Bearer ${vendedorToken}`)
          .attach('imagenes', imageBuffer2, 'concurrent-2.png')
      ]);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.total).toBe(1);
      expect(response2.body.total).toBe(1);
    });
  });
});