// components/FavoriteButton.tsx
// 加/移除最愛 + 雲端/本地切換
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLocalFavorites, toggleFavorite, syncLocalFavoritesToCloud } from '@/lib/favorites';

interface FavoriteButtonProps {
  cafeId: string;
}

export default function FavoriteButton({ cafeId }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      setUserId(uid);

      // 抓最愛 list
      const favs = await getFavoritesAny(uid);
      setFavorited(favs.includes(cafeId));
    };
    init();
  }, [cafeId, supabase]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = await toggleFavorite(cafeId, userId);
    setFavorited(next);
    setBusy(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      aria-label={favorited ? '從我的最愛移除' : '加入我的最愛'}
      className={`p-1.5 rounded transition-colors ${
        favorited
          ? 'text-red-500 hover:text-red-600'
          : 'text-gray-400 hover:text-red-400'
      }`}
      title={favorited ? '已加入最愛' : '加入最愛'}
    >
      {favorited ? '❤️' : '🤍'}
    </button>
  );
}

// 簡化版：登入者用 DB；訪客用 localStorage（區分 device）
async function getFavoritesAny(userId: string | null): Promise<string[]> {
  if (!userId) {
    return getLocalFavorites();
  }
  // 登入者優先雲端（直接 import 來避 CJS 衝突）
  const { createClient: make } = await import('@/lib/supabase/client');
  const sb = make();
  const { data } = await sb
    .from('favorites')
    .select('cafe_id')
    .eq('user_id', userId);
  return (data || []).map((r) => r.cafe_id);
}
