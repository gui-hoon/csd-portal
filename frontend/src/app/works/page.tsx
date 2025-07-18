'use client';
import { useState, useEffect } from 'react';
import { LayoutGrid, List, Plus, Pencil, Trash2 } from 'lucide-react';

function getKoreanWeekLabel(weekStr: string) {
  if (!weekStr) return '';
  const [year, week] = weekStr.split('-W').map(Number);
  // ISO-8601 기준 해당 주의 월요일 구하기
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const firstMonday = new Date(jan4.getTime() - (jan4Day - 1) * 24 * 60 * 60 * 1000);
  const monday = new Date(firstMonday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  // 1. 주의 7일 중 가장 많이 포함된 월 구하기
  const monthCount: Record<number, number> = {};
  let days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const m = d.getMonth() + 1;
    days.push(m);
    monthCount[m] = (monthCount[m] || 0) + 1;
  }
  // 2. 4일 이상 포함된 월을 기준으로 삼음
  let maxMonth = days[0], maxCount = 0;
  for (const m of Object.keys(monthCount)) {
    const numM = Number(m);
    if (monthCount[numM] > maxCount && monthCount[numM] >= 4) {
      maxMonth = numM;
      maxCount = monthCount[numM];
    }
  }
  // 3. 그 달의 첫 주(월요일)부터 현재 주(월요일)까지 몇 번째 주인지 계산
  // (주의 월요일이 속한 연도 기준)
  const firstOfMonth = new Date(year, maxMonth - 1, 1);
  // 그 달의 첫 월요일 찾기
  const firstOfMonthDay = firstOfMonth.getDay() || 7;
  const firstMonthMonday = new Date(firstOfMonth.getTime() - (firstOfMonthDay - 1) * 24 * 60 * 60 * 1000);
  let weekOfMonth = 1;
  let cursor = new Date(firstMonthMonday);
  while (cursor < monday) {
    // cursor~cursor+6 중 maxMonth가 4일 이상 포함되면 주차 증가
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() + i);
      if (d.getMonth() + 1 === maxMonth) count++;
    }
    if (count >= 4) weekOfMonth++;
    cursor.setDate(cursor.getDate() + 7);
  }
  // 현재 주도 검사
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    if (d.getMonth() + 1 === maxMonth) count++;
  }
  if (count < 4) weekOfMonth--;
  return `${maxMonth}월 ${weekOfMonth}번째 주`;
}

const getSolutionLabel = (val: string) => {
  if (!val) return '';
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
};

const getDateWithDay = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const day = days[date.getDay()];
  return `${dateStr} (${day})`;
};

