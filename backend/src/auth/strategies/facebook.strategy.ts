import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-facebook';
import { AuthService } from '../auth.service';
import type { OAuthProfile } from '../types';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('FACEBOOK_APP_ID', 'not-configured'),
      clientSecret: config.get<string>('FACEBOOK_APP_SECRET', 'not-configured'),
      callbackURL: config.get<string>(
        'FACEBOOK_CALLBACK_URL',
        'http://localhost:3001/auth/facebook/callback',
      ),
      profileFields: ['id', 'displayName', 'emails', 'photos'],
      enableProof: true,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: Express.User) => void,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Facebook account did not return an email'));
      return;
    }

    const oauthProfile: OAuthProfile = {
      provider: 'facebook',
      providerId: profile.id,
      email,
      name: profile.displayName ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };

    try {
      const user = await this.authService.upsertOAuthUser(oauthProfile);
      done(null, user);
    } catch (err) {
      done(err as Error);
    }
  }
}
