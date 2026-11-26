import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth.service';
import { SESSION_COOKIE, type PublicUser } from '../types';

type AuthedRequest = Request & { user?: PublicUser };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    const user = await this.authService.findUserBySessionToken(token);
    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }
    request.user = user;
    return true;
  }
}
