import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 사이드바 컴포넌트
 * - 솔루션별 네비게이션 및 로고 영역
 */
const Sidebar = () => {
  // 솔루션 목록
  const solutions = [
    { name: 'AppDynamics', icon: '/appdynamics.png' },
    { name: 'Dynatrace', icon: '/dynatrace.png' },
    { name: 'Netscout', icon: '/netscout.png' },
    { name: 'New Relic', icon: '/newrelic.png' },
    { name: 'RWS', icon: '/rws.png' },
  ];
  // 현재 솔루션 추출
  const pathname = usePathname();
  const currentSolution = pathname.split('/')[1];

  return (
    <aside className="bg-white text-gray-800 w-64 flex-shrink-0 flex flex-col border-r-2 border-gray-200">
      {/* 로고 및 타이틀 영역 */}
      <button
        onClick={() => window.location.href = '/'}
        className="flex items-center space-x-3 p-4 border-b-2 border-gray-200 w-full bg-transparent border-none cursor-pointer text-left block"
        style={{ boxShadow: 'none', borderBottom: '2px solid #e5e7eb' }}
        aria-label="메인으로 이동"
      >
        <Image
          src="/logo.png"
          alt="Company Logo"
          width={40}
          height={40}
          className="rounded-md"
        />
        <span className="text-xl font-semibold text-gray-900">CSD Portal</span>
      </button>

      {/* 네비게이션 영역 */}
      <div className="p-4">
        <nav>
          <ul>
            {solutions.map((solution) => {
              const slug = solution.name.toLowerCase().replace(/ /g, '');
              const isActive = currentSolution === slug;
              return (
                <li key={solution.name} className="mb-1">
                  <Link
                    href={`/${slug}`}
                    className={
                      `flex items-center space-x-3 p-2 rounded transition-colors duration-200 ` +
                      (isActive
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50')
                    }
                  >
                    <Image
                      src={solution.icon}
                      alt={`${solution.name} logo`}
                      width={20}
                      height={20}
                      className="h-5 w-5"
                    />
                    <span>{solution.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar; 