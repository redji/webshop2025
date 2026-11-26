import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RecaptchaService } from './recaptcha.service';
import { SESSION_COOKIE } from './types';
import type { User } from './entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    getConfiguredProviders: jest.fn(() => ['google']),
    isProviderConfigured: jest.fn((provider: string) => provider === 'google'),
    findUserBySessionToken: jest.fn(),
    createSession: jest.fn(),
    revokeSession: jest.fn(),
  };
  const recaptchaService = {
    getPublicConfig: jest.fn(() => ({ required: true, siteKey: 'site-key' })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: RecaptchaService, useValue: recaptchaService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) => {
              if (key === 'FRONTEND_URL') return 'http://localhost:3000';
              if (key === 'COOKIE_SECURE') return 'false';
              if (key === 'COOKIE_SAME_SITE') return 'lax';
              return fallback;
            },
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('lists configured providers and reCAPTCHA config', () => {
    expect(controller.listProviders()).toEqual({
      providers: ['google'],
      recaptcha: { required: true, siteKey: 'site-key' },
    });
  });

  it('returns null user when no session exists for /me', async () => {
    authService.findUserBySessionToken.mockResolvedValue(null);
    await expect(controller.me({ cookies: {} } as never)).resolves.toEqual({ user: null });
  });

  it('returns the signed-in user for /me', async () => {
    const user = {
      id: '1',
      email: 'a@example.com',
      name: 'Ada',
      provider: 'google' as const,
      avatarUrl: null,
    };
    authService.findUserBySessionToken.mockResolvedValue(user);
    await expect(controller.me({ cookies: { [SESSION_COOKIE]: 'tok' } } as never)).resolves.toEqual(
      { user },
    );
  });

  it('sets session cookie and redirects after OAuth', async () => {
    const user = { id: '1' } as User;
    authService.createSession.mockResolvedValue({
      token: 'abc',
      expiresAt: new Date('2030-01-01T00:00:00Z'),
    });
    const res = {
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
    await controller.googleCallback({ user } as never, res as never);
    expect(res.cookie).toHaveBeenCalledWith(
      SESSION_COOKIE,
      'abc',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/account');
  });

  it('clears cookie on logout', async () => {
    const res = {
      clearCookie: jest.fn(),
    };
    await controller.logout({ cookies: { [SESSION_COOKIE]: 'tok' } } as never, res as never);
    expect(authService.revokeSession).toHaveBeenCalledWith('tok');
    expect(res.clearCookie).toHaveBeenCalledWith(
      SESSION_COOKIE,
      expect.objectContaining({ httpOnly: true }),
    );
  });
});
