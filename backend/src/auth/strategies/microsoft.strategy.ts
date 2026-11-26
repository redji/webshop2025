import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { AuthService } from '../auth.service';
import type { OAuthProfile } from '../types';

type MicrosoftProfile = {
  id: string;
  displayName?: string;
  emails?: Array<{ value: string }>;
  _json?: {
    mail?: string;
    userPrincipalName?: string;
    id?: string;
  };
};

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    const tenant = config.get<string>('MICROSOFT_TENANT', 'common');
    super({
      clientID: config.get<string>('MICROSOFT_CLIENT_ID', 'not-configured'),
      clientSecret: config.get<string>('MICROSOFT_CLIENT_SECRET', 'not-configured'),
      callbackURL: config.get<string>(
        'MICROSOFT_CALLBACK_URL',
        'http://localhost:3001/auth/microsoft/callback',
      ),
      scope: ['user.read', 'openid', 'profile', 'email'],
      tenant,
      authorizationURL: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: MicrosoftProfile,
    done: (error: Error | null, user?: Express.User) => void,
  ): Promise<void> {
    const email =
      profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName;

    if (!email) {
      done(new Error('Microsoft account did not return an email'));
      return;
    }

    const oauthProfile: OAuthProfile = {
      provider: 'microsoft',
      providerId: profile.id || profile._json?.id || email,
      email,
      name: profile.displayName ?? null,
      avatarUrl: null,
    };

    try {
      const user = await this.authService.upsertOAuthUser(oauthProfile);
      done(null, user);
    } catch (err) {
      done(err as Error);
    }
  }
}
