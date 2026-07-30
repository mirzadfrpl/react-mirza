'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type UserProfile = {
  id: number;
  username: string;
  name: string;
  headline: string;
  bio: string;
  linkedin: string;
  photoUrl: string;
};

type PostData = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  published: boolean;
};

const emptyPost: PostData = {
  id: 0,
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: 'article',
  published: true,
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [form, setForm] = useState<PostData>(emptyPost);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [userRes, postsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/posts?own=true'),
      ]);

      if (!userRes.ok) {
        router.push('/login');
        return;
      }

      const userData = await userRes.json();
      if (!userData?.user) {
        router.push('/login');
        return;
      }

      setUser(userData.user);

      if (!postsRes.ok) {
        setPosts([]);
      } else {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });

    const data = await res.json();
    if (res.ok) {
      setUser(data);
      setMessage('Profil berhasil diperbarui.');
    } else {
      setMessage(data.error || 'Terjadi kesalahan saat memperbarui profil.');
    }
  };

  const savePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const method = isEditing ? 'PATCH' : 'POST';
    const body = isEditing ? { ...form, id: form.id } : form;

    const res = await fetch('/api/posts', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      if (isEditing) {
        setPosts(posts.map((post) => (post.id === data.id ? data : post)));
      } else {
        setPosts([data, ...posts]);
      }
      setForm(emptyPost);
      setIsEditing(false);
      setMessage('Posting berhasil disimpan.');
    } else {
      setMessage(data.error || 'Gagal menyimpan posting.');
    }
  };

  const editPost = (post: PostData) => {
    setForm(post);
    setIsEditing(true);
    setMessage('');
  };

  const deletePost = async (postId: number) => {
    const res = await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    });
    const data = await res.json();
    if (res.ok) {
      setPosts(posts.filter((post) => post.id !== postId));
      setMessage('Posting berhasil dihapus.');
    } else {
      setMessage(data.error || 'Gagal menghapus posting.');
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return <main className="page"><p>Memuat dashboard…</p></main>;
  }

  const publishedCount = posts.filter((post) => post.published).length;
  const draftCount = posts.length - publishedCount;

  return (
    <main className="page dashboard-page">
      <header className="page-header page-header-admin">
        <div>
          <p className="eyebrow">Dashboard Admin</p>
          <h1>{user?.name || 'Profil Anda'}</h1>
          <div className="dashboard-stats">
            <span><strong>{posts.length}</strong> total posting</span>
            <span><strong>{publishedCount}</strong> terbit</span>
            <span><strong>{draftCount}</strong> draf</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="button tertiary" type="button" onClick={logout}>Keluar</button>
          <Link className="button" href={`/linkidn/${user?.username || ''}`}>Lihat profil</Link>
        </div>
      </header>

      {message && <div className="dashboard-toast">{message}</div>}

      <div className="dashboard-shell">
        <nav className="dashboard-nav">
          <a className="nav-item" href="#profil">Profil publik</a>
          <a className="nav-item" href="#postingan-baru">{isEditing ? 'Edit postingan' : 'Tulis baru'}</a>
          <a className="nav-item" href="#postingan-saya">Postingan saya</a>
        </nav>

        <div className="dashboard-main">
          <section id="profil" className="profile-card admin-profile-card">
            <div className="profile-photo profile-photo-large">
              <img src={user?.photoUrl} alt={user?.name} />
            </div>
            <div className="profile-info">
              <p className="eyebrow">@{user?.username}</p>
              <h2>{user?.name}</h2>
              <p className="lead">{user?.headline}</p>
              <p>{user?.bio}</p>
              <div className="hero-actions profile-actions">
                <Link className="button tertiary small" href={user?.linkedin || '#'} target="_blank" rel="noreferrer">LinkedIn</Link>
              </div>
            </div>
          </section>

          <section className="editor-panel admin-section">
            <p className="card-tag">Pengaturan</p>
            <h2>Edit profil</h2>
            <form className="form-card" onSubmit={saveProfile}>
              <label>
                Nama lengkap
                <input value={user?.name ?? ''} onChange={(event) => setUser(user ? { ...user, name: event.target.value } : null)} required />
              </label>
              <label>
                Headline profesional
                <input value={user?.headline ?? ''} onChange={(event) => setUser(user ? { ...user, headline: event.target.value } : null)} required />
              </label>
              <label>
                Tentang saya
                <textarea value={user?.bio ?? ''} onChange={(event) => setUser(user ? { ...user, bio: event.target.value } : null)} />
              </label>
              <label>
                LinkedIn
                <input value={user?.linkedin ?? ''} onChange={(event) => setUser(user ? { ...user, linkedin: event.target.value } : null)} />
              </label>
              <label>
                Foto profil URL
                <input value={user?.photoUrl ?? ''} onChange={(event) => setUser(user ? { ...user, photoUrl: event.target.value } : null)} />
              </label>
              <div className="form-actions">
                <button className="form-button" type="submit">Simpan profil</button>
              </div>
            </form>
          </section>

          <section id="postingan-baru" className="editor-panel admin-section">
            <p className="card-tag">{isEditing ? 'Sedang mengedit' : 'Cerita baru'}</p>
            <h2>{isEditing ? 'Edit postingan' : 'Tambah postingan baru'}</h2>
            <form className="form-card" onSubmit={savePost}>
              <label>
                Judul
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
              </label>
              <label>
                Slug (URL)
                <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
              </label>
              <label>
                Ringkasan
                <textarea value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} required />
              </label>
              <label>
                Konten
                <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required />
              </label>
              <label>
                Gambar sampul URL
                <input value={form.coverImage} onChange={(event) => setForm({ ...form, coverImage: event.target.value })} required />
              </label>
              <label>
                Jenis posting
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  <option value="article">Artikel</option>
                  <option value="certificate">Sertifikat</option>
                  <option value="activity">Kegiatan</option>
                  <option value="experience">Pengalaman</option>
                </select>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(event) => setForm({ ...form, published: event.target.checked })}
                />
                <span>Terbitkan langsung</span>
              </label>
              <div className="form-actions">
                <button className="form-button" type="submit">Simpan posting</button>
                <button
                  className="form-button secondary"
                  type="button"
                  onClick={() => {
                    setForm(emptyPost);
                    setIsEditing(false);
                  }}
                >
                  Batal
                </button>
              </div>
            </form>
          </section>

          <section id="postingan-saya" className="editor-panel admin-section">
            <p className="card-tag">Arsip</p>
            <h2>Postingan saya</h2>
            {posts.length ? (
              <div className="post-grid">
                {posts.map((post) => (
                  <article key={post.id} className="post-card">
                    <div className="post-head">
                      <span className="post-category">{post.category}</span>
                      {!post.published && <span className="post-draft-badge">Draf</span>}
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <div className="post-actions">
                      <button type="button" className="button tertiary small" onClick={() => editPost(post)}>Edit</button>
                      <button type="button" className="button danger small" onClick={() => deletePost(post.id)}>Hapus</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state-inline">Belum ada postingan. Tulis ceritamu yang pertama di atas.</p>
            )}
          </section>
        </div>
      </div>

      <footer className="footer">© {new Date().getFullYear()} • Dashboard</footer>
    </main>
  );
}