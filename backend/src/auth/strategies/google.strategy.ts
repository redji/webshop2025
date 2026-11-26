import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import type { OAuthProfile } from '../types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID', 'not-configured'),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET', 'not-configured'),
      callbackURL: config.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3001/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Google account did not return an email'), undefined);
      return;
    }

    const oauthProfile: OAuthProfile = {
      provider: 'google',
      providerId: profile.id,
      email,
      name: profile.displayName ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };

    try {
      const user = await this.authService.upsertOAuthUser(oauthProfile);
      done(null, user);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
}
