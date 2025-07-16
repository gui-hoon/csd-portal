"use client";

export default function SettingPage() {
  return (
    <div className="max-w-2xl mx-auto mt-12 flex flex-col gap-8">
      {/* 시스템 설정 섹션 */}
      <section className="bg-white rounded shadow p-8">
        <h2 className="text-xl font-bold mb-4 text-black">시스템 설정</h2>
        <div className="text-gray-600 mb-2">(추후 다크모드, 기타 시스템 설정 UI가 이곳에 추가될 예정입니다.)</div>
        {/* 예시: 다크모드 토글 자리 */}
        <div className="flex items-center gap-4 mt-4">
          <span className="text-gray-700">🌞 화이트모드</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" disabled />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-gray-700 transition-all"></div>
            <span className="ml-3 text-gray-700">🌚 다크모드</span>
          </label>
          <span className="text-gray-400 text-sm">(설정 기능 준비중)</span>
        </div>
      </section>
      {/* 시스템 정보 섹션 */}
      <section className="bg-white rounded shadow p-8">
        <h2 className="text-xl font-bold mb-4 text-black">시스템 정보</h2>
        <table className="w-full text-left text-gray-700 border-t border-b border-gray-200">
          <tbody>
            <tr><th className="py-2 pr-4 font-semibold">포털 버전</th><td className="py-2">CSD Portal v1.0.0</td></tr>
            <tr><th className="py-2 pr-4 font-semibold">배포일</th><td className="py-2">2025-06-30</td></tr>
            <tr><th className="py-2 pr-4 font-semibold">호스트 OS</th><td className="py-2">Rocky Linux 9</td></tr>
            <tr><th className="py-2 pr-4 font-semibold">Backend Stack</th><td className="py-2">FastAPI + PostgreSQL</td></tr>
            <tr><th className="py-2 pr-4 font-semibold">Frontend Stack</th><td className="py-2">Next.js + Tailwind CSS</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  );
} 