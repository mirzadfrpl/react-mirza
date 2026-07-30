import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="sidebar-card right-sidebar">
      <div className="sidebar-header">
        <p className="eyebrow">Trending</p>
        <h2>Topik & Akun</h2>
      </div>

      <p className="feed-sidebar-note">Cari posting dan akun populer, lalu klik untuk melihat detail profil atau artikel.</p>

      <ul>
        <li>
          <strong>#Karier</strong>
          <span>Update profesional dan pengalaman kerja.</span>
        </li>
        <li>
          <strong>#Sertifikat</strong>
          <span>Bagikan pencapaian dan kualifikasi terbaru.</span>
        </li>
        <li>
          <strong>#Networking</strong>
          <span>Bangun koneksi dengan profesional lain.</span>
        </li>
      </ul>

      <div className="hero-actions sidebar-actions">
        <Link className="button tertiary" href="/explore">Telusuri semua</Link>
      </div>
    </aside>
  );
}
