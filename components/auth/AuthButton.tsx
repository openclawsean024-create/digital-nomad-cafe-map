// components/auth/AuthButton.tsx
// 登入 / 登出按鈕 + email magic link
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState('');
  const supabase = createClient();

  useEffect(() => {
    // 取得現有 session
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // 監聽 auth 變化
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setSentMsg('請輸入有效 email');
      return;
    }
    setSending(true);
    setSentMsg('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setSending(false);
    setSentMsg(error ? `錯誤: ${error.message}` : '✉️ Magic link 已寄出，請到信箱點選');
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <img
          src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`}
          alt={user.email}
          className="w-7 h-7 rounded-full"
        />
        <span className="text-gray-700 dark:text-gray-200 truncate max-w-[160px]">
          {user.user_metadata?.full_name || user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          登出
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 min-w-[280px]">
      <form onSubmit={handleMagicLink} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending}
          className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
        >
          {sending ? '寄送中...' : '寄 Magic Link'}
        </button>
      </form>
      <button
        onClick={handleGoogleLogin}
        className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        用 Google 登入
      </button>
      {sentMsg && (
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">{sentMsg}</p>
      )}
    </div>
  );
}
