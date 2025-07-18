'use client';
import { useState, useEffect, use } from 'react';
import { LayoutGrid, List, Plus, Pencil, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

// 솔루션별 고객사 목업
const solutionClients: { [key: string]: string[] } = {
  AppDynamics: ['A사', 'C사'],
  Dynatrace: ['B사'],
  NetScout: ['D사'],
  NewRelic: ['E사'],
  RWS: ['F사'],
};

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
 * 솔루션별 작업내역 페이지
 * - 작업 목록, 추가/수정/삭제, 주차/검색/선택 등 상태 URL 동기화
 * - 타일/테이블 모드 지원
 */
export default function SolutionWorksPage({ params }: { params: Promise<{ solution: string }> }) {
  const { solution } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<'tile'|'table'>('tile');
  const [week, setWeek] = useState(() => searchParams?.get('week') || '');
  const [works, setWorks] = useState<any[]>([]);
  const [search, setSearch] = useState(() => searchParams?.get('search') || '');
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addForm, setAddForm] = useState({ client: '', solution: solution, date: '', content: '', issue: '' });
  const [editForm, setEditForm] = useState({ id: '', client: '', solution: solution, date: '', content: '', issue: '' });
  const [editId, setEditId] = useState<string | number | null>(null);
  const [clients, setClients] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | number | null>(null);
  const [selectedWorks, setSelectedWorks] = useState<number[]>(() => {
    const sel = searchParams?.get('selected');
    return sel ? [Number(sel)] : [];
  });

  useEffect(() => { setWeek(getCurrentWeek()); }, []);
  useEffect(() => { fetchWorks(); fetchClients(); }, [solution]);
  const fetchWorks = async () => {
    const res = await fetch(`/api/works/solution/${encodeURIComponent(solution)}`);
    if (res.ok) setWorks(await res.json());
  };
  const fetchClients = async () => {
    const res = await fetch('/api/clients');
    if (res.ok) {
      const allClients = await res.json();
      setClients(allClients.filter((c: any) => c.solution === solution));
    }
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
    const res = await fetch('/api/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm)
    });
    const data = await res.json().catch(() => ({}));
    console.log('작업내역 추가 응답:', res.status, data);
    if (res.ok) {
      setShowAddModal(false);
      setAddForm({ client: '', solution: solution, date: '', content: '', issue: '' });
      fetchWorks();
    } else {
      alert('저장 실패: ' + (data.detail || res.status));
    }
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

  // 선택 토글
  const toggleSelectWork = (id: number) => {
    setSelectedWorks(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  };
  // 전체 선택
  const allSelected = filteredWorks.length > 0 && filteredWorks.every(w => selectedWorks.includes(w.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelectedWorks([]);
    else setSelectedWorks(filteredWorks.map(w => w.id));
  };
  // 삭제 핸들러 (여러 개)
  const handleDeleteSelected = () => {
    if (selectedWorks.length === 0) return;
    setShowDeleteConfirm(true);
  };
  // 삭제 확정
  const confirmDeleteSelected = async () => {
    for (const id of selectedWorks) {
      await fetch(`/api/works/${id}`, { method: 'DELETE' });
    }
    setSelectedWorks([]);
    setShowDeleteConfirm(false);
    fetchWorks();
  };
  // 수정 핸들러 (하나만)
  const handleEditSelected = () => {
    if (selectedWorks.length === 1) {
      const work = works.find(w => w.id === selectedWorks[0]);
      if (work) {
        setEditForm(work);
        setEditId(work.id);
        setShowEditModal(true);
      }
    }
  };

  // 날짜(week) 변경 시 URL 쿼리 동기화
  const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeek(e.target.value);
    router.push(`/${solution}/works?week=${e.target.value}${search ? `&search=${encodeURIComponent(search)}` : ''}${selectedWorks.length === 1 ? `&selected=${selectedWorks[0]}` : ''}`);
  };
  // 검색어 변경 시 URL 쿼리 동기화
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    router.push(`/${solution}/works?week=${week}${e.target.value ? `&search=${encodeURIComponent(e.target.value)}` : ''}${selectedWorks.length === 1 ? `&selected=${selectedWorks[0]}` : ''}`);
  };

  return (
    <>
      <div className="w-full bg-gray-100 py-3 px-8">
        <span className="text-black font-semibold text-lg">{getSolutionLabel(solution)} &gt; 작업내역</span>
      </div>
      <div className="w-full mt-8 p-8 bg-white rounded shadow flex flex-col min-h-[600px] relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="고객사/작업내용 검색"
              value={search}
              onChange={handleSearchChange}
              className="border px-3 py-2 rounded w-64 text-black"
            />
            <input
              type="week"
              value={week}
              onChange={handleWeekChange}
              className="border px-3 py-2 rounded text-black"
            />
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={()=>setShowAddModal(true)} className="px-4 py-2 bg-white text-black rounded border border-gray-300 hover:bg-gray-100 transition text-base font-medium">추가</button>
            <button
              onClick={handleEditSelected}
              disabled={selectedWorks.length !== 1}
              className="px-4 py-2 bg-white text-black rounded border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50 text-base font-medium"
            >수정</button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedWorks.length === 0}
              className="px-4 py-2 bg-white text-black rounded border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50 text-base font-medium"
            >삭제</button>
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
                  <div
                    key={w.id}
                    className={`p-6 rounded-lg shadow transition flex flex-col gap-2 border min-h-[160px] cursor-pointer select-none relative ${selectedWorks.includes(w.id) ? 'border-gray-700 bg-gray-200' : 'bg-white border-gray-200 hover:shadow-md'}`}
                    onClick={() => toggleSelectWork(w.id)}
                  >
                    <div className="font-bold text-lg mb-1 text-black">{w.client}</div>
                    <div className="text-sm text-gray-800 mb-1">작업일: {getDateWithDay(w.date)}</div>
                    <div className="text-sm text-gray-800 mb-1">작업내용: {w.content}</div>
                    <div className="text-sm text-gray-800 mb-1">이슈: {w.issue || 'X'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full mt-4 text-left text-black">
                <thead>
                  <tr className="bg-gray-100 text-black">
                    <th className="px-4 py-2 text-black">
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                    </th>
                    <th className="px-4 py-2 text-black">고객사</th>
                    <th className="px-4 py-2 text-black">작업일</th>
                    <th className="px-4 py-2 text-black">작업내용</th>
                    <th className="px-4 py-2 text-black">이슈</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedWorks.map(w => (
                    <tr key={w.id} className="border-b text-black">
                      <td className="px-4 py-2 text-black">
                        <input type="checkbox" checked={selectedWorks.includes(w.id)} onChange={() => toggleSelectWork(w.id)} />
                      </td>
                      <td className="px-4 py-2 text-black">{w.client}</td>
                      <td className="px-4 py-2 text-black">{getDateWithDay(w.date)}</td>
                      <td className="px-4 py-2 text-black">{w.content}</td>
                      <td className="px-4 py-2 text-black">{w.issue || 'X'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {filteredWorks.length > 0 && (
              <div className="flex justify-center w-full mt-auto pt-8 items-center gap-2">
                <button
                  className="px-3 py-1 rounded border border-gray-300 bg-white text-black hover:bg-gray-100 transition disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  이전
                </button>
                <span className="text-sm text-gray-700 font-semibold flex items-center h-[32px] px-2">
                  {page} / {totalPages}
                </span>
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
        {/* 추가 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto" onClick={() => setShowAddModal(false)}>
            <form onClick={e => e.stopPropagation()} onSubmit={handleAddSubmit} className="bg-white p-8 rounded shadow-xl w-full max-w-xl flex flex-col gap-4 text-black border border-gray-300">
              <h2 className="text-xl font-bold mb-4 text-black">작업 내역 추가</h2>
              <div className="flex flex-col gap-4">
                {/* 1행: 고객사, 작업일 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm text-gray-700">고객사</label>
                    <select name="client" value={addForm.client} onChange={handleAddChange} className="p-2 border rounded text-black" required>
                      <option value="">선택</option>
                      {clients.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm text-gray-700">작업일</label>
                    <input name="date" type="date" value={addForm.date} onChange={handleAddChange} className="p-2 border rounded text-black" required />
                  </div>
                </div>
                {/* 2행: 작업내용 */}
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">작업내용</label>
                  <textarea name="content" value={addForm.content} onChange={handleAddChange} placeholder="작업내용" className="p-2 border rounded text-black h-24" required />
                </div>
                {/* 3행: 이슈 */}
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">이슈</label>
                  <input name="issue" value={addForm.issue} onChange={handleAddChange} placeholder="이슈" className="p-2 border rounded text-black" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 text-black rounded">취소</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
              </div>
            </form>
          </div>
        )}
        {/* 수정 모달 */}
        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto" onClick={() => setShowEditModal(false)}>
            <form onClick={e => e.stopPropagation()} onSubmit={handleEditSubmit} className="bg-white p-8 rounded shadow-xl w-full max-w-xl flex flex-col gap-4 text-black border border-gray-300">
              <h2 className="text-xl font-bold mb-4 text-black">작업 내역 수정</h2>
              <div className="flex flex-col gap-4">
                {/* 1행: 고객사, 작업일 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm text-gray-700">고객사</label>
                    <select name="client" value={editForm.client} onChange={handleEditChange} className="p-2 border rounded text-black" required>
                      <option value="">선택</option>
                      {clients.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm text-gray-700">작업일</label>
                    <input name="date" type="date" value={editForm.date} onChange={handleEditChange} className="p-2 border rounded text-black" required />
                  </div>
                </div>
                {/* 2행: 작업내용 */}
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">작업내용</label>
                  <textarea name="content" value={editForm.content} onChange={handleEditChange} placeholder="작업내용" className="p-2 border rounded text-black h-24" required />
                </div>
                {/* 3행: 이슈 */}
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">이슈</label>
                  <input name="issue" value={editForm.issue} onChange={handleEditChange} placeholder="이슈" className="p-2 border rounded text-black" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-200 text-black rounded">취소</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
              </div>
            </form>
          </div>
        )}
        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white p-6 rounded shadow-lg pointer-events-auto">
              <h3 className="text-lg font-bold text-black">삭제 확인</h3>
              <p className="text-black my-4">정말로 선택된 {selectedWorks.length}개의 작업 내역을 삭제하시겠습니까?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-200 text-black rounded">취소</button>
                <button onClick={confirmDeleteSelected} className="px-4 py-2 bg-red-600 text-white rounded">삭제</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 