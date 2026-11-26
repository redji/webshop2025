import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { RecaptchaService } from '../recaptcha.service';

@Injectable()
export class RecaptchaGuard implements CanActivate {
  constructor(private readonly recaptcha: RecaptchaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token =
      (typeof req.query?.recaptchaToken === 'string' ? req.query.recaptchaToken : undefined) ||
      (typeof req.body?.recaptchaToken === 'string' ? req.body.recaptchaToken : undefined) ||
      (typeof req.headers['x-recaptcha-token'] === 'string'
        ? req.headers['x-recaptcha-token']
        : undefined);

    const remoteIp = req.ip || req.socket?.remoteAddress;
    await this.recaptcha.assertValidToken(token, remoteIp);
    return true;
  }
}
