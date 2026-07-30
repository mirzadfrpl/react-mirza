import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  const token = cookies().get('token')?.value;
  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  return NextResponse.json({ user });
}
