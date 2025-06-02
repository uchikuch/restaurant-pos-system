// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe for DTO validation with enhanced options
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that don't have decorators
    forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    transform: true, // Automatically transform payloads to DTO instances
    disableErrorMessages: false, // Show detailed validation error messages
  }));

  // CORS for frontend applications with additional headers for JWT
  app.enableCors({
    origin: [
      'http://localhost:3000', // customer-web
      'http://localhost:3001', // kitchen-dashboard  
      'http://localhost:3002', // admin-panel
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Restaurant POS API running on: http://localhost:${port}/api/v1`);
  console.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
  console.log(`🔐 Auth endpoints available at: http://localhost:${port}/api/v1/auth`);
  console.log(`👥 User management: http://localhost:${port}/api/v1/users`);
}
bootstrap();