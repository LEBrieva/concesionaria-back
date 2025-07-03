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

  // Función auxiliar para hacer peticiones PUT con imágenes
  const putAutoWithImages = (
    autoId: string,
    token: string,
    files: { buffer: Buffer; filename: string }[],
    imagenesExistentes: string[] = []
  ) => {
    let req = request(app.getHttpServer())
      .put(`/autos/${autoId}`)
      .set('Authorization', `Bearer ${token}`)
      .field('imagenes', JSON.stringify(imagenesExistentes));

    files.forEach(file => {
      req = req.attach('imagenes', file.buffer, file.filename);
    });

    return req;
  };

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







  describe('🗑️ Eliminación de Imágenes (DELETE /autos/:id/imagenes)', () => {
    let imageFileName: string;

    beforeEach(async () => {
      // Subir una imagen usando PUT para luego eliminarla
      await delay(1000);
      
      const imageBuffer = createTestImageBuffer('jpeg');
      
      const uploadResponse = await putAutoWithImages(
        autoId,
        adminToken,
        [{ buffer: imageBuffer, filename: 'to-delete.jpg' }],
        [] // Sin imágenes existentes
      );

      // Extraer el nombre del archivo de la URL completa
      const imageUrl = uploadResponse.body.imagenes[0];
      const urlParts = imageUrl.split('/');
      imageFileName = urlParts[urlParts.length - 1]; // Último segmento de la URL
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
      
      // Subir otra imagen para el vendedor usando PUT
      const imageBuffer = createTestImageBuffer('jpeg');
      const uploadResponse = await putAutoWithImages(
        autoId,
        vendedorToken,
        [{ buffer: imageBuffer, filename: 'vendedor-delete.jpg' }],
        [] // Sin imágenes existentes
      );

      // Extraer el nombre del archivo de la URL completa
      const imageUrl = uploadResponse.body.imagenes[0];
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1]; // Último segmento de la URL
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
      
      // 1. Subir imagen usando PUT
      const imageBuffer = createTestImageBuffer('png');
      const uploadResponse = await putAutoWithImages(
        autoId,
        adminToken,
        [{ buffer: imageBuffer, filename: 'full-cycle.png' }],
        [] // Sin imágenes existentes
      ).expect(200);

      // Extraer el nombre del archivo de la URL completa
      const imageUrl = uploadResponse.body.imagenes[0];
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1]; // Último segmento de la URL
      expect(fileName).toBeDefined();
      await delay(1000);

      // 2. Verificar que la imagen está en el auto (obtener auto)
      const autoResponse = await request(app.getHttpServer())
        .get(`/autos/${autoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(autoResponse.body.imagenes).toContain(uploadResponse.body.imagenes[0]);
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

      expect(autoUpdatedResponse.body.imagenes).not.toContain(uploadResponse.body.imagenes[0]);
    });

    it('debe manejar múltiples operaciones secuenciales', async () => {
      await delay(2000);
      
      const imageBuffer1 = createTestImageBuffer('jpeg');
      const imageBuffer2 = createTestImageBuffer('png');
      
      // Subir primera imagen
      const response1 = await putAutoWithImages(
        autoId,
        adminToken,
        [{ buffer: imageBuffer1, filename: 'sequential-1.jpg' }],
        [] // Sin imágenes existentes
      );

      expect(response1.status).toBe(200);
      expect(response1.body.imagenes).toHaveLength(1);
      
      await delay(1000);
      
      // Subir segunda imagen manteniendo la primera
      const response2 = await putAutoWithImages(
        autoId,
        vendedorToken,
        [{ buffer: imageBuffer2, filename: 'sequential-2.png' }],
        response1.body.imagenes // Mantener imágenes existentes
      );

      expect(response2.status).toBe(200);
      expect(response2.body.imagenes).toHaveLength(2); // Ahora debe tener 2 imágenes
    });
  });
});