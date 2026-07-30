'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    headline: '',
    bio: '',
    linkedin: '',
    photoUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error || 'Pendaftaran gagal. Periksa kembali data Anda.');
      return;
    }

    router.push('/edit');
  };

  return (
    <main className="page auth-page">
      <header className="page-header">
        <Link className="nav-link" href="/">Kembali</Link>
        <p className="eyebrow">Buat akun baru</p>
      </header>

      <section className="auth-card">
        <div className="auth-header">
          <h1>Daftar</h1>
          <p>Lengkapi data singkat untuk membuat profil profesional Anda.</p>
        </div>

        <form onSubmit={submit} className="form-card">
          <label>
            Username
            <input
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
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

          <label>
            Nama lengkap
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>

          <label>
            Headline profesional
            <input
              value={form.headline}
              onChange={(event) => setForm({ ...form, headline: event.target.value })}
              required
            />
          </label>

          <label>
            Foto URL
            <input
              value={form.photoUrl}
              onChange={(event) => setForm({ ...form, photoUrl: event.target.value })}
              placeholder="https://..."
            />
          </label>

          <label>
            Profil LinkedIn
            <input
              value={form.linkedin}
              onChange={(event) => setForm({ ...form, linkedin: event.target.value })}
              placeholder="https://linkedin.com/in/username"
            />
          </label>

          <label>
            Tentang saya
            <textarea
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button className="form-button" type="submit" disabled={loading}>{loading ? 'Memproses…' : 'Daftar'}</button>
          </div>
        </form>

        <p className="auth-note">
          Sudah punya akun? <Link href="/login">Masuk di sini</Link>
        </p>
      </section>
    </main>
  );
}
