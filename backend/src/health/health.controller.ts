import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'webshop2025-api',
      timestamp: new Date().toISOString(),
    };
  }
}
