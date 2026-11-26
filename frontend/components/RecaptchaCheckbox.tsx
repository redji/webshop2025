'use client';

import { useEffect, useId, useRef } from 'react';

const SCRIPT_ID = 'google-recaptcha-v2';
const SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit';

type Grecaptcha = {
  ready: (cb: () => void) => void;
  render: (
    container: HTMLElement,
    parameters: {
      sitekey: string;
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'light' | 'dark';
    },
  ) => number;
  reset: (widgetId?: number) => void;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

function loadRecaptchaScript(): Promise<Grecaptcha> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('reCAPTCHA requires a browser'));
  }

  if (window.grecaptcha?.render) {
    return Promise.resolve(window.grecaptcha);
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.grecaptcha) resolve(window.grecaptcha);
        else reject(new Error('reCAPTCHA failed to load'));
      });
      existing.addEventListener('error', () => reject(new Error('reCAPTCHA failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) resolve(window.grecaptcha);
      else reject(new Error('reCAPTCHA failed to load'));
    };
    script.onerror = () => reject(new Error('reCAPTCHA failed to load'));
    document.head.appendChild(script);
  });
}

type RecaptchaCheckboxProps = {
  siteKey: string;
  onChange: (token: string | null) => void;
  onError?: (message: string) => void;
};

export function RecaptchaCheckbox({ siteKey, onChange, onError }: RecaptchaCheckboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  const onErrorRef = useRef(onError);
  const reactId = useId();

  onChangeRef.current = onChange;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      try {
        const grecaptcha = await loadRecaptchaScript();
        if (cancelled || !containerRef.current) return;

        grecaptcha.ready(() => {
          if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
          widgetIdRef.current = grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => onChangeRef.current(token),
            'expired-callback': () => onChangeRef.current(null),
            'error-callback': () => {
              onChangeRef.current(null);
              onErrorRef.current?.('reCAPTCHA failed — try again');
            },
          });
        });
      } catch (err) {
        if (!cancelled) {
          onErrorRef.current?.(err instanceof Error ? err.message : 'reCAPTCHA failed to load');
        }
      }
    }

    void mount();

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch {
          // Widget may already be gone on unmount.
        }
      }
      widgetIdRef.current = null;
    };
  }, [siteKey]);

  return (
    <div className="recaptcha-wrap" data-testid="recaptcha-checkbox">
      <p className="muted recaptcha-hint">Confirm you are human before signing in.</p>
      <div ref={containerRef} id={`recaptcha-${reactId.replace(/:/g, '')}`} />
    </div>
  );
}
