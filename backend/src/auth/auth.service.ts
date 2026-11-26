import { createHash, randomBytes } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { OAuthProfile, PublicUser, SESSION_TTL_MS, toPublicUser } from './types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    private readonly config: ConfigService,
  ) {}

  isProviderConfigured(provider: 'google' | 'microsoft' | 'facebook'): boolean {
    const pairs: Record<typeof provider, [string, string]> = {
      google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      microsoft: ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'],
      facebook: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
    };
    const [idKey, secretKey] = pairs[provider];
    const id = this.config.get<string>(idKey)?.trim();
    const secret = this.config.get<string>(secretKey)?.trim();
    return Boolean(id && secret && !id.startsWith('your-') && !secret.startsWith('your-'));
  }

  getConfiguredProviders(): Array<'google' | 'microsoft' | 'facebook'> {
    return (['google', 'microsoft', 'facebook'] as const).filter((p) =>
      this.isProviderConfigured(p),
    );
  }

  async upsertOAuthUser(profile: OAuthProfile): Promise<User> {
    let user = await this.usersRepository.findOne({
      where: { provider: profile.provider, providerId: profile.providerId },
    });

    if (!user) {
      user = this.usersRepository.create({
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      });
    } else {
      user.email = profile.email;
      user.name = profile.name;
      user.avatarUrl = profile.avatarUrl;
    }

    return this.usersRepository.save(user);
  }

  async createSession(user: User): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = this.sessionsRepository.create({
      tokenHash: this.hashToken(token),
      userId: user.id,
      expiresAt,
    });
    await this.sessionsRepository.save(session);
    return { token, expiresAt };
  }

  async findUserBySessionToken(token: string | undefined): Promise<PublicUser | null> {
    if (!token) {
      return null;
    }

    const session = await this.sessionsRepository.findOne({
      where: { tokenHash: this.hashToken(token) },
      relations: { user: true },
    });

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      if (session) {
        await this.sessionsRepository.delete({ id: session.id });
      }
      return null;
    }

    return toPublicUser(session.user);
  }

  async requireUserBySessionToken(token: string | undefined): Promise<PublicUser> {
    const user = await this.findUserBySessionToken(token);
    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }
    return user;
  }

  async revokeSession(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }
    await this.sessionsRepository.delete({ tokenHash: this.hashToken(token) });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
