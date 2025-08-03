import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './modules/shared/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:3000',
      'https://your-domain.com' // Agregar tu dominio de producción cuando lo tengas
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Configurar prefijo global para APIs
  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Convierte los datos al tipo esperado
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
