import { getApiBaseUrl, getBrowserApiBaseUrl, oauthStartUrl } from '@/lib/api';

describe('getApiBaseUrl', () => {
  const originalPublic = process.env.NEXT_PUBLIC_API_URL;
  const originalApi = process.env.API_URL;

  afterEach(() => {
    if (originalPublic === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalPublic;
    }
    if (originalApi === undefined) {
      delete process.env.API_URL;
    } else {
      process.env.API_URL = originalApi;
    }
  });

  it('defaults to localhost API', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.API_URL;
    expect(getApiBaseUrl()).toBe('http://localhost:3001');
  });

  it('strips trailing slash', () => {
    delete process.env.API_URL;
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });

  it('prefers API_URL on the server', () => {
    process.env.API_URL = 'http://api:3001';
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
    expect(getApiBaseUrl()).toBe('http://api:3001');
  });

  it('keeps browser API URL on the public host (not Docker DNS)', () => {
    process.env.API_URL = 'http://api:3001';
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
    expect(getBrowserApiBaseUrl()).toBe('http://localhost:3001');
    expect(oauthStartUrl('google')).toBe('http://localhost:3001/auth/google');
  });
});
