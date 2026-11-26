import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SiteVerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
};

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);

  constructor(private readonly config: ConfigService) {}

  /** Explicit opt-out for local/dev when keys are intentionally skipped. */
  isDisabled(): boolean {
    return this.config.get<string>('RECAPTCHA_DISABLED', 'false') === 'true';
  }

  /**
   * Fail closed unless explicitly disabled: OAuth start requires a verified
   * token whenever reCAPTCHA is not opted out.
   */
  isRequired(): boolean {
    return !this.isDisabled();
  }

  isConfigured(): boolean {
    const siteKey = this.config.get<string>('RECAPTCHA_SITE_KEY')?.trim();
    const secret = this.config.get<string>('RECAPTCHA_SECRET_KEY')?.trim();
    return Boolean(
      siteKey && secret && !siteKey.startsWith('your-') && !secret.startsWith('your-'),
    );
  }

  getSiteKey(): string | null {
    if (!this.isConfigured()) {
      return null;
    }
    return this.config.get<string>('RECAPTCHA_SITE_KEY')!.trim();
  }

  getPublicConfig(): { required: boolean; siteKey: string | null } {
    if (!this.isRequired()) {
      return { required: false, siteKey: null };
    }
    return { required: true, siteKey: this.getSiteKey() };
  }

  /**
   * Verify a reCAPTCHA v2 response token with Google's siteverify API.
   * No-op when reCAPTCHA is explicitly disabled.
   */
  async assertValidToken(token: string | undefined, remoteIp?: string): Promise<void> {
    if (!this.isRequired()) {
      return;
    }

    if (!this.isConfigured()) {
      throw new ForbiddenException(
        'reCAPTCHA is required but RECAPTCHA_SITE_KEY / RECAPTCHA_SECRET_KEY are not configured. ' +
          'Obtain keys at https://www.google.com/recaptcha/admin or set RECAPTCHA_DISABLED=true for local-only.',
      );
    }

    const trimmed = token?.trim();
    if (!trimmed) {
      throw new ForbiddenException('Missing reCAPTCHA token');
    }

    const secret = this.config.get<string>('RECAPTCHA_SECRET_KEY')!.trim();
    const body = new URLSearchParams({
      secret,
      response: trimmed,
    });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }

    let payload: SiteVerifyResponse;
    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!response.ok) {
        throw new Error(`siteverify HTTP ${response.status}`);
      }
      payload = (await response.json()) as SiteVerifyResponse;
    } catch (err) {
      this.logger.warn(`reCAPTCHA siteverify request failed: ${String(err)}`);
      throw new ForbiddenException('Unable to verify reCAPTCHA token');
    }

    if (!payload.success) {
      this.logger.warn(
        `reCAPTCHA rejected token: ${(payload['error-codes'] || []).join(', ') || 'unknown'}`,
      );
      throw new ForbiddenException('Invalid reCAPTCHA token');
    }
  }
}
