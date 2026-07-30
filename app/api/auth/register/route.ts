import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  const data = await request.json();
  const { username, email, password, name, headline, bio, linkedin, photoUrl } = data;

  if (!username || !password || !name || !headline) {
    return NextResponse.json({ error: 'Lengkapi kolom yang dibutuhkan.' }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        email ? { email } : undefined,
      ].filter(Boolean) as any[],
    },
  });

  if (existing) {
    return NextResponse.json({ error: 'Username atau email sudah terpakai.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      name,
      headline,
      bio: bio || 'Profil profesional baru.',
      linkedin: linkedin || 'https://linkedin.com',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80',
      passwordHash,
    },
  });

  const token = signToken(user.id);
  const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username, name: user.name, headline: user.headline, linkedin: user.linkedin, photoUrl: user.photoUrl } });
  response.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  return response;
}
