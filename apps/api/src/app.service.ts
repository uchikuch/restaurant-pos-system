import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Restaurant POS API is running! 🍽️';
  }
}
