'use client';

import { useState } from 'react';

type Props = {
  targetUserId: number;
  initiallyFollowing: boolean;
};

export default function FollowButton({ targetUserId, initiallyFollowing }: Props) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [loading, setLoading] = useState(false);

  async function toggleFollow() {
    setLoading(true);
    const response = await fetch('/api/follow', {
      method: following ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    setLoading(false);
    if (response.ok) {
      setFollowing(!following);
    }
  }

  return (
    <button className={`button ${following ? 'secondary' : 'tertiary'} small`} type="button" onClick={toggleFollow} disabled={loading}>
      {following ? 'Mengikuti' : 'Follow'}
    </button>
  );
}
