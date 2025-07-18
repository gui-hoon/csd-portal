"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, redirectTo?: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 인증 컨텍스트 및 인증 상태 관리 Provider
 * - 로그인/로그아웃, 사용자 정보, 토큰 관리
 * - 인증 필요 페이지 접근 제어
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // 사용자 정보 상태
  const [user, setUser] = useState<User | null>(null);
  // 인증 토큰 상태
  const [token, setToken] = useState<string | null>(null);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 로컬스토리지에서 인증 정보 불러오기
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else {
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    // 인증이 필요한 페이지에서 로그인하지 않은 경우 /login으로 리다이렉트
    const publicPaths = ["/login", "/signup"];
    if (!token && !publicPaths.includes(pathname)) {
      router.replace("/login");
    }
    // 로그인 상태에서 /login, /signup 접근 시 홈으로 리다이렉트
    if (token && publicPaths.includes(pathname)) {
      router.replace("/");
    }
  }, [token, pathname, router, isLoading]);

  /**
   * 로그인 함수
   * - 토큰/사용자 정보 저장 및 리다이렉트
   */
  const login = (token: string, user: User, redirectTo?: string | null) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    if (redirectTo) {
      router.replace(redirectTo);
    }
    // redirectTo가 undefined/null이면 리다이렉트하지 않음
  };

  /**
   * 로그아웃 함수
   * - 인증 정보 삭제 및 /login으로 이동
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const publicPaths = ["/login", "/signup"];
  const isAuthPage = publicPaths.includes(pathname);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        {/* 로딩중... */}
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">{children}</main>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-8 bg-gray-50">{children}</main>
      </div>
    </AuthContext.Provider>
  );
};

/**
 * 인증 컨텍스트 사용 훅
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}; 