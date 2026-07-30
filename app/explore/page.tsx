import { prisma } from '@/lib/prisma';
import Link from 'next/link';

type Params = { searchParams: { q?: string } };

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default async function ExplorePage({ searchParams }: Params) {
  const query = String(searchParams.q ?? '').trim();

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { excerpt: { contains: query } },
              { content: { contains: query } },
              { category: { contains: query } },
              { author: { name: { contains: query } } },
            ],
          }
        : undefined),
    },
    orderBy: { createdAt: 'desc' },
    include: { author: true },
    take: 20,
  });

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { username: { contains: query } },
            { name: { contains: query } },
            { headline: { contains: query } },
          ],
        }
      : {},
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  return (
    <main className="page explore-shell">
      <header className="page-header explore-header">
        <div>
          <p className="eyebrow">Explore</p>
          <h1>Temukan akun, postingan, dan hashtag profesional.</h1>
        </div>
        <Link className="button tertiary" href="/">Kembali ke beranda</Link>
      </header>

      <section className="feature-block search-block">
        <form className="search-form" action="/explore" method="get">
          <input name="q" defaultValue={query} placeholder="Cari akun atau postingan dengan hashtag..." />
          <button className="button" type="submit">Cari</button>
        </form>
        <p>Gunakan kata kunci, username, atau hashtag untuk menemukan konten profesional.</p>
      </section>

      <section className="explore-results">
        <div className="explore-block">
          <div className="block-header">
            <p className="card-tag">Akun</p>
            <h2>{query ? `Hasil akun untuk “${query}”` : 'Akun terbaru'}</h2>
          </div>

          {users.length ? (
            <div className="explore-grid explore-grid-users">
              {users.map((user) => (
                <article key={user.id} className="explore-card explore-user-card">
                  <div className="explore-avatar">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt={user.name} />
                    ) : (
                      <span className="avatar-fallback">{initials(user.name)}</span>
                    )}
                  </div>
                  <div className="explore-user-info">
                    <h3>{user.name}</h3>
                    <p className="explore-username">@{user.username}</p>
                    <p className="explore-headline">{user.headline}</p>
                  </div>
                  <Link className="button tertiary small" href={`/linkidn/${user.username}`}>Lihat profil</Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state-inline">Tidak ada akun yang cocok dengan pencarianmu.</p>
          )}
        </div>

        <div className="explore-block">
          <div className="block-header">
            <p className="card-tag">Postingan</p>
            <h2>{query ? `Hasil posting untuk “${query}”` : 'Postingan terbaru'}</h2>
          </div>

          {posts.length ? (
            <div className="explore-grid explore-grid-posts">
              {posts.map((post) => (
                <article key={post.id} className="explore-card explore-post-card">
                  <Link href={`/blog/${post.slug}`} className="explore-thumb">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt={post.title} />
                    ) : (
                      <span className="explore-thumb-fallback">{initials(post.title)}</span>
                    )}
                    {post.category && <span className="explore-category-badge">{post.category}</span>}
                  </Link>

                  <div className="explore-post-body">
                    <div className="explore-author-row">
                      <span className="avatar-fallback avatar-xs">{initials(post.author.name)}</span>
                      <span className="explore-author-name">{post.author.name}</span>
                    </div>
                    <Link href={`/blog/${post.slug}`}>
                      <h3>{post.title}</h3>
                    </Link>
                    <p>{post.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state-inline">Tidak ada postingan yang cocok dengan pencarianmu.</p>
          )}
        </div>
      </section>

      <footer className="footer">© {new Date().getFullYear()} • Explore</footer>
    </main>
  );
}