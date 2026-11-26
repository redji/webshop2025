import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RecaptchaService } from './recaptcha.service';

describe('RecaptchaService', () => {
  let service: RecaptchaService;
  let configValues: Record<string, string>;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    configValues = {
      RECAPTCHA_DISABLED: 'false',
      RECAPTCHA_SITE_KEY: 'site-key',
      RECAPTCHA_SECRET_KEY: 'secret-key',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecaptchaService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) => configValues[key] ?? fallback,
          },
        },
      ],
    }).compile();

    service = module.get(RecaptchaService);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('skips verification when explicitly disabled', async () => {
    configValues.RECAPTCHA_DISABLED = 'true';
    await expect(service.assertValidToken(undefined)).resolves.toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(service.getPublicConfig()).toEqual({ required: false, siteKey: null });
  });

  it('fails closed when required but keys are missing', async () => {
    delete configValues.RECAPTCHA_SITE_KEY;
    delete configValues.RECAPTCHA_SECRET_KEY;
    await expect(service.assertValidToken('tok')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects missing tokens when configured', async () => {
    await expect(service.assertValidToken(undefined)).rejects.toThrow(/Missing reCAPTCHA token/);
  });

  it('rejects invalid tokens from Google siteverify', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    });
    await expect(service.assertValidToken('bad')).rejects.toThrow(/Invalid reCAPTCHA token/);
  });

  it('accepts a valid token', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    await expect(service.assertValidToken('good', '127.0.0.1')).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('exposes site key when required and configured', () => {
    expect(service.getPublicConfig()).toEqual({ required: true, siteKey: 'site-key' });
  });
});
