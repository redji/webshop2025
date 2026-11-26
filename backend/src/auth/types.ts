import type { AuthProvider, User } from './entities/user.entity';

export type OAuthProfile = {
  provider: AuthProvider;
  providerId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  provider: AuthProvider;
  avatarUrl: string | null;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
    avatarUrl: user.avatarUrl,
  };
}

export const SESSION_COOKIE = 'webshop_session';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
