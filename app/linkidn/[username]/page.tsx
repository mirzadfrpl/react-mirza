import { cookies } from 'next/headers';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import FollowButton from '../../components/FollowButton';

type Props = { 
  params: { username: string };
  searchParams: { tab?: string }; 
};

export async function generateStaticParams() {
  const users = await prisma.user.findMany({ select: { username: true } });
  return users.map((user) => ({ username: user.username }));
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const token = cookies().get('token')?.value;
  const payload = verifyToken(token);
  const currentUserId = payload?.userId;

  const activeTab = searchParams.tab === 'reposts' ? 'reposts' : 'posts';

  // 1. Update query Prisma untuk menarik data 'author' dari postingan asli
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: { 
      posts: { orderBy: { createdAt: 'desc' } },
      reposts: { 
        include: { 
          post: {
            include: {
              author: true // Tarik data penulis aslinya di sini
            }
          } 
        },
        orderBy: { createdAt: 'desc' } 
      }
    },
  });

  if (!user) {
    return (
      <main className="page">
        <p>Profil tidak ditemukan.</p>
      </main>
    );
  }

  const followersCount = await prisma.follow.count({ where: { followingId: user.id } });
  const followingCount = await prisma.follow.count({ where: { followerId: user.id } });
  const isOwnProfile = currentUserId === user.id;
  const isFollowing = currentUserId && !isOwnProfile
    ? Boolean(
        await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: user.id,
            },
          },
        }),
      )
    : false;

  return (
    <main className="page profile-page">
      <header className="page-header">
        <Link className="nav-link" href="/">← Kembali ke beranda</Link>
        <p className="eyebrow">Profil profesional</p>
      </header>

      <section className="profile-page-card">
        <div className="profile-banner" />
        <div className="profile-card">
          <div className="profile-photo profile-photo-large">
            <img src={user.photoUrl || '/default-avatar.png'} alt={user.name} />
          </div>
          <div className="profile-info">
            <p className="eyebrow">@{user.username}</p>
            <h1>{user.name}</h1>
            <p className="lead">{user.headline}</p>
            {user.bio && <p className="profile-bio">{user.bio}</p>}
            <div className="profile-counts">
              <span><strong>{user.posts.length}</strong> postingan</span>
              <span><strong>{followersCount}</strong> pengikut</span>
              <span><strong>{followingCount}</strong> mengikuti</span>
            </div>
            <div className="profile-actions">
              {user.linkedin && (
                <Link className="button" href={user.linkedin} target="_blank" rel="noreferrer">
                  Kunjungi LinkedIn
                </Link>
              )}
              {isOwnProfile ? (
                <Link className="button secondary" href="/edit">Edit profil</Link>
              ) : currentUserId ? (
                <FollowButton targetUserId={user.id} initiallyFollowing={isFollowing} />
              ) : (
                <Link className="button secondary" href="/login">Masuk untuk follow</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="feature-block">
        <p className="card-tag">Aktivitas</p>
        <h2>Postingan dan pengalaman terbaru</h2>
        <p>Profil ini menampilkan cerita, aktivitas, dan pembaruan profesional yang dipublikasikan oleh pengguna.</p>
        
        {/* 2. Perbaikan URL href dari /profile menjadi /linkidn */}
        <div className="profile-tabs" style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', borderBottom: '1px solid var(--border-color, #eaeaea)' }}>
          <Link 
            href={`/linkidn/${user.username}?tab=posts`} 
            style={{ 
              paddingBottom: '0.75rem', 
              fontWeight: activeTab === 'posts' ? '600' : '400',
              borderBottom: activeTab === 'posts' ? '2px solid var(--text-color, #111)' : '2px solid transparent',
              color: activeTab === 'posts' ? 'var(--text-color, #111)' : 'var(--text-muted, #666)'
            }}
          >
            Postingan
          </Link>
          <Link 
            href={`/linkidn/${user.username}?tab=reposts`}
            style={{ 
              paddingBottom: '0.75rem', 
              fontWeight: activeTab === 'reposts' ? '600' : '400',
              borderBottom: activeTab === 'reposts' ? '2px solid var(--text-color, #111)' : '2px solid transparent',
              color: activeTab === 'reposts' ? 'var(--text-color, #111)' : 'var(--text-muted, #666)'
            }}
          >
            Repost
          </Link>
        </div>
      </section>

      {activeTab === 'posts' ? (
        // --- TAMPILAN TAB POSTS ---
        user.posts.length > 0 ? (
          <section className="feed-grid profile-posts">
            {user.posts.map((post) => (
              <article key={post.id} className="post-card">
                <div className="post-head">
                  <span className="post-category">{post.category}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="post-meta">
                  <Link className="button tertiary small" href={`/blog/${post.slug}`}>Baca</Link>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="empty-state">
            <p>{isOwnProfile ? 'Kamu belum punya postingan. Yuk mulai tulis yang pertama.' : `${user.name} belum punya postingan.`}</p>
          </section>
        )
      ) : (
        // --- TAMPILAN TAB REPOSTS ---
        user.reposts && user.reposts.length > 0 ? (
          <section className="feed-grid profile-posts">
            {user.reposts.map((repost) => (
              // 3. UI Wrapper baru untuk Repost
              <article key={repost.id} className="post-card" style={{ border: '1px solid var(--border-color, #eaeaea)', borderRadius: '8px', padding: '1.2rem', gap: '1rem', display: 'flex', flexDirection: 'column' }}>
                
                {/* Indikator akun yang merepost */}
                <div className="repost-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted, #666)', fontSize: '0.85rem' }}>
                  <span>🔄</span>
                  <span><strong>{user.name}</strong> merepost postingan ini</span>
                </div>

                {/* Box postingan asli */}
                <div className="original-post-box" style={{ border: '1px solid var(--border-color, #eaeaea)', borderRadius: '6px', padding: '1rem', backgroundColor: 'var(--bg-secondary, #fafafa)' }}>
                  
                  {/* Info Penulis Asli */}
                  <div className="original-author-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Link href={`/linkidn/${repost.post.author.username}`} style={{ fontWeight: '600', color: 'var(--text-color, #111)', textDecoration: 'none' }}>
                        {repost.post.author.name}
                      </Link>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #666)' }}>
                        @{repost.post.author.username}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #666)' }}>
                      {new Date(repost.post.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  {/* Konten Teks Asli */}
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{repost.post.title}</h3>
                  <p style={{ margin: '0' }}>{repost.post.excerpt}</p>
                  
                  <div className="post-meta" style={{ marginTop: '1rem' }}>
                    <Link className="button tertiary small" href={`/blog/${repost.post.slug}`}>Baca Postingan Asli</Link>
                  </div>
                </div>

              </article>
            ))}
          </section>
        ) : (
          <section className="empty-state">
            <p>{isOwnProfile ? 'Kamu belum merepost apapun.' : `${user.name} belum merepost apapun.`}</p>
          </section>
        )
      )}

      <footer className="footer">© {new Date().getFullYear()} • Profil {user.username}</footer>
    </main>
  );
}