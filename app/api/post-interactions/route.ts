import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

type TokenData = { userId: number } | null;

function getCurrentUser(): TokenData {
  const tokenCookie = cookies().get('token');
  if (!tokenCookie?.value) return null;
  return verifyToken(tokenCookie.value);
}

export async function POST(request: Request) {
  const token = getCurrentUser();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const action = data.action as string | undefined;
  const postId = Number(data.postId ?? 0);

  if (!action || !postId) {
    return NextResponse.json({ error: 'Action dan postId diperlukan.' }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: 'Posting tidak ditemukan.' }, { status: 404 });
  }

  if (action === 'like') {
    const existing = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: token.userId,
        },
      },
    });

    let liked = false;
    if (existing) {
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId: token.userId,
          },
        },
      });
    } else {
      await prisma.like.create({
        data: {
          postId,
          userId: token.userId,
        },
      });
      liked = true;
    }

    const count = await prisma.like.count({ where: { postId } });
    
    // Hapus cache menyeluruh
    revalidatePath('/', 'layout');
    
    return NextResponse.json({ action, count, liked });
  }

  if (action === 'repost') {
    const existing = await prisma.repost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: token.userId,
        },
      },
    });

    let reposted = false;
    
    // Logika Toggle: Hapus jika sudah ada, Buat jika belum ada
    if (existing) {
      await prisma.repost.delete({
        where: {
          postId_userId: {
            postId,
            userId: token.userId,
          },
        },
      });
    } else {
      await prisma.repost.create({
        data: {
          postId,
          userId: token.userId,
        },
      });
      reposted = true;
    }

    const count = await prisma.repost.count({ where: { postId } });
    
    // Hapus cache menyeluruh
    revalidatePath('/', 'layout');
    
    // Mengembalikan status reposted untuk update UI di client
    return NextResponse.json({ action, count, reposted });
  }

  if (action === 'comment') {
    const content = String(data.content ?? '').trim();
    if (!content) {
      return NextResponse.json({ error: 'Komentar tidak boleh kosong.' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: token.userId,
        content,
      },
      include: {
        user: true,
      },
    });

    const count = await prisma.comment.count({ where: { postId } });
    
    // Hapus cache menyeluruh
    revalidatePath('/', 'layout');
    
    return NextResponse.json({ action, count, comment });
  }

  return NextResponse.json({ error: 'Action tidak dikenal.' }, { status: 400 });
}