import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // quita propiedades que no estén en el DTO
      forbidNonWhitelisted: true, // lanza error si llegan propiedades no deseadas
      transform: true, // transforma tipos automáticamente (por ejemplo, string a number)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
