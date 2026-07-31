import type { Metadata } from 'next';
import './globals.css';
import AutoRefresh from './components/AutoRefresh';

export const metadata: Metadata = {
  title: 'ProFeed | Jaringan Profesional',
  description: 'Platform interaksi profesional dengan update real-time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {/* 
           AutoRefresh akan memicu router.refresh() setiap 3 detik.
           Ini memastikan data feed, likes, dan reposts selalu sinkron
           dengan server tanpa harus reload halaman.
        */}
        <AutoRefresh interval={3000} />
        
        {children}
      </body>
    </html>
  );
}