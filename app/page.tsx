import { cookies } from 'next/headers';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import FeedCard from './components/FeedCard';
import Sidebar from './components/Sidebar';

type Comment = {
  id: number;
  content: string;
  createdAt: Date;
  user: { name: string };
};

type PostWithCounts = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  createdAt: Date;
  author: {
    name: string;
    username: string;
    headline: string;
    photoUrl: string;
  };
  comments: Comment[];
  _count: {
    likes: number;
    comments: number;
    reposts: number;
  };
  likedByMe?: boolean; // Tanda tanya (?) ditambahkan agar opsional saat query dari Prisma
};

type CurrentUser = {
  id: number;
  username: string;
  name: string;
  headline: string;
  photoUrl: string;
  followers: { followerId: number }[];
  following: { followingId: number }[];
};

export default async function HomePage() {
  const token = cookies().get('token')?.value;
  const payload = verifyToken(token);
  
  const currentUser = payload
    ? await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          followers: { select: { followerId: true } },
          following: { select: { followingId: true } },
        },
      })
    : null;
    
  // Ditambahkan tipe secara eksplisit pada item agar tidak terkena error 'any'
  const followingIds = currentUser?.following.map((item: { followingId: number }) => item.followingId) ?? [];
  const onlyFollowed = currentUser && followingIds.length > 0;
  
  const posts = await prisma.post.findMany({
    where: onlyFollowed
      ? { published: true, authorId: { in: followingIds } }
      : { published: true },
    orderBy: { createdAt: 'desc' },
    include: {
      author: true,
      comments: { include: { user: true }, orderBy: { createdAt: 'desc' }, take: 3 },
      _count: { select: { likes: true, comments: true, reposts: true } },
      ...(currentUser ? { likes: { where: { userId: currentUser.id }, select: { id: true } } } : {}),
    },
    take: 10,
  }) as Array<PostWithCounts & { likes?: { id: number }[] }>;
  
  const feedLabel = onlyFollowed
    ? 'Postingan dari akun yang kamu ikuti'
    : 'Postingan profesional terbaru';
  const feedSubtitle = onlyFollowed
    ? 'Menampilkan update dari akun yang Anda follow.'
    : 'Follow akun untuk mempersonalisasi FYP Anda.';
    
  return (
    <main className="page layout-shell">
      <aside className="left-sidebar">
        {currentUser ? (
          <>
            <div className="sidebar-profile-card">
              <div className="profile-avatar">
                <img src={currentUser.photoUrl} alt={currentUser.name} />
              </div>
              <div>
                <p className="eyebrow">Selamat datang</p>
                <h2>{currentUser.name}</h2>
                <p className="sidebar-subtitle">@{currentUser.username}</p>
                <p className="sidebar-note">{currentUser.headline}</p>
                <div className="follow-summary">
                  <span>{currentUser.followers.length} pengikut</span>
                  <span>{currentUser.following.length} mengikuti</span>
                </div>
                <Link className="button tertiary small" href={`/linkidn/${currentUser.username}`}>
                  Lihat profil
                </Link>
              </div>
            </div>
            <nav className="sidebar-nav">
              <Link className="nav-item active" href="/">Home</Link>
              <Link className="nav-item" href="/explore">Explore</Link>
              <Link className="nav-item" href="/edit">Dashboard Admin</Link>
            </nav>
          </>
        ) : (
          <>
            <div className="branding-card">
              <p className="eyebrow">ProFeed</p>
              <h2>Jaringan profesional yang lebih ramai.</h2>
              <p>Posting, komentar, dan repost dengan pengalaman seperti social media profesional.</p>
            </div>
            <nav className="sidebar-nav">
              <Link className="nav-item active" href="/">Home</Link>
              <Link className="nav-item" href="/explore">Explore</Link>
            </nav>
            <div className="sidebar-actions sidebar-left-actions">
              <Link className="button" href="/login">Masuk</Link>
              <Link className="button secondary" href="/register">Daftar</Link>
            </div>
          </>
        )}
      </aside>
      <section className="main-column">
        <header className="main-header">
          <div>
            <p className="eyebrow">Home</p>
            <h1>{feedLabel}</h1>
            <p className="lead smaller">{feedSubtitle}</p>
          </div>
          <Link className="button tertiary" href="/explore">Cari akun & hashtag</Link>
        </header>
        <div className="feed-list">
          {posts.map((post: PostWithCounts & { likes?: { id: number }[] }) => (
            <FeedCard
              key={post.id}
              post={{
                ...post,
                likedByMe: Boolean(post.likes?.length),
              }}
            />
          ))}
        </div>
      </section>
      <Sidebar />
    </main>
  );
}