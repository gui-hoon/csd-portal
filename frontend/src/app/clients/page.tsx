'use client';
import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

/**
 * 전체 고객사 오버뷰 페이지
 * - 전체 고객사 목록, 검색, 메모 팝업 등 지원
 */
export default function ClientsOverviewPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [memoPopup, setMemoPopup] = useState<{ open: boolean; memo: string; anchorX?: number; anchorY?: number; anchorW?: number }>({ open: false, memo: '' });

  // 솔루션명 매핑 (좌측탭과 동일하게)
  const solutionNames = ['AppDynamics', 'Dynatrace', 'NetScout', 'NewRelic', 'RWS'];
  const getSolutionLabel = (val: string) => {
    if (!val) return '기타';
    const found = solutionNames.find(name => name.toLowerCase() === val.toLowerCase());
    return found || '기타';
  };

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(setClients);
  }, []);

  // 라이선스 시작일 기준 정렬
  const sortedClients = [...clients].sort((a, b) => {
    if (!a.license_start) return 1;
    if (!b.license_start) return -1;
    return new Date(a.license_start).getTime() - new Date(b.license_start).getTime();
  });
  const filteredClients = sortedClients.filter(c => c.name.includes(search));

  const toggleSelect = (id: number) => {
    setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  };

  const getLicenseStatusClass = (license_end: string) => {
    if (!license_end || license_end === '9999-12-31') return '';
    const end = new Date(license_end);
    const now = new Date();
    const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'border-red-500 bg-red-50'; // 만료
    if (diff <= 7) return 'border-orange-400 bg-orange-50'; // 7일 이내 임박
    return 'bg-gray-50 border-transparent';
  };

  return (
    <>
      <div className="w-full bg-gray-100 py-3 px-8">
        <span className="text-black font-semibold text-lg">클라우드솔루션사업부 &gt; 고객사</span>
      </div>
      <div className="w-full mx-auto mt-8 p-8 bg-white rounded shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="고객사 검색"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border px-3 py-2 rounded w-64 text-black"
            />
          </div>
        </div>
        {/* 솔루션별 그룹핑 */}
        {solutionNames.map(solution => {
          const group = filteredClients.filter(c => (c.solution || '').toLowerCase() === solution.toLowerCase());
          if (group.length === 0) return null;
          return (
            <div key={solution} className="mb-10">
              <h2 className="text-lg font-bold mb-3 text-black">{solution} ({group.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {group.map(c => {
                  let tileColorClass = '';
                  if (!selected.includes(c.id)) {
                    const end = c.license_end;
                    if (end && end !== '9999-12-31') {
                      const diff = (new Date(end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
                      if (diff < 0) tileColorClass = 'bg-red-50 border-red-400';
                      else if (diff <= 7) tileColorClass = 'bg-orange-50 border-orange-400';
                      else tileColorClass = 'bg-white border-gray-200';
                    } else {
                      tileColorClass = 'bg-white border-gray-200';
                    }
                  } else {
                    tileColorClass = 'bg-gray-200 border-gray-700';
                  }
                  return (
                    <div
                      key={c.id}
                      className={`p-6 rounded-lg shadow hover:shadow-md transition flex flex-col gap-2 border min-h-[160px] ${tileColorClass}`}
                      onClick={() => toggleSelect(c.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="relative">
                        {c.memo && (
                          <button
                            className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200 z-10"
                            style={{ lineHeight: 0 }}
                            onClick={e => {
                              e.stopPropagation();
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setMemoPopup({ open: true, memo: c.memo, anchorX: rect.left + rect.width / 2, anchorY: rect.top + window.scrollY + rect.height / 2, anchorW: rect.width });
                            }}
                            title="메모 보기"
                          >
                            <FileText className="w-5 h-5 text-gray-600" />
                          </button>
                        )}
                        <div className="font-bold text-lg mb-1 text-black">{c.name}</div>
                        <div className="text-sm text-gray-800 mb-1">계약 종류: {c.contract_type}</div>
                        <div className="text-sm text-gray-800 mb-1">솔루션: {getSolutionLabel(c.solution)}</div>
                        <div className="text-sm text-gray-800 mb-1">라이선스: {c.license_start} ~ {c.license_end}</div>
                        {selected.includes(c.id) && <div className="text-xs text-red-600">선택됨</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {/* 메모 팝업 */}
      {memoPopup.open && (
        <div
          className="fixed inset-0 z-50"
          onClick={e => {
            if ((e.target as HTMLElement).id === 'memo-popup-overlay') setMemoPopup({ open: false, memo: '' });
          }}
          id="memo-popup-overlay"
          style={{ pointerEvents: 'auto' }}
        >
          <div
            className="absolute"
            style={{
              width: 384, // 24rem
              minWidth: 320,
              top: memoPopup.anchorY || 120,
              left: (() => {
                const popupWidth = 384;
                const margin = 16;
                let left = memoPopup.anchorX || window.innerWidth / 2;
                if (left + popupWidth / 2 + margin > window.innerWidth) {
                  left = (memoPopup.anchorX || 0) - popupWidth + (memoPopup.anchorW || 0);
                } else {
                  left = left - popupWidth / 2;
                }
                if (left < margin) left = margin;
                return left;
              })(),
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white p-6 rounded shadow border w-full relative">
              <h2 className="text-lg font-bold mb-4 text-black">메모</h2>
              <div className="text-black whitespace-pre-line mb-6 text-base min-h-[60px]">{memoPopup.memo}</div>
              <button className="absolute right-4 bottom-4 px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700" onClick={() => setMemoPopup({ open: false, memo: '' })}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 