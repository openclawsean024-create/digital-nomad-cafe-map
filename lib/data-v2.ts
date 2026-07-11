// lib/data-v2.ts
// v2 資料層：從 Supabase 抓 cafes（含 fallback 到 localStorage）
// 回傳統一使用 types/cafe 的 Cafe 介面（前端用 camelCase）
'use client';

import { createClient } from '@/lib/supabase/client';
import { Cafe, CafeInput } from '@/types/cafe';

// DB row schema（snake_case）
interface DbCafe {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  city: string | null;
  country: string | null;
  wifi_quality: number;
  power_outlets: number;
  quietness: number;
  time_limit: 'UNLIMITED' | 'ONE_HOUR' | 'TWO_HOURS' | 'THREE_HOURS';
  seating: number;
  notes: string | null;
  is_hidden: boolean;
  created_by: string | null;
  created_at: string;
}

function dbToUi(row: DbCafe): Cafe {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    city: row.city,
    country: row.country,
    wifiQuality: row.wifi_quality as 1 | 2 | 3 | 4 | 5,
    powerOutlets: row.power_outlets as 1 | 2 | 3,
    quietness: row.quietness as 1 | 2 | 3,
    timeLimit: row.time_limit,
    seating: row.seating as 1 | 2 | 3 | 4 | 5,
    notes: row.notes ?? '',
    createdAt: new Date(row.created_at).getTime(),
  };
}

function uiToDb(input: CafeInput) {
  return {
    name: input.name,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    city: input.city ?? null,
    country: input.country ?? null,
    wifi_quality: input.wifiQuality,
    power_outlets: input.powerOutlets,
    quietness: input.quietness,
    time_limit: input.timeLimit ?? 'UNLIMITED',
    seating: input.seating ?? 3,
    notes: input.notes ?? null,
  };
}

const LOCAL_KEY = 'nomad-cafes';

interface OldV1Cafe {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  wifiQuality: number;
  powerOutlets: number;
  quietness: number;
  notes: string;
  createdAt: number;
}

function upgradeV1Cafe(old: OldV1Cafe): Cafe {
  return {
    id: old.id,
    name: old.name,
    address: old.address,
    lat: old.lat,
    lng: old.lng,
    city: null,
    country: null,
    wifiQuality: old.wifiQuality as 1 | 2 | 3 | 4 | 5,
    powerOutlets: old.powerOutlets as 1 | 2 | 3,
    quietness: old.quietness as 1 | 2 | 3,
    timeLimit: 'UNLIMITED',
    seating: 3,
    notes: old.notes,
    createdAt: old.createdAt,
  };
}

export async function getCafesFromDb(): Promise<Cafe[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('is_hidden', false)
    .order('name');

  if (error) throw new Error(`Supabase 讀取失敗: ${error.message}`);
  return (data || []).map(dbToUi);
}

export function getCafesFromLocalStorage(): Cafe[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_KEY);
  if (!stored) return [];
  try {
    const old = JSON.parse(stored) as OldV1Cafe[];
    return old.map(upgradeV1Cafe);
  } catch {
    return [];
  }
}

// 智慧載入：先用 DB 的，沒人登入時 fallback 到 localStorage
export async function loadCafes(): Promise<Cafe[]> {
  try {
    const dbCafes = await getCafesFromDb();
    if (dbCafes.length > 0) return dbCafes;
  } catch (e) {
    console.warn('DB 讀取失敗，fallback 到 localStorage:', e);
  }
  return getCafesFromLocalStorage();
}

export async function upsertCafeFromLocalStorage(oldCafes: OldV1Cafe[]): Promise<number> {
  const supabase = createClient();
  const rows = oldCafes.map((old) => {
    const upgraded = upgradeV1Cafe(old);
    const dbRow = uiToDb(upgraded as CafeInput);
    return {
      ...dbRow,
      id: upgraded.id,
      created_by: null,
      is_hidden: false,
    };
  });
  const { data, error } = await supabase
    .from('cafes')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
    .select();
  if (error) throw new Error(`Migration 失敗: ${error.message}`);
  return data?.length || 0;
}

export async function addCafeToDb(input: CafeInput): Promise<Cafe> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  const dbRow = uiToDb(input);
  const { data, error } = await supabase
    .from('cafes')
    .insert({ ...dbRow, created_by: user.user?.id ?? null })
    .select()
    .single();
  if (error) throw new Error(`新增失敗: ${error.message}`);
  return dbToUi(data as DbCafe);
}

export async function updateCafeInDb(id: string, updates: Partial<CafeInput>): Promise<Cafe | null> {
  const supabase = createClient();
  const dbUpdates = uiToDb(updates as CafeInput);
  const { data, error } = await supabase
    .from('cafes')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`編輯失敗: ${error.message}`);
  return dbToUi(data as DbCafe);
}

export async function deleteCafeFromDb(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('cafes').delete().eq('id', id);
  if (error) throw new Error(`刪除失敗: ${error.message}`);
  return true;
}
