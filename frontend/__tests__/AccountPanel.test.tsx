import { render, screen, waitFor } from '@testing-library/react';
import { AccountPanel } from '@/components/AccountPanel';

jest.mock('@/lib/api', () => ({
  fetchCurrentUser: jest.fn(),
  fetchAuthProviders: jest.fn(),
  logout: jest.fn(),
  oauthStartUrl: (provider: string) => `http://localhost:3001/auth/${provider}`,
}));

import { fetchAuthProviders, fetchCurrentUser } from '@/lib/api';

const mockFetchCurrentUser = fetchCurrentUser as jest.MockedFunction<typeof fetchCurrentUser>;
const mockFetchAuthProviders = fetchAuthProviders as jest.MockedFunction<typeof fetchAuthProviders>;

describe('AccountPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows provider buttons when signed out', async () => {
    mockFetchCurrentUser.mockResolvedValue(null);
    mockFetchAuthProviders.mockResolvedValue(['google']);

    render(<AccountPanel />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Continue with Google/i })).toHaveAttribute(
        'href',
        'http://localhost:3001/auth/google',
      );
    });
    expect(screen.getByRole('button', { name: /Microsoft/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Facebook/i })).toBeDisabled();
  });

  it('shows signed-in account details', async () => {
    mockFetchCurrentUser.mockResolvedValue({
      id: '1',
      email: 'ada@example.com',
      name: 'Ada Lovelace',
      provider: 'google',
      avatarUrl: null,
    });
    mockFetchAuthProviders.mockResolvedValue(['google']);

    render(<AccountPanel />);

    await waitFor(() => {
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    });
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign out/i })).toBeInTheDocument();
  });
});
