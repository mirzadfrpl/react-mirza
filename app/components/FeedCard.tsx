'use client';

import { useState, useEffect } from 'react';

type Comment = { id: number; content: string; user: { name: string; photoUrl?: string; }; };
type Reposter = { name: string; username: string; photoUrl: string; };
type PostWithCounts = {
  id: number;
  title: string;
  excerpt: string;
  coverImage: string;
  category: string;
  createdAt: Date;
  author: { name: string; username: string; photoUrl: string; };
  comments: Comment[];
  _count: { likes: number; comments: number; reposts: number; };
  likedByMe?: boolean;
  repostedByMe?: boolean;
  reposters: Reposter[];
};

export default function FeedCard({ post, isLoggedIn }: { post: PostWithCounts; isLoggedIn: boolean }) {
  const [likes, setLikes] = useState(post._count.likes);
  const [liked, setLiked] = useState(post.likedByMe);
  const [reposts, setReposts] = useState(post._count.reposts);
  const [reposted, setReposted] = useState(post.repostedByMe);
  const [comments, setComments] = useState(post.comments);
  const [commentText, setCommentText] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  
  // State untuk Modal Login
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setLikes(post._count.likes);
    setLiked(post.likedByMe);
    setReposts(post._count.reposts);
    setReposted(post.repostedByMe);
    setComments(post.comments);
  }, [post]);

  async function handleAction(action: 'like' | 'repost' | 'comment', content?: string) {
    // CEK LOGIN: Jika belum login, tampilkan modal dan hentikan proses
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    // 1. Optimistic UI (Update Instan)
    if (action === 'like') { setLiked(!liked); setLikes(liked ? likes - 1 : likes + 1); }
    if (action === 'repost') { setReposted(!reposted); setReposts(reposted ? reposts - 1 : reposts + 1); }
    if (action === 'comment') {
        if (!content?.trim()) return;
        const newComment = { id: Date.now(), content: content, user: { name: 'Anda' } };
        setComments([newComment, ...comments]);
        setCommentText('');
    }

    // 2. Sync ke Server
    await fetch('/api/post-interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, postId: post.id, content }),
    });
  }

  return (
    <>
      <style jsx global>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>

      {/* Main Card Container */}
      <article style={{ 
        marginBottom: '32px', 
        border: '1px solid #f0f0f0', 
        borderRadius: '20px', 
        padding: '24px', 
        background: '#fff', 
        maxWidth: '600px', 
        margin: '0 auto 32px auto',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
      }}>
        
        {/* Header: Author Info */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <img src={post.author.photoUrl} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} />
          <div style={{ marginLeft: '14px' }}>
             <span style={{ fontWeight: '700', fontSize: '1rem', color: '#1a1a1a', display: 'block' }}>{post.author.name}</span>
             <span style={{ fontSize: '0.85rem', color: '#71717a' }}>@{post.author.username}</span>
          </div>
        </div>

        {/* Content */}
        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '600', color: '#111' }}>{post.title}</h3>
        <p style={{ color: '#4a4a4a', marginBottom: '20px', lineHeight: '1.6' }}>{post.excerpt}</p>

        {/* Cover Image + Stacked Avatars */}
        {post.coverImage && (
          <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
            <img src={post.coverImage} style={{ width: '100%', borderRadius: '16px', minHeight: '300px', objectFit: 'cover' }} />
            
            {/* Stacked Reposter Avatars */}
            {post.reposters.length > 0 && (
              <div className="animate-float" style={{ position: 'absolute', bottom: '20px', left: '20px', display: 'flex', alignItems: 'center' }}>
                {post.reposters.slice(0, 3).map((r, i) => (
                  <div key={i} style={{ 
                    marginLeft: i > 0 ? '-15px' : '0px', 
                    zIndex: 10 - i,
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: '3px solid #fff',
                    overflow: 'hidden'
                  }}>
                    <img src={r.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
                
                <div style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', color: '#8b5cf6', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  🔄 Reposted
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div style={{ marginTop: '16px', fontSize: '0.9rem', color: '#525252', paddingBottom: '16px', borderBottom: '1px solid #f4f4f4' }}>
           <span style={{ fontWeight: '600', color: '#000' }}>{likes}</span> Likes • <span style={{ fontWeight: '600', color: '#000' }}>{comments.length}</span> Komentar • <span style={{ fontWeight: '600', color: '#000' }}>{reposts}</span> Repost
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '32px', marginTop: '16px' }}>
          <button onClick={() => handleAction('like')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: liked ? '#e11d48' : '#525252', fontWeight: '500', transition: '0.2s' }}>
            {liked ? '❤️' : '♡'} Like
          </button>
          <button onClick={() => handleAction('repost')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: reposted ? '#8b5cf6' : '#525252', fontWeight: '500', transition: '0.2s' }}>
            {reposted ? '🔁' : '🔄'} Repost
          </button>
          <button onClick={() => handleAction('comment')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', fontWeight: '500', transition: '0.2s' }}>💬 Komentar</button>
        </div>
      </article>

      {/* LOGIN WALL MODAL */}
      {showLoginModal && (
        <div onClick={() => setShowLoginModal(false)} style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(5px)', zIndex: 9999, 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ 
            background: 'white', padding: '40px', borderRadius: '20px', 
            textAlign: 'center', maxWidth: '400px', width: '90%' 
          }}>
            <h2 style={{ marginBottom: '15px' }}>Masuk untuk Melanjutkan</h2>
            <p style={{ color: '#666', marginBottom: '25px' }}>Anda harus masuk ke akun ProFeed untuk menyukai, membalas, atau melakukan repost.</p>
            
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <a href="/login" style={{ 
                background: '#000', color: '#fff', padding: '12px', 
                borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold' 
              }}>Login Sekarang</a>
              
              <button onClick={() => setShowLoginModal(false)} style={{ 
                background: 'transparent', border: 'none', cursor: 'pointer', 
                color: '#888', marginTop: '10px', textDecoration: 'underline'
              }}>Nanti saja</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Komentar (Hanya muncul jika sudah login) */}
      {commentsOpen && isLoggedIn && (
        <div onClick={() => setCommentsOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', width: '90%', maxWidth: '500px', borderRadius: '20px', height: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Komentar</h3>
              <button onClick={() => setCommentsOpen(false)} style={{ border: 'none', background: '#f5f5f5', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {comments.map((c, i) => (
                <div key={i} style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
                  <img src={c.user.photoUrl || '/default-avatar.png'} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ background: '#f4f4f4', padding: '10px 14px', borderRadius: '16px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{c.user.name}</div>
                    <div style={{ fontSize: '0.95rem' }}>{c.content}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', background: '#fff' }}>
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Tulis komentar..." style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #e5e7eb', outline: 'none' }} />
              <button onClick={() => handleAction('comment', commentText)} style={{ padding: '0 24px', background: '#000', color: '#fff', borderRadius: '24px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Kirim</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}