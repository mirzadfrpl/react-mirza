import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Profil Eksklusif',
  description: 'Personal blog dan dashboard Next.js dengan database SQLite.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
