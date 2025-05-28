import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe for DTO validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS for frontend applications
  app.enableCors({
    origin: [
      'http://localhost:3000', // customer-web
      'http://localhost:3001', // kitchen-dashboard  
      'http://localhost:3002', // admin-panel
    ],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Restaurant POS API running on: http://localhost:${port}/api/v1`);
  console.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
}
bootstrap();
