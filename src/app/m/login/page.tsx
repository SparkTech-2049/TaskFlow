'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Zap, UserPlus } from 'lucide-react';

export default function MobileLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('两次密码输入不一致');
        return;
      }
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
          setRegisterSuccess(true);
          setIsRegister(false);
          setError('');
        } else {
          const data = await res.json();
          setError(data.error || '注册失败');
        }
      } catch {
        setError('注册请求失败');
      }
      return;
    }

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('用户名或密码错误');
    } else {
      router.push('/m');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5] px-6">
      <div className="flex flex-col items-center gap-3 pt-10 pb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px]"
          style={{ background: 'linear-gradient(135deg, #C7000B, #5B6FF6)' }}>
          <Zap className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-[28px] font-bold text-[#1A1A1A]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          TaskFlow
        </h1>
        <p className="text-sm text-[#666666]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          华为云 · 极简任务管理
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
            className="h-12 w-full rounded-xl border border-[#E8E8E8] bg-white px-3.5 text-sm text-[#1A1A1A] outline-none placeholder:text-[#AAAAAA] focus:border-accent-blue"
            required
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
              className="h-12 w-full rounded-xl border border-[#E8E8E8] bg-white px-3.5 pr-10 text-sm text-[#1A1A1A] outline-none placeholder:text-[#AAAAAA] focus:border-accent-blue"
              required
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className={`flex h-[18px] w-[18px] items-center justify-center rounded border ${rememberMe ? 'border-accent-blue bg-accent-blue' : 'border-[#CCCCCC] bg-white'}`}
          >
            {rememberMe && <span className="text-[10px] text-white">✓</span>}
          </button>
          <span className="text-[13px] text-[#666666]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            记住我
          </span>
        </div>

        {error && (
          <p className="text-sm text-priority-urgent">{error}</p>
        )}

        {registerSuccess && (
          <p className="text-sm text-priority-normal">注册成功，请登录</p>
        )}

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold text-white"
          style={{
            background: 'linear-gradient(90deg, #C7000B, #5B6FF6)',
            boxShadow: '0 4px 12px #C7000B30',
            fontFamily: 'Plus Jakarta Sans',
          }}
        >
          {isRegister ? '注 册' : '登 录'}
        </button>

        {isRegister && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#333333]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              className="h-12 w-full rounded-xl border border-[#E8E8E8] bg-white px-3.5 text-sm text-[#1A1A1A] outline-none placeholder:text-[#AAAAAA] focus:border-accent-blue"
              required
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E8E8E8]" />
          <span className="text-xs text-[#AAAAAA]" style={{ fontFamily: 'Plus Jakarta Sans' }}>或</span>
          <div className="h-px flex-1 bg-[#E8E8E8]" />
        </div>

        {!isRegister && (
          <button
            type="button"
            onClick={() => signIn('github', { callbackUrl: '/m' })}
            className="flex h-12 w-full items-center justify-center rounded-xl border border-[#E8E8E8] bg-white text-[15px] font-semibold text-[#333333]"
            style={{ fontFamily: 'Plus Jakarta Sans' }}
          >
            GitHub 登录
          </button>
        )}

        <button
          type="button"
          onClick={() => { setIsRegister(!isRegister); setError(''); setRegisterSuccess(false); }}
          className="flex h-12 w-full items-center justify-center rounded-xl border border-[#E8E8E8] bg-white text-[15px] font-semibold text-[#333333] gap-2"
          style={{ fontFamily: 'Plus Jakarta Sans' }}
        >
          <UserPlus className="h-4 w-4" />
          {isRegister ? '返回登录' : '注册新账号'}
        </button>
      </form>

      <div className="flex flex-1 items-end justify-center pb-5">
        <p className="text-[11px] text-[#AAAAAA]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Powered by Huawei Cloud
        </p>
      </div>
    </div>
  );
}
