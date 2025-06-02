// apps/api/src/main.ts
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Use working directory approach
const envPath = resolve(process.cwd(), '../../.env');
console.log('🔍 Looking for .env at:', envPath);
console.log('🔍 .env file exists:', existsSync(envPath));

// Load environment variables
if (existsSync(envPath)) {
  console.log('✅ Loading .env from:', envPath);
  config({ path: envPath });
} else {
  console.log('❌ .env file not found at:', envPath);
}

console.log('🔍 Environment check at startup:');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);
console.log('NODE_ENV:', process.env.NODE_ENV);

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: false,
  }));

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Restaurant POS API running on: http://localhost:${port}/api/v1`);
  console.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
  console.log(`🔐 Auth endpoints available at: http://localhost:${port}/api/v1/auth`);
  console.log(`👥 User management: http://localhost:${port}/api/v1/users`);
}
bootstrap();