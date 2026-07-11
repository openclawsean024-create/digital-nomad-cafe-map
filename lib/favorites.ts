// lib/favorites.ts
// 我的最愛：登入者 → Supabase / 訪客 → localStorage
'use client';

import { createClient } from '@/lib/supabase/client';

const LOCAL_KEY = 'nomad-favorites';

export function getLocalFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export async function getFavorites(userId: string | null): Promise<string[]> {
  if (!userId) return getLocalFavorites();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('favorites')
    .select('cafe_id')
    .eq('user_id', userId);
  if (error) {
    console.warn('Favorites DB 讀取失敗，fallback 到 localStorage:', error);
    return getLocalFavorites();
  }
  return (data || []).map((r) => r.cafe_id);
}

export async function toggleFavorite(
  cafeId: string,
  userId: string | null
): Promise<boolean> {
  // 傳回 true 表示「已加入最愛」、false 表示「已移除」
  if (!userId) {
    const current = getLocalFavorites();
    const next = current.includes(cafeId)
      ? current.filter((id) => id !== cafeId)
      : [...current, cafeId];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    return next.includes(cafeId);
  }

  const supabase = createClient();
  const { data } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .eq('cafe_id', cafeId)
    .single();

  if (data) {
    await supabase.from('favorites').delete().eq('user_id', userId).eq('cafe_id', cafeId);
    return false;
  }
  await supabase.from('favorites').insert({ user_id: userId, cafe_id: cafeId });
  return true;
}

// 登入後一鍵把 localStorage 的最愛同步到雲端
export async function syncLocalFavoritesToCloud(userId: string): Promise<number> {
  const local = getLocalFavorites();
  if (local.length === 0) return 0;

  const supabase = createClient();
  const rows = local.map((cafeId) => ({ user_id: userId, cafe_id: cafeId }));

  const { data, error } = await supabase
    .from('favorites')
    .upsert(rows, { onConflict: 'user_id,cafe_id', ignoreDuplicates: true })
    .select();

  if (error) {
    console.warn('Sync 失敗:', error);
    return 0;
  }

  // 同步成功 → 清掉 localStorage
  localStorage.removeItem(LOCAL_KEY);
  return data?.length ?? 0;
}
