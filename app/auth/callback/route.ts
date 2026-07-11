// app/auth/callback/route.ts
// Magic link / OAuth callback — Supabase 完成驗證後 redirect 回這裡
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // 下一步跳轉路徑（默認回首頁）
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('Auth callback error:', error);
  }

  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
