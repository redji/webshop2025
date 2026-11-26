import { act, render, screen, waitFor } from '@testing-library/react';
import { AccountPanel } from '@/components/AccountPanel';

jest.mock('@/lib/api', () => ({
  fetchCurrentUser: jest.fn(),
  fetchAuthProviders: jest.fn(),
  logout: jest.fn(),
  oauthStartUrl: (provider: string, token?: string | null) =>
    token
      ? `http://localhost:3001/auth/${provider}?recaptchaToken=${encodeURIComponent(token)}`
      : `http://localhost:3001/auth/${provider}`,
}));

jest.mock('@/components/RecaptchaCheckbox', () => ({
  RecaptchaCheckbox: ({
    onChange,
  }: {
    siteKey: string;
    onChange: (token: string | null) => void;
    onError?: (message: string) => void;
  }) => (
    <button type="button" onClick={() => onChange('test-token')}>
      Solve captcha
    </button>
  ),
}));

import { fetchAuthProviders, fetchCurrentUser } from '@/lib/api';

const mockFetchCurrentUser = fetchCurrentUser as jest.MockedFunction<typeof fetchCurrentUser>;
const mockFetchAuthProviders = fetchAuthProviders as jest.MockedFunction<typeof fetchAuthProviders>;

describe('AccountPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps OAuth links disabled until reCAPTCHA succeeds', async () => {
    mockFetchCurrentUser.mockResolvedValue(null);
    mockFetchAuthProviders.mockResolvedValue({
      providers: ['google'],
      recaptcha: { required: true, siteKey: 'site-key' },
    });

    render(<AccountPanel />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeDisabled();
    });

    await act(async () => {
      screen.getByRole('button', { name: /Solve captcha/i }).click();
    });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Continue with Google/i })).toHaveAttribute(
        'href',
        'http://localhost:3001/auth/google?recaptchaToken=test-token',
      );
    });
    expect(screen.getByRole('button', { name: /Microsoft/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Facebook/i })).toBeDisabled();
  });

  it('allows OAuth without captcha when reCAPTCHA is disabled', async () => {
    mockFetchCurrentUser.mockResolvedValue(null);
    mockFetchAuthProviders.mockResolvedValue({
      providers: ['google'],
      recaptcha: { required: false, siteKey: null },
    });

    render(<AccountPanel />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Continue with Google/i })).toHaveAttribute(
        'href',
        'http://localhost:3001/auth/google',
      );
    });
  });

  it('shows signed-in account details', async () => {
    mockFetchCurrentUser.mockResolvedValue({
      id: '1',
      email: 'ada@example.com',
      name: 'Ada Lovelace',
      provider: 'google',
      avatarUrl: null,
    });
    mockFetchAuthProviders.mockResolvedValue({
      providers: ['google'],
      recaptcha: { required: true, siteKey: 'site-key' },
    });

    render(<AccountPanel />);

    await waitFor(() => {
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    });
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign out/i })).toBeInTheDocument();
  });
});
