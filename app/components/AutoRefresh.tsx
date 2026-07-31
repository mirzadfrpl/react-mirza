'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AutoRefresh({ interval = 10 }: { interval?: number }) {
  const router = useRouter();

  useEffect(() => {
    // Akan me-refresh data dari server setiap 5 detik (5000 ms)
    const timer = setInterval(() => {
      router.refresh(); 
    }, interval);

    // Bersihkan timer jika user pindah halaman
    return () => clearInterval(timer);
  }, [router, interval]);

  // Komponen ini tidak menampilkan UI apapun (invisible)
  return null; 
}