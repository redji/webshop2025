import { createHash } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';

describe('AuthService', () => {
  let service: AuthService;
  const users: User[] = [];
  const sessions: Session[] = [];

  const usersRepository = {
    findOne: jest.fn(async ({ where }: { where: Partial<User> }) =>
      users.find((u) => u.provider === where.provider && u.providerId === where.providerId),
    ),
    create: jest.fn((data: Partial<User>) => ({ ...data }) as User),
    save: jest.fn(async (user: User) => {
      if (!user.id) {
        user.id = `user-${users.length + 1}`;
        users.push(user);
      } else {
        const idx = users.findIndex((u) => u.id === user.id);
        users[idx] = user;
      }
      return user;
    }),
  };

  const sessionsRepository = {
    create: jest.fn((data: Partial<Session>) => ({ ...data }) as Session),
    save: jest.fn(async (session: Session) => {
      session.id = `session-${sessions.length + 1}`;
      sessions.push(session);
      return session;
    }),
    findOne: jest.fn(
      async ({
        where,
        relations,
      }: {
        where: { tokenHash: string };
        relations?: { user: boolean };
      }) => {
        const session = sessions.find((s) => s.tokenHash === where.tokenHash);
        if (!session) {
          return null;
        }
        if (relations?.user) {
          session.user = users.find((u) => u.id === session.userId)!;
        }
        return session;
      },
    ),
    delete: jest.fn(async ({ id, tokenHash }: { id?: string; tokenHash?: string }) => {
      const idx = sessions.findIndex(
        (s) => (id && s.id === id) || (tokenHash && s.tokenHash === tokenHash),
      );
      if (idx >= 0) {
        sessions.splice(idx, 1);
      }
      return { affected: idx >= 0 ? 1 : 0 };
    }),
  };

  const configValues: Record<string, string> = {
    GOOGLE_CLIENT_ID: 'google-id',
    GOOGLE_CLIENT_SECRET: 'google-secret',
    MICROSOFT_CLIENT_ID: 'your-microsoft-client-id',
    MICROSOFT_CLIENT_SECRET: 'your-microsoft-client-secret',
  };

  beforeEach(async () => {
    users.length = 0;
    sessions.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: getRepositoryToken(Session), useValue: sessionsRepository },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => configValues[key],
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('reports configured providers (ignores placeholder secrets)', () => {
    expect(service.isProviderConfigured('google')).toBe(true);
    expect(service.isProviderConfigured('microsoft')).toBe(false);
    expect(service.getConfiguredProviders()).toEqual(['google']);
  });

  it('upserts OAuth users and creates hashed sessions', async () => {
    const user = await service.upsertOAuthUser({
      provider: 'google',
      providerId: 'gid-1',
      email: 'a@example.com',
      name: 'Ada',
      avatarUrl: null,
    });
    expect(user.id).toBeDefined();
    expect(users).toHaveLength(1);

    const { token, expiresAt } = await service.createSession(user);
    expect(token).toHaveLength(64);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(sessions[0].tokenHash).toBe(createHash('sha256').update(token).digest('hex'));

    const me = await service.findUserBySessionToken(token);
    expect(me).toEqual(
      expect.objectContaining({ email: 'a@example.com', provider: 'google', name: 'Ada' }),
    );
  });

  it('requires a valid session token', async () => {
    await expect(service.requireUserBySessionToken(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('revokes sessions on logout', async () => {
    const user = await service.upsertOAuthUser({
      provider: 'google',
      providerId: 'gid-2',
      email: 'b@example.com',
      name: 'Bea',
      avatarUrl: null,
    });
    const { token } = await service.createSession(user);
    await service.revokeSession(token);
    expect(await service.findUserBySessionToken(token)).toBeNull();
  });
});
