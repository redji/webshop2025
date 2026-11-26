import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { MessagingModule } from './messaging/messaging.module';
import { Product } from './products/product.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: Number(config.get<string>('DATABASE_PORT', '5432')),
        username: config.get<string>('DATABASE_USER', 'webshop'),
        password: config.get<string>('DATABASE_PASSWORD', 'webshop'),
        database: config.get<string>('DATABASE_NAME', 'webshop'),
        entities: [Product],
        synchronize: true,
      }),
    }),
    HealthModule,
    ProductsModule,
    MessagingModule,
  ],
})
export class AppModule {}
