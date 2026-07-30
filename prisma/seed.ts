import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let user = await prisma.user.findUnique({ where: { username: 'mirzadf' } });

  if (!user) {
    const passwordHash = await bcrypt.hash('rahasia123', 10);

    user = await prisma.user.create({
      data: {
        username: 'mirzadf',
        email: 'mirzadf@example.com',
        name: 'Mirzad D',
        headline: 'Pendiri jaringan profesional editorial baru',
        bio: 'Menjadi platform yang menghubungkan pengalaman kerja, tulisan, dan pencapaian menjadi satu profil digital yang menarik.',
        linkedin: 'https://linkedin.com/in/mirzadf',
        photoUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80',
        passwordHash,
      },
    });
  }

  const existingPosts = await prisma.post.count();
  if (existingPosts === 0 && user) {
    await prisma.post.create({
      data: {
        authorId: user.id,
        title: 'Selamat datang di jaringan profesional baru',
        slug: 'selamat-datang-jaringan-profesional-baru',
        excerpt: 'Platform ini menggabungkan post, pengalaman, sertifikat, dan profil dalam satu tampilan modern.',
        content: 'Mulai dengan membuat akun, membagikan pengalaman, mengunggah sertifikat, lalu jelajahi postingan FYP dari pengguna lain.',
        coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        category: 'announcement',
        published: true,
      },
    });
    await prisma.post.create({
      data: {
        authorId: user.id,
        title: 'Unggah sertifikat dan pengalaman Anda',
        slug: 'unggah-sertifikat-dan-pengalaman-anda',
        excerpt: 'Tampilkan pencapaian Anda kepada jaringan profesional dengan cara yang ramping dan elegan.',
        content: 'Gunakan halaman profil untuk menambahkan sertifikat, aktivitas, dan cerita pengalaman yang relevan.',
        coverImage: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
        category: 'insight',
        published: true,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
