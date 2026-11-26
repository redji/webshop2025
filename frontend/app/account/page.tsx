import { AccountPanel } from '@/components/AccountPanel';

export const dynamic = 'force-dynamic';

export default function AccountPage() {
  return (
    <main>
      <header className="hero hero-compact">
        <p className="eyebrow">Webshop 2025</p>
        <h1>Account</h1>
        <p className="lede">
          Sign in with a social provider to see your profile and manage your session.
        </p>
      </header>

      <section aria-labelledby="account-heading">
        <h2 id="account-heading" className="section-title">
          Your session
        </h2>
        <AccountPanel />
      </section>
    </main>
  );
}
