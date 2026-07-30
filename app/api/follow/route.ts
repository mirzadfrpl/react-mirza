import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type FollowBody = {
  targetUserId: number;
};

function getUserId() {
  const token = cookies().get('token')?.value;
  const payload = verifyToken(token);
  return payload?.userId;
}

export async function POST(request: Request) {
  const userId = getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as FollowBody;
  if (!body.targetUserId || body.targetUserId === userId) {
    return NextResponse.json({ error: 'Invalid target user' }, { status: 400 });
  }

  await prisma.follow.create({
    data: {
      followerId: userId,
      followingId: body.targetUserId,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const userId = getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as FollowBody;
  if (!body.targetUserId || body.targetUserId === userId) {
    return NextResponse.json({ error: 'Invalid target user' }, { status: 400 });
  }

  await prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId: userId,
        followingId: body.targetUserId,
      },
    },
  });

  return NextResponse.json({ success: true });
}
