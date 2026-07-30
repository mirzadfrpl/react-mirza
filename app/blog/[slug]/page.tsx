import { prisma } from '@/lib/prisma';
import Link from 'next/link';

type Params = { params: { slug: string } };

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({ where: { published: true } });
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: Params) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: {
      author: true,
      comments: { include: { user: true }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!post) {
    return (
      <main className="page">
        <p>Posting tidak ditemukan.</p>
      </main>
    );
  }

  // Sidebar content: lainnya dari penulis yang sama + posting terkait berdasarkan kategori
  const [moreFromAuthor, relatedPosts] = await Promise.all([
    prisma.post.findMany({
      where: { published: true, authorId: post.authorId, id: { not: post.id } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.post.findMany({
      where: { published: true, category: post.category, id: { not: post.id } },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ]);

  const readingMinutes = Math.max(1, Math.round(post.content.split(/\s+/).length / 200));
  const authorInitials = post.author.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <main className="page blog-page">
      <header className="page-header">
        <Link className="nav-link" href="/explore">← Kembali ke Explore</Link>
        <p className="eyebrow">Posting Profesional</p>
      </header>

      <div className="home-grid blog-layout">
        <article className="blog-card">
          <div className="article-header">
            <p className="article-meta">
              {post.category} · {new Date(post.createdAt).getFullYear()} · {readingMinutes} menit baca
            </p>
            <h1>{post.title}</h1>
          </div>

          <img src={post.coverImage} alt={post.title} className="article-cover" />

          <div className="article-author">
            <div className="author-card no-avatar">
              <div>
                <h3>{post.author.name}</h3>
                <p className="author-headline">{post.author.headline}</p>
                <div className="author-actions">
                  <Link className="button secondary" href={`/linkidn/${post.author.username}`}>
                    Lihat profil
                  </Link>
                  <Link className="button tertiary" href={post.author.linkedin ?? '#'} target="_blank" rel="noreferrer">
                    LinkedIn
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="article-body">
            <p>{post.content}</p>
          </div>

          <section className="comment-list-block">
            <div className="comments-header">
              <p className="card-tag">Komentar</p>
              <h2>{post.comments.length} komentar terbaru</h2>
            </div>
            <div className="comment-list">
              {post.comments.length ? (
                post.comments.map((comment) => (
                  <article key={comment.id} className="comment-item">
                    <strong>{comment.user.name}</strong>
                    <p>{comment.content}</p>
                    <small>
                      {new Date(comment.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </small>
                  </article>
                ))
              ) : (
                <p className="comment-empty">Belum ada komentar di posting ini.</p>
              )}
            </div>
          </section>
        </article>

        <aside className="right-sidebar blog-sidebar">
          <div className="sidebar-card sidebar-profile-card">
            <div className="profile-avatar avatar-fallback">{authorInitials}</div>
            <div>
              <h3>{post.author.name}</h3>
              <p className="sidebar-subtitle">{post.author.headline}</p>
            </div>
            <div className="profile-actions">
              <Link className="button secondary" href={`/linkidn/${post.author.username}`}>
                Lihat profil
              </Link>
              <Link className="button tertiary" href={post.author.linkedin ?? '#'} target="_blank" rel="noreferrer">
                LinkedIn
              </Link>
            </div>
          </div>

          {moreFromAuthor.length > 0 && (
            <div className="sidebar-card">
              <div className="sidebar-header">
                <p className="card-tag">Lainnya dari {post.author.name}</p>
              </div>
              <ul className="related-list">
                {moreFromAuthor.map((item) => (
                  <li key={item.id}>
                    <Link href={`/blog/${item.slug}`}>
                      <strong>{item.title}</strong>
                      <span className="related-meta">{new Date(item.createdAt).getFullYear()}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relatedPosts.length > 0 && (
            <div className="sidebar-card">
              <div className="sidebar-header">
                <p className="card-tag">Baca juga · {post.category}</p>
              </div>
              <ul className="related-list">
                {relatedPosts.map((item) => (
                  <li key={item.id}>
                    <Link href={`/blog/${item.slug}`}>
                      <strong>{item.title}</strong>
                      <span className="related-meta">{new Date(item.createdAt).getFullYear()}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <footer className="footer">© {new Date().getFullYear()} • Blog Post</footer>
    </main>
  );
}