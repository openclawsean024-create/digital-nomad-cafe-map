// app/api/cafes/route.ts
// GET 列表（地理篩選）+ POST 新增 — 對應 SPEC §4.4 F-105, F-101
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const country = searchParams.get('country');

  const supabase = createClient();
  let query = supabase
    .from('cafes')
    .select('*')
    .eq('is_hidden', false)
    .order('name');

  if (city) query = query.eq('city', city);
  if (country) query = query.eq('country', country);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { code: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  let body: {
    name?: string;
    address?: string;
    lat?: number;
    lng?: number;
    wifi_quality?: number;
    power_outlets?: number;
    quietness?: number;
    time_limit?: string;
    seating?: number;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '無效的 JSON' },
      { status: 400 }
    );
  }

  const required = ['name', 'address', 'lat', 'lng'] as const;
  for (const k of required) {
    if (body[k] == null || body[k] === '') {
      return NextResponse.json(
        { code: 'BAD_REQUEST', message: `${k} 必填` },
        { status: 400 }
      );
    }
  }

  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json(
      { code: 'UNAUTHENTICATED', message: '請先登入' },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from('cafes')
    .insert({
      name: body.name,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      wifi_quality: body.wifi_quality ?? 3,
      power_outlets: body.power_outlets ?? 2,
      quietness: body.quietness ?? 2,
      time_limit: body.time_limit ?? 'UNLIMITED',
      seating: body.seating ?? 3,
      notes: body.notes ?? null,
      created_by: userData.user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { code: 'DUPLICATE_CAFE', message: '同名同地址已存在' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { code: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
