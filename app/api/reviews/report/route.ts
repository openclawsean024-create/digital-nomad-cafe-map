// app/api/reviews/report/route.ts
// POST 檢舉 — 對應 SPEC §3.4 F-101 + §10.4 Error Code
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_REASONS = ['spam', 'fake', 'off_topic', 'other'] as const;

export async function POST(request: Request) {
  let body: { reviewId?: string; cafeId?: string; reason?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '無效的 JSON' },
      { status: 400 }
    );
  }

  const { reviewId, cafeId, reason, notes } = body;

  // 必須二選一
  if (!reviewId && !cafeId) {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'reviewId 或 cafeId 必填一個' },
      { status: 400 }
    );
  }
  if (reviewId && cafeId) {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'reviewId 與 cafeId 只能選一個' },
      { status: 400 }
    );
  }
  if (!reason || !VALID_REASONS.includes(reason as typeof VALID_REASONS[number])) {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: `reason 必須是 ${VALID_REASONS.join(', ')}` },
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

  const { error } = await supabase.from('reports').insert({
    cafe_id: cafeId ?? null,
    review_id: reviewId ?? null,
    user_id: userData.user.id,
    reason,
    notes: notes ?? null,
  });

  if (error) {
    return NextResponse.json(
      { code: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { code: 'OK', message: '已收到檢舉' },
    { status: 201 }
  );
}
