import { cookies } from 'next/headers';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import FeedCard from './components/FeedCard';
import Sidebar from './components/Sidebar';

// Tipe Data
type Reposter = {
  id: number;
  name: string;
  username: string;
  photoUrl: string;
};

type PostWithCounts = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  createdAt: Date;
  author: { id: number; name: string; username: string; headline: string; photoUrl: string; };
  comments: any[];
  _count: { likes: number; comments: number; reposts: number; };
  likedByMe?: boolean;
  repostedByMe?: boolean;
  reposters: Reposter[]; // Dibuat menjadi Array
};

export default async function HomePage() {
  const token = cookies().get('token')?.value;
  const payload = verifyToken(token);
  
  const currentUser = payload ? await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { followers: { select: { followerId: true } }, following: { select: { followingId: true } } }
  }) : null;
    
  const followingIds = currentUser?.following.map((i: any) => i.followingId) ?? [];
  const isLoggedIn = Boolean(currentUser);
  
  // 1. Ambil Postingan
  const rawPosts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    include: {
      author: true,
      comments: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      _count: { select: { likes: true, comments: true, reposts: true } },
      ...(currentUser ? { 
        likes: { where: { userId: currentUser.id }, select: { id: true } },
        reposts: { where: { userId: currentUser.id }, select: { id: true } }
      } : {}),
    },
    take: 30,
  });

  // 2. Ambil Semua Repost untuk dikelompokkan
  const rawReposts = await prisma.repost.findMany({
    where: { post: { published: true } },
    include: { user: true }
  });

  // 3. Grouping: Masukkan reposter ke dalam Map berdasarkan postId
  const repostMap = new Map<number, Reposter[]>();
  rawReposts.forEach((r) => {
    if (!repostMap.has(r.postId)) repostMap.set(r.postId, []);
    repostMap.get(r.postId)!.push(r.user);
  });

  // 4. Transform data: Gabungkan reposter ke dalam postingan
  const finalPosts = rawPosts.map((post) => ({
    ...post,
    reposters: repostMap.get(post.id) || [],
    likedByMe: Boolean(post.likes?.length),
    repostedByMe: Boolean(post.reposts?.length),
  }));

  // Sortir: Utamakan postingan yang di-follow
  finalPosts.sort((a, b) => {
    const aIsFollowed = isLoggedIn ? followingIds.includes(a.author.id) : false;
    const bIsFollowed = isLoggedIn ? followingIds.includes(b.author.id) : false;
    if (aIsFollowed && !bIsFollowed) return -1;
    if (!aIsFollowed && bIsFollowed) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <main className="page layout-shell">
      <aside className="left-sidebar">
        {currentUser ? (
          <>
            <div className="sidebar-profile-card">
              <div className="profile-avatar"><img src={currentUser.photoUrl} alt={currentUser.name} /></div>
              <h2>{currentUser.name}</h2>
              <p>@{currentUser.username}</p>
              <Link className="button tertiary small" href={`/linkidn/${currentUser.username}`}>Lihat profil</Link>
            </div>
            <nav className="sidebar-nav">
              <Link className="nav-item active" href="/">Home</Link>
              <Link className="nav-item" href="/explore">Explore</Link>
            </nav>
          </>
        ) : (
          <div className="branding-card"><h2>ProFeed</h2><p>Jaringan profesional.</p></div>
        )}
      </aside>

      <section className="main-column">
        <header className="main-header">
          <h1>Untuk Anda</h1>
        </header>
        
        <div className="feed-list">
          {finalPosts.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </div>
      </section>
      <Sidebar />
    </main>
  );
}