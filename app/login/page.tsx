'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.identifier.includes('@') ? undefined : form.identifier,
        email: form.identifier.includes('@') ? form.identifier : undefined,
        password: form.password,
      }),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error || 'Login gagal. Periksa kembali data Anda.');
      return;
    }

    router.push('/edit');
  };

  return (
    <main className="page auth-page">
      <header className="page-header">
        <Link className="nav-link" href="/">Kembali</Link>
        <p className="eyebrow">Masuk ke jaringan profesional baru</p>
      </header>

      <section className="auth-card">
        <div className="auth-header">
          <h1>Masuk</h1>
          <p>Gunakan email atau username Anda untuk masuk ke dashboard dan profil.</p>
        </div>

        <button className="button google-button" type="button" onClick={() => alert('Google login akan tersedia segera.')}>Masuk dengan Google</button>

        <div className="divider"><span>atau</span></div>

        <form onSubmit={submit} className="form-card">
          <label>
            Email atau username
            <input
              value={form.identifier}
              onChange={(event) => setForm({ ...form, identifier: event.target.value })}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button className="form-button" type="submit" disabled={loading}>{loading ? 'Memproses…' : 'Masuk'}</button>
          </div>
        </form>

        <p className="auth-note">
          Belum punya akun? <Link href="/register">Daftar sekarang</Link>
        </p>
      </section>
    </main>
  );
}
