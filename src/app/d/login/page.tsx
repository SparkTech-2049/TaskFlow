'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Zap, Check, ShieldAlert } from 'lucide-react';

const features = [
  '多视图管理 · 日历/清单/四象限',
  '跨月无缝衔接 · 逾期自动结转',
  '优先级驱动 · 四象限自动归类',
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/d';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('用户名或密码错误，IP 已被永久封禁');
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5]">      <div
        className="flex h-full w-[680px] flex-col items-center justify-center gap-6 p-[60px]"
        style={{ background: 'linear-gradient(135deg, #C7000B, #5B6FF6 50%, #8B6CFF)' }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#FFFFFF40] bg-[#FFFFFF20]">
          <Zap className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          TaskFlow
        </h1>
        <p className="text-base text-white/80" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          华为云 · 极简任务管理
        </p>
        <div className="h-10" />
        <div className="flex flex-col gap-3">
          {features.map((text) => (
            <div key={text} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-white/80" />
              <span className="text-[13px] text-white/80" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-[60px]">
        <div className="flex w-[380px] flex-col gap-6 rounded-[20px] border border-[#E8E8E8] bg-white p-9 shadow-[0_8px_32px_#0000000A]">
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ background: 'linear-gradient(135deg, #C7000B, #5B6FF6)' }}
            >
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              TaskFlow
            </h1>
            <p className="text-sm text-[#666666]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              登录你的账户
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#333333]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="h-11 w-full rounded-xl border border-[#E8E8E8] bg-[#F5F5F5] px-3.5 text-sm text-[#1A1A1A] outline-none placeholder:text-[#AAAAAA] focus:border-accent-blue"
                required
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#333333]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="h-11 w-full rounded-xl border border-[#E8E8E8] bg-[#F5F5F5] px-3.5 pr-10 text-sm text-[#1A1A1A] outline-none placeholder:text-[#AAAAAA] focus:border-accent-blue"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-[#E53E3E10] px-3 py-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-priority-urgent" />
                <p className="text-sm text-priority-urgent">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold text-white disabled:opacity-60"
              style={{
                background: 'linear-gradient(90deg, #C7000B, #5B6FF6)',
                boxShadow: '0 4px 12px #C7000B30',
                fontFamily: 'Plus Jakarta Sans',
              }}
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <p className="text-center text-[11px] text-[#AAAAAA]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Powered by Huawei Cloud
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DesktopLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
