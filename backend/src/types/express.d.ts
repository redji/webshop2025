declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      name?: string | null;
      provider?: string;
      providerId?: string;
      avatarUrl?: string | null;
    }
  }
}

export {};
