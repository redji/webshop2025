import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { MessagingModule } from './messaging/messaging.module';
import { AuthModule } from './auth/auth.module';
import { Product } from './products/product.entity';
import { User } from './auth/entities/user.entity';
import { Session } from './auth/entities/session.entity';

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
        entities: [Product, User, Session],
        synchronize: true,
      }),
    }),
    HealthModule,
    ProductsModule,
    MessagingModule,
    AuthModule,
  ],
})
export class AppModule {}
