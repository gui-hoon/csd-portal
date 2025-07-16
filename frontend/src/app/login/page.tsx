"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || '로그인 실패');
      }
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.replace('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">로그인</h1>
          <p className="mt-2 text-gray-600">CSD Portal에 오신 것을 환영합니다.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              이메일 주소
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="font-medium text-red-600 hover:text-red-500">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 