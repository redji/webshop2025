import {
  CanActivate,
  ExecutionContext,
  Injectable,
  mixin,
  ServiceUnavailableException,
  Type,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

type OAuthProviderName = 'google' | 'microsoft' | 'facebook';

export function ProviderConfiguredGuard(provider: OAuthProviderName): Type<CanActivate> {
  @Injectable()
  class MixinProviderConfiguredGuard implements CanActivate {
    constructor(private readonly authService: AuthService) {}

    canActivate(_context: ExecutionContext): boolean {
      if (!this.authService.isProviderConfigured(provider)) {
        throw new ServiceUnavailableException(
          `${provider} OAuth is not configured. Set client ID/secret in the API environment.`,
        );
      }
      return true;
    }
  }

  return mixin(MixinProviderConfiguredGuard);
}
