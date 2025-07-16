import React, { useState, useRef, useEffect } from 'react';
import { User } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { usePathname } from 'next/navigation';

const Header = () => {
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // 현재 솔루션 컨텍스트 추출
  const match = pathname.match(/^\/(\w+)(?:\/|$)/);
  const notSolutionPages = ['clients','docs','issues','login','signup','setting','works','account','setting'];
  const solution = match && !notSolutionPages.includes(match[1]) ? match[1] : null;

  // 클릭 외부 감지로 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className="bg-white text-gray-800 p-4 flex items-center shadow-sm z-10">
      {/* Left-aligned logo */}
      <div className="flex-1"></div>
      
      {/* Centered navigation */}
      <nav className="flex-1">
        <ul className="flex justify-center space-x-8">
          <li>
            <Link
              href={solution ? `/${solution}/clients` : '/clients'}
              className="font-semibold text-gray-600 hover:text-red-600 transition-colors"
            >
              고객사
            </Link>
          </li>
          <li>
            <Link
              href={solution ? `/${solution}/works` : '/works'}
              className="font-semibold text-gray-600 hover:text-red-600 transition-colors"
            >
              작업 내역
            </Link>
          </li>
          <li>
            <Link
              href={solution ? `/${solution}/issues` : '/issues'}
              className="font-semibold text-gray-600 hover:text-red-600 transition-colors"
            >
              Issue 게시판
            </Link>
          </li>
          <li>
            <Link
              href={solution ? `/${solution}/docs` : '/docs'}
              className="font-semibold text-gray-600 hover:text-red-600 transition-colors"
            >
              Docs
            </Link>
          </li>
        </ul>
      </nav>

      {/* Right-aligned actions */}
      <div className="flex-1 flex justify-end items-center space-x-6 relative">
        <a href="#" className="font-semibold text-gray-600 hover:text-red-600 transition-colors">ChatAI</a>
        <div className="relative" ref={dropdownRef}>
          <button
            className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            onClick={() => setDropdownOpen((open) => !open)}
            aria-label="프로필"
          >
            <User className="h-5 w-5 text-gray-600" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
              <Link
                href="/account"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                onClick={() => setDropdownOpen(false)}
              >
                계정 설정
              </Link>
              <Link
                href="/setting"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                onClick={() => setDropdownOpen(false)}
              >
                시스템 설정
              </Link>
              <button
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 