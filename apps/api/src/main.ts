import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation using class-validator DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // Strip unknown fields from request body
    forbidNonWhitelisted: true,  // Throw error if unknown fields are sent
    transform: true,        // Auto-convert types (e.g. string "123" to number 123)
  }));

  await app.listen(3001);
}
bootstrap();
