import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PATCH(request: Request) {
  const token = cookies().get('token')?.value;
  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const updated = await prisma.user.update({
    where: { id: payload.userId },
    data: {
      name: data.name,
      headline: data.headline,
      bio: data.bio,
      linkedin: data.linkedin,
      photoUrl: data.photoUrl,
    },
  });

  return NextResponse.json(updated);
}
