import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { SessionGuard } from './guards/session.guard';

@Module({
  imports: [PassportModule.register({ session: false }), TypeOrmModule.forFeature([User, Session])],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, MicrosoftStrategy, FacebookStrategy, SessionGuard],
  exports: [AuthService, SessionGuard],
})
export class AuthModule {}
