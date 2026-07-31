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

  // --- Styles Constants ---
  // Font akan otomatis mengikuti globals.css karena tidak lagi didefinisikan secara eksplisit di sini
  const style = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '0 20px' },
    header: { padding: '40px 0', borderBottom: '1px solid #eee', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    grid: { display: 'grid', gridTemplateColumns: '250px 1fr', gap: '60px' },
    nav: { display: 'flex', flexDirection: 'column' as const, gap: '15px', position: 'sticky' as const, top: '40px' },
    section: { marginBottom: '60px' },
    card: { border: '1px solid #eee', padding: '30px', borderRadius: '8px', backgroundColor: '#fff' },
    input: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '20px', fontSize: '16px' },
    button: { padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: '0.2s' },
    avatar: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' as const, border: '1px solid #eee' }
  };

  useEffect(() => {
    async function loadData() {
      const [userRes, postsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/posts?own=true'),
      ]);

      if (!userRes.ok) { router.push('/login'); return; }
      const userData = await userRes.json();
      if (!userData?.user) { router.push('/login'); return; }

      setUser(userData.user);
      if (!postsRes.ok) { setPosts([]); } else { const postsData = await postsRes.json(); setPosts(postsData); }
      setLoading(false);
    }
    loadData();
  }, [router]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const res = await fetch('/api/auth/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
    const data = await res.json();
    if (res.ok) { setUser(data); setMessage('Profil diperbarui.'); setTimeout(() => setMessage(''), 3000); }
    else { setMessage(data.error || 'Gagal.'); }
  };

  const savePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const method = isEditing ? 'PATCH' : 'POST';
    const body = isEditing ? { ...form, id: form.id } : form;
    const res = await fetch('/api/posts', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) {
      if (isEditing) { setPosts(posts.map((post) => (post.id === data.id ? data : post))); }
      else { setPosts([data, ...posts]); }
      setForm(emptyPost); setIsEditing(false); setMessage('Postingan disimpan.'); setTimeout(() => setMessage(''), 3000);
    } else { setMessage(data.error || 'Gagal.'); }
  };

  const editPost = (post: PostData) => { setForm(post); setIsEditing(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const deletePost = async (postId: number) => {
    const res = await fetch('/api/posts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: postId }) });
    if (res.ok) { setPosts(posts.filter((post) => post.id !== postId)); setMessage('Postingan dihapus.'); }
  };

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); };

  if (loading) return <main style={{ padding: '50px', textAlign: 'center' }}>Memuat dashboard…</main>;

  return (
    <main style={style.container}>
      <header style={style.header}>
        <div>
          <p style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>Dashboard Admin</p>
          <h1 style={{ fontSize: '32px', margin: '5px 0' }}>{user?.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ ...style.button, backgroundColor: '#f0f0f0' }} onClick={logout}>Keluar</button>
          <Link style={{ ...style.button, backgroundColor: '#000', color: '#fff' }} href={`/linkidn/${user?.username || ''}`}>Lihat Profil</Link>
        </div>
      </header>

      {message && <div style={{ padding: '15px', backgroundColor: '#e8f5e9', color: '#2e7d32', marginBottom: '20px', borderRadius: '4px' }}>{message}</div>}

      <div style={style.grid}>
        <nav style={style.nav}>
          <a href="#profil" style={{ textDecoration: 'none', color: '#000', fontWeight: 600 }}>Profil Publik</a>
          <a href="#postingan-baru" style={{ textDecoration: 'none', color: '#666' }}>{isEditing ? 'Edit Postingan' : 'Tulis Baru'}</a>
          <a href="#postingan-saya" style={{ textDecoration: 'none', color: '#666' }}>Postingan Saya</a>
        </nav>

        <div>
          <section id="profil" style={style.section}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Edit Profil</h2>
            <div style={style.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                <img src={user?.photoUrl || '/avatar.png'} alt="Profil" style={style.avatar} />
                <div>
                   <h3 style={{ margin: 0 }}>{user?.name}</h3>
                   <p style={{ color: '#666', fontSize: '14px' }}>@{user?.username}</p>
                </div>
              </div>
              <form onSubmit={saveProfile}>
                <label>Nama Lengkap</label>
                <input style={style.input} value={user?.name ?? ''} onChange={(e) => setUser(user ? { ...user, name: e.target.value } : null)} required />
                <label>Headline</label>
                <input style={style.input} value={user?.headline ?? ''} onChange={(e) => setUser(user ? { ...user, headline: e.target.value } : null)} required />
                <label>Tentang Saya</label>
                <textarea style={{ ...style.input, height: '100px' }} value={user?.bio ?? ''} onChange={(e) => setUser(user ? { ...user, bio: e.target.value } : null)} />
                <label>LinkedIn URL</label>
                <input style={style.input} value={user?.linkedin ?? ''} onChange={(e) => setUser(user ? { ...user, linkedin: e.target.value } : null)} />
                <label>Foto Profil (URL)</label>
                <input style={style.input} value={user?.photoUrl ?? ''} onChange={(e) => setUser(user ? { ...user, photoUrl: e.target.value } : null)} />
                <button style={{ ...style.button, backgroundColor: '#000', color: '#fff' }} type="submit">Simpan Profil</button>
              </form>
            </div>
          </section>

          <section id="postingan-baru" style={style.section}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>{isEditing ? 'Edit Postingan' : 'Tambah Postingan Baru'}</h2>
            <div style={style.card}>
              <form onSubmit={savePost}>
                <label>Judul</label>
                <input style={style.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <label>Slug (URL)</label>
                <input style={style.input} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
                <label>Ringkasan</label>
                <textarea style={{ ...style.input, height: '80px' }} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required />
                <label>Konten</label>
                <textarea style={{ ...style.input, height: '200px' }} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
                <label>Gambar Sampul (URL)</label>
                <input style={style.input} value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} required />
                <label>Jenis Posting</label>
                <select style={style.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="article">Artikel</option>
                  <option value="certificate">Sertifikat</option>
                  <option value="activity">Kegiatan</option>
                  <option value="experience">Pengalaman</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                  Terbitkan Sekarang
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ ...style.button, backgroundColor: '#000', color: '#fff' }} type="submit">Simpan</button>
                  <button style={{ ...style.button, backgroundColor: '#f0f0f0' }} type="button" onClick={() => { setForm(emptyPost); setIsEditing(false); }}>Batal</button>
                </div>
              </form>
            </div>
          </section>

          <section id="postingan-saya" style={style.section}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Postingan Saya ({posts.length})</h2>
            {posts.map((post) => (
              <div key={post.id} style={{ ...style.card, marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{post.title}</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{post.category} • {post.published ? 'Diterbitkan' : 'Draf'}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ ...style.button, backgroundColor: '#f0f0f0' }} onClick={() => editPost(post)}>Edit</button>
                  <button style={{ ...style.button, backgroundColor: '#ffebee', color: '#c62828' }} onClick={() => deletePost(post.id)}>Hapus</button>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
      <footer style={{ padding: '40px 0', textAlign: 'center', color: '#888', fontSize: '14px' }}>
        © {new Date().getFullYear()} Dashboard Profesional
      </footer>
    </main>
  );
}