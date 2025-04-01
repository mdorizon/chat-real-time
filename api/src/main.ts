import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ajout du préfixe global 'api'
  app.setGlobalPrefix('api');

  // Activation de la validation des DTOs
  app.useGlobalPipes(new ValidationPipe());

  // Configuration CORS
  app.enableCors({
    origin: 'http://localhost:5173', // URL de votre frontend React (port par défaut de Vite)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
