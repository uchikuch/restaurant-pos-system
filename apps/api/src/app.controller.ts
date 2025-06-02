// apps/api/src/app.controller.ts (Optional Enhancement)
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Public() // This endpoint should be publicly accessible
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected', // You could add actual DB health check here
      authentication: 'enabled',
      version: '1.0.0',
      service: 'Restaurant POS API',
    };
  }

  @Public() // Keep your existing hello endpoint public too
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}