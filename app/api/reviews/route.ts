// app/api/reviews/route.ts
// POST 新增評論 — 套用 SPEC §3.4 AC-005 (1 人 1 cafe 1 評論 唯一約束)
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  let body: { cafeId?: string; rating?: number; content?: string; photos?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '無效的 JSON' },
      { status: 400 }
    );
  }

  const { cafeId, rating, content, photos = [] } = body;
  if (!cafeId || !content || rating == null) {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'cafeId / rating / content 必填' },
      { status: 400 }
    );
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'rating 必須 1-5' },
      { status: 400 }
    );
  }
  if (content.length > 2000) {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '評論過長 (max 2000)' },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json(
      { code: 'UNAUTHENTICATED', message: '請先登入' },
      { status: 401 }
    );
  }

  // AC-005: 唯一約束由 DB UNIQUE (user_id, cafe_id) 強制
  // 若重複，回 409 Conflict
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      cafe_id: cafeId,
      user_id: userData.user.id,
      rating,
      content,
      photos,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation in Postgres
    if (error.code === '23505') {
      return NextResponse.json(
        {
          code: 'REVIEW_EXISTS',
          message: '你已評論過此咖啡廳，請編輯原評論',
        },
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
