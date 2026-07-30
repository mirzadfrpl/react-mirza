import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  const data = await request.json();
  const { username, email, password } = data;

  if (!password || (!username && !email)) {
    return NextResponse.json({ error: 'Email/username dan password harus diisi.' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        username ? { username } : undefined,
        email ? { email } : undefined,
      ].filter(Boolean) as any[],
    },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Akun tidak ditemukan atau password salah.' }, { status: 401 });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Akun tidak ditemukan atau password salah.' }, { status: 401 });
  }

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