function getCurrentWeek() {
  const now = new Date();
  const year = now.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const monday = new Date(jan4.getTime() - (jan4Day - 1) * 24 * 60 * 60 * 1000);
  const diff = now.getTime() - monday.getTime();
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

const getWeekRange = (weekStr: string) => {
  if (!weekStr) return [null, null];
  const [year, week] = weekStr.split('-W').map(Number);
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const monday = new Date(jan4.getTime() - (jan4Day - 1) * 24 * 60 * 60 * 1000);
  const start = new Date(monday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  return [start, end];
};

/**
 * 전체 작업내역 페이지
 * - 전체 솔루션 작업 목록, 추가/수정/삭제, 주차/검색 등 지원
 * - 타일/테이블 모드 지원
 */
export default function WorksPage() {
  const [mode, setMode] = useState<'tile'|'table'>('tile');
  const [week, setWeek] = useState('');
  const [works, setWorks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addForm, setAddForm] = useState({ client: '', solution: '', date: '', content: '', issue: '' });
  const [editForm, setEditForm] = useState({ id: '', client: '', solution: '', date: '', content: '', issue: '' });
  const [editId, setEditId] = useState<string | number | null>(null);

  useEffect(() => { setWeek(getCurrentWeek()); }, []);
  useEffect(() => { fetchWorks(); }, []);
  const fetchWorks = async () => {
    const res = await fetch('/api/works');
    if (res.ok) setWorks(await res.json());
  };

  // 필터/페이지네이션
  const [weekStart, weekEnd] = getWeekRange(week);
  const filteredWorks = works.filter(w => {
    if (search && !(w.client?.includes(search) || w.content?.includes(search))) return false;
    if (week && weekStart && weekEnd) {
      const d = new Date(w.date);
      return d >= weekStart && d <= weekEnd;
    }
    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // 날짜순 정렬 (오래된순)
  const totalPages = Math.ceil(filteredWorks.length / pageSize);
  const pagedWorks = filteredWorks.slice((page - 1) * pageSize, page * pageSize);

  // 추가/수정/삭제 핸들러
  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddForm(f => ({ ...f, [name]: value }));
  };
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/works', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm) });
    setShowAddModal(false);
    setAddForm({ client: '', solution: '', date: '', content: '', issue: '' });
    fetchWorks();
  };
  const handleEdit = (work: any) => {
    setEditForm(work);
    setEditId(work.id);
    setShowEditModal(true);
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    await fetch(`/api/works/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
    setShowEditModal(false);
    setEditId(null);
    fetchWorks();
  };
  const handleDelete = async (id: string | number) => {
    await fetch(`/api/works/${id}`, { method: 'DELETE' });
    fetchWorks();
  };

  return (
    <>
      <div className="w-full bg-gray-100 py-3 px-8">
        <span className="text-black font-semibold text-lg">클라우드솔루션사업부 &gt; 작업내역</span>
      </div>
      <div className="w-full mx-auto mt-8 p-8 bg-white rounded shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="고객사/작업내용 검색"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border px-3 py-2 rounded w-64 text-black"
            />
            <input
              type="week"
              value={week}
              onChange={e => setWeek(e.target.value)}
              className="border px-3 py-2 rounded text-black"
            />
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={()=>setMode('tile')} className={`p-2 rounded bg-white text-black border border-gray-300 hover:bg-gray-100 transition ${mode==='tile' ? 'ring-2 ring-gray-400' : ''}`}> <LayoutGrid className="w-5 h-5" /> </button>
            <button onClick={()=>setMode('table')} className={`p-2 rounded bg-white text-black border border-gray-300 hover:bg-gray-100 transition ${mode==='table' ? 'ring-2 ring-gray-400' : ''}`}> <List className="w-5 h-5" /> </button>
          </div>
        </div>
        <div className="mb-4 text-blue-700 font-semibold text-base">{getKoreanWeekLabel(week)}</div>
        {filteredWorks.length === 0 ? (
          <div className="flex items-center justify-center min-h-[300px] text-gray-500 text-lg">등록된 작업 내역이 없습니다.</div>
        ) : (
          <>
            {mode === 'tile' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {pagedWorks.map(w => (
                  <div key={w.id} className="p-6 rounded-lg shadow flex flex-col gap-2 bg-white border border-gray-200 relative min-h-[160px]">
                    <div className="font-bold text-lg mb-1 text-black">{w.client}</div>
                    <div className="text-sm text-gray-800 mb-1">작업일: {getDateWithDay(w.date)}</div>
                    <div className="text-sm text-gray-800 mb-1">솔루션: {getSolutionLabel(w.solution)}</div>
                    <div className="text-sm text-gray-800 mb-1">작업내용: {w.content}</div>
                    <div className="text-sm text-gray-800 mb-1">이슈: {w.issue || 'X'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full mt-4 text-left text-black">
                <thead>
                  <tr className="bg-gray-100 text-black">
                    <th className="px-4 py-2 text-black">고객사</th>
                    <th className="px-4 py-2 text-black">작업일</th>
                    <th className="px-4 py-2 text-black">솔루션</th>
                    <th className="px-4 py-2 text-black">작업내용</th>
                    <th className="px-4 py-2 text-black">이슈</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedWorks.map(w => (
                    <tr key={w.id} className="border-b text-black">
                      <td className="px-4 py-2 text-black">{w.client}</td>
                      <td className="px-4 py-2 text-black">{getDateWithDay(w.date)}</td>
                      <td className="px-4 py-2 text-black">{getSolutionLabel(w.solution)}</td>
                      <td className="px-4 py-2 text-black">{w.content}</td>
                      <td className="px-4 py-2 text-black">{w.issue || 'X'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {totalPages > 0 && (
              <div className="flex justify-center items-center mt-6 w-full">
                <button
                  className="px-3 py-1 rounded border border-gray-300 bg-white text-black hover:bg-gray-100 transition disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  이전
                </button>
                <span className="mx-4 text-sm text-gray-700 font-semibold">{page} / {totalPages}</span>
                <button
                  className="px-3 py-1 rounded border border-gray-300 bg-white text-black hover:bg-gray-100 transition disabled:opacity-50"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
        {/* 추가/수정 모달은 솔루션별 페이지에서만 노출, 코드 구조는 동일하게 준비 */}
        {/*
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <form onSubmit={handleAddSubmit} className="bg-white p-8 rounded shadow-xl w-full max-w-xl flex flex-col gap-4 text-black border border-gray-300 pointer-events-auto">
              <h2 className="text-xl font-bold mb-4 text-black">작업 내역 추가</h2>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm text-gray-700">고객사</label>
                    <input name="client" value={addForm.client} onChange={handleAddChange} placeholder="고객사" className="p-2 border rounded text-black" required />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm text-gray-700">솔루션</label>
                    <input name="solution" value={addForm.solution} onChange={handleAddChange} placeholder="솔루션" className="p-2 border rounded text-black" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm text-gray-700">작업일</label>
                    <input name="date" type="date" value={addForm.date} onChange={handleAddChange} className="p-2 border rounded text-black" required />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm text-gray-700">이슈</label>
                    <input name="issue" value={addForm.issue} onChange={handleAddChange} placeholder="이슈" className="p-2 border rounded text-black" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">작업내용</label>
                  <textarea name="content" value={addForm.content} onChange={handleAddChange} placeholder="작업내용" className="p-2 border rounded text-black h-24" required />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 text-black rounded">취소</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
              </div>
            </form>
          </div>
        )}
        */}
      </div>
    </>
  );
} 