import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function getCurrentUser() {
  const tokenCookie = cookies().get('token');
  if (!tokenCookie?.value) return null;
  return verifyToken(tokenCookie.value);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const own = url.searchParams.get('own');

  if (own === 'true') {
    const token = getCurrentUser();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: { authorId: token.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        _count: { select: { likes: true, comments: true, reposts: true } },
      },
    });
    return NextResponse.json(posts);
  }

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: true,
      _count: { select: { likes: true, comments: true, reposts: true } },
    },
  });
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const token = getCurrentUser();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const post = await prisma.post.create({
    data: {
      authorId: token.userId,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage,
      category: data.category ?? 'article',
      published: data.published ?? true,
    },
  });

  return NextResponse.json(post);
}

export async function PATCH(request: Request) {
  const token = getCurrentUser();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  if (!data.id) {
    return NextResponse.json({ error: 'Missing post id' }, { status: 400 });
  }

  const existing = await prisma.post.findUnique({ where: { id: Number(data.id) } });
  if (!existing || existing.authorId !== token.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const updated = await prisma.post.update({
    where: { id: Number(data.id) },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage,
      category: data.category ?? existing.category,
      published: data.published,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const token = getCurrentUser();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  if (!data.id) {
    return NextResponse.json({ error: 'Missing post id' }, { status: 400 });
  }

  const existing = await prisma.post.findUnique({ where: { id: Number(data.id) } });
  if (!existing || existing.authorId !== token.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: Number(data.id) } });
  return NextResponse.json({ success: true });
}
