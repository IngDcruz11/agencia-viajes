import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos que no están en el DTO
      forbidNonWhitelisted: true, // error si mandan campos extra
      transform: true, // convierte tipos (ej. "5" -> 5)
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`API Agencia de Viajes corriendo en http://localhost:${port}/api`);
}
bootstrap();
