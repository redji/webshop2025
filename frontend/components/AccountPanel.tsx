'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  fetchAuthProviders,
  fetchCurrentUser,
  logout,
  oauthStartUrl,
  type AuthProvider,
  type AuthUser,
  type RecaptchaPublicConfig,
} from '@/lib/api';
import { RecaptchaCheckbox } from '@/components/RecaptchaCheckbox';

const PROVIDER_LABELS: Record<AuthProvider, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
  facebook: 'Facebook',
};

const ALL_PROVIDERS: AuthProvider[] = ['google', 'microsoft', 'facebook'];

export function AccountPanel() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [configured, setConfigured] = useState<AuthProvider[]>([]);
  const [recaptcha, setRecaptcha] = useState<RecaptchaPublicConfig>({
    required: false,
    siteKey: null,
  });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [me, auth] = await Promise.all([fetchCurrentUser(), fetchAuthProviders()]);
        if (cancelled) return;
        setUser(me);
        setConfigured(auth.providers);
        setRecaptcha(auth.recaptcha);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load account');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogout() {
    startTransition(async () => {
      try {
        await logout();
        setUser(null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to sign out');
      }
    });
  }

  if (loading) {
    return <p className="muted">Checking your session…</p>;
  }

  if (user) {
    return (
      <div className="account-card">
        <p className="eyebrow">Signed in</p>
        <h2 className="account-name">{user.name || 'Account'}</h2>
        <dl className="account-meta">
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Provider</dt>
            <dd>{PROVIDER_LABELS[user.provider]}</dd>
          </div>
        </dl>
        {error ? <p className="error">{error}</p> : null}
        <button
          type="button"
          className="button button-secondary"
          onClick={handleLogout}
          disabled={pending}
        >
          {pending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    );
  }

  const captchaBlocksOAuth = recaptcha.required && (!recaptcha.siteKey || !recaptchaToken);
  const captchaMisconfigured = recaptcha.required && !recaptcha.siteKey;

  return (
    <div className="account-card">
      <p className="eyebrow">Sign in</p>
      <h2 className="account-name">Choose a provider</h2>
      <p className="lede account-lede">
        Continue with Google, Microsoft, or Facebook. Sessions are stored in Postgres and kept in a
        secure HTTP-only cookie.
      </p>
      {error ? <p className="error">{error}</p> : null}
      {captchaMisconfigured ? (
        <p className="error">
          reCAPTCHA is required but not configured on the API. Set RECAPTCHA_SITE_KEY and
          RECAPTCHA_SECRET_KEY, or set RECAPTCHA_DISABLED=true for local-only.
        </p>
      ) : null}
      {recaptcha.required && recaptcha.siteKey ? (
        <RecaptchaCheckbox
          siteKey={recaptcha.siteKey}
          onChange={setRecaptchaToken}
          onError={(message) => setError(message)}
        />
      ) : null}
      <ul className="oauth-list">
        {ALL_PROVIDERS.map((provider) => {
          const ready = configured.includes(provider);
          const canStart = ready && !captchaBlocksOAuth;
          return (
            <li key={provider}>
              {canStart ? (
                <a className="button oauth-button" href={oauthStartUrl(provider, recaptchaToken)}>
                  Continue with {PROVIDER_LABELS[provider]}
                </a>
              ) : (
                <button
                  type="button"
                  className="button oauth-button"
                  disabled
                  title={
                    !ready
                      ? 'Set client ID/secret in the API .env'
                      : captchaMisconfigured
                        ? 'Configure reCAPTCHA keys on the API'
                        : 'Complete the reCAPTCHA checkbox first'
                  }
                >
                  Continue with {PROVIDER_LABELS[provider]}
                  {!ready ? ' (not configured)' : ''}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
