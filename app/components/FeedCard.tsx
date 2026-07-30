'use client';

import Link from 'next/link';
import { useState } from 'react';

type Comment = {
  id: number;
  content: string;
  createdAt: string | Date;
  user: {
    name: string;
  };
};

type PostWithCounts = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  createdAt: string | Date;
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
  likedByMe: boolean;
};

type Props = {
  post: PostWithCounts;
};

export default function FeedCard({ post }: Props) {
  const [likes, setLikes] = useState(post._count.likes);
  const [liked, setLiked] = useState(post.likedByMe);
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [reposts, setReposts] = useState(post._count.reposts);
  const [commentText, setCommentText] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  async function handleAction(action: 'like' | 'comment' | 'repost') {
    if (action === 'comment' && !commentText.trim()) {
      setStatus('Tulis komentar terlebih dahulu.');
      return;
    }
    setLoading(true);
    setStatus('');
    
    const body: Record<string, unknown> = {
      action,
      postId: post.id,
    };
    if (action === 'comment') {
      body.content = commentText.trim();
    }
    
    const response = await fetch('/api/post-interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setLoading(false);
    
    if (!response.ok) {
      setStatus(data.error || 'Terjadi masalah saat berinteraksi.');
      return;
    }
    
    if (action === 'like') {
      setLikes(data.count);
      setLiked(Boolean(data.liked));
      setStatus(data.liked ? 'Posting disukai.' : 'Like dihapus.');
    } else if (action === 'repost') {
      setReposts(data.count);
      setStatus('Berhasil posting ulang.');
    } else if (action === 'comment') {
      if (typeof data.comment === 'object') {
        setComments([data.comment as Comment, ...comments]);
      }
      setCommentText('');
      setCommentsOpen(true);
      setStatus('Komentar terkirim.');
    }
  }

  return (
    <article className="feed-card">
      <div className="feed-summary">
        <div className="post-head">
          <div>
            <Link className="author-name" href={`/linkidn/${post.author.username}`}>{post.author.name}</Link>
            <p className="author-headline">{post.author.headline}</p>
          </div>
          <span className="post-category">{post.category}</span>
        </div>
        <div className="feed-preview">
          <h3>{post.title}</h3>
          <p>{post.excerpt}</p>
          {post.coverImage ? (
            <img className="feed-card-image" src={post.coverImage} alt={post.title} />
          ) : null}
        </div>
        <div className="feed-meta">
          <time dateTime={String(post.createdAt)}>{new Date(post.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
          <span>{likes} like • {comments.length} komentar • {reposts} repost</span>
        </div>
        <div className="feed-actions">
          <button
            className={`reaction-button like-button ${liked ? 'liked' : ''}`}
            type="button"
            onClick={() => handleAction('like')}
            disabled={loading}
          >
            <span className="heart-icon">{liked ? '♥' : '♡'}</span>
            {liked ? 'Liked' : 'Like'}
          </button>
          <button className="reaction-button secondary" type="button" onClick={() => handleAction('repost')} disabled={loading}>Repost</button>
          <button className="reaction-button secondary" type="button" onClick={() => setCommentsOpen(!commentsOpen)}>{commentsOpen ? 'Tutup' : 'Komentar'}</button>
          <Link className="button tertiary small" style={{ marginLeft: 'auto' }} href={`/blog/${post.slug}`}>Baca</Link>
        </div>
      </div>
      
      {commentsOpen ? (
        <aside className="feed-comment-column">
          <div className="comments-header">
            <h4>Komentar</h4>
            <p>{comments.length} terbaru</p>
          </div>
          <div className="comment-list">
            {comments.length ? (
              comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <strong>{comment.user.name}</strong>
                  <p>{comment.content}</p>
                  <small>{new Date(comment.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</small>
                </div>
              ))
            ) : (
              <p className="comment-empty">Belum ada komentar. Jadilah yang pertama menulis.</p>
            )}
          </div>
          <div className="comment-form">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Tambahkan komentar..."
              disabled={loading}
            />
            <button className="reaction-button ghost" type="button" onClick={() => handleAction('comment')} disabled={loading}>Kirim</button>
          </div>
          {status ? <p className="comment-instruction">{status}</p> : null}
        </aside>
      ) : null}
    </article>
  );
}