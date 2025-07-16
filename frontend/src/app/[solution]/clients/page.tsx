"use client";
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { List, LayoutGrid, FileText } from 'lucide-react';

// API 연동용 클라이언트 타입
type Client = {
  id: number;
  name: string;
  contract_type: string;
  license_type: string;
  license_start: string;
  license_end: string;
  manager_name: string;
  manager_email: string;
  manager_phone: string;
  location: string;
  note?: string;
  [key: string]: string | number | undefined;
};

const columns = [
  { key: 'name', label: '고객사' },
  { key: 'contract_type', label: '계약 종류' },
  { key: 'license_type', label: '라이선스 종류' },
  { key: 'license_start', label: '라이선스 시작일' },
  { key: 'license_end', label: '라이선스 종료일' },
  { key: 'manager_name', label: '담당자' },
  { key: 'manager_email', label: '담당자 메일' },
  { key: 'manager_phone', label: '담당자 연락처' },
  { key: 'location', label: '고객사 위치' },
  { key: 'memo', label: '메모' },
];

// 라이선스 종료일이 일주일 이내인지 판별하는 함수
const isLicenseEndingSoon = (license_end: string) => {
  if (!license_end || license_end === '9999-12-31') return false;
  const end = new Date(license_end);
  const now = new Date();
  const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 7 && diff >= 0;
};

// 라이선스 만료/임박 색상 판별 함수
const getLicenseStatusClass = (license_end: string) => {
  if (!license_end || license_end === '9999-12-31') return 'bg-gray-50 border-transparent';
  const end = new Date(license_end);
  const now = new Date();
  const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'border-red-500 bg-red-50'; // 만료
  if (diff <= 7) return 'border-orange-400 bg-orange-50'; // 7일 이내 임박
  return 'bg-gray-50 border-transparent';
};

export default function SolutionClientsPage() {
  const params = useParams();
  const solution = params?.solution as string | undefined;
  const { user } = useAuth();
  const [view, setView] = useState<'table' | 'tile'>('tile');
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [colWidths, setColWidths] = useState<number[]>(Array(columns.length).fill(140));
  const tableRef = useRef<HTMLTableElement>(null);
  const resizingCol = useRef<number | null>(null);
  const [page, setPage] = useState(1);
  const tablePageSize = 10;
  const tilePageSize = 9;
  const isTable = view === 'table';
  const pageSize = isTable ? tablePageSize : tilePageSize;
  const isAllClientsPage = !solution || solution === 'clients';
  const sortedClients = [...clients].sort((a, b) => {
    if (!a.license_start) return 1;
    if (!b.license_start) return -1;
    return new Date(a.license_start).getTime() - new Date(b.license_start).getTime();
  });
  const filteredClients = sortedClients.filter(
    c => c.name.includes(search) && (isAllClientsPage || c.solution === solution)
  );
  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const pagedClients = filteredClients.slice((page - 1) * pageSize, page * pageSize);

  // 권한 체크
  const canEdit = user && (user.role === 'admin' || user.role === 'editor');

  // 선택 토글
  const toggleSelect = (id: number) => {
    setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  };
  const allSelected = filteredClients.length > 0 && filteredClients.every(c => selected.includes(c.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelected([]);
    else setSelected(filteredClients.map(c => c.id));
  };

  // 컬럼 리사이즈 핸들러
  const startResize = (idx: number, e: React.MouseEvent) => {
    resizingCol.current = idx;
    document.body.style.cursor = 'col-resize';
  };
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol.current !== null && tableRef.current) {
        const idx = resizingCol.current;
        setColWidths(widths => {
          const newWidths = [...widths];
          newWidths[idx] = Math.max(60, newWidths[idx] + e.movementX);
          return newWidths;
        });
      }
    };
    const handleMouseUp = () => {
      resizingCol.current = null;
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // API에서 클라이언트 목록 불러오기
  useEffect(() => {
    fetch('http://10.10.19.189:8000/clients')
      .then(res => res.json())
      .then(setClients);
  }, []);

  // 추가 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    solution: solution || '',
    contract_type: '',
    license_type: '',
    license_start: '',
    license_end: '',
    manager_name: '',
    manager_email: '',
    manager_phone: '',
    location: '',
    memo: '',
  });

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setAddForm(f => {
      if (name === 'license_type' && value === '영구') {
        return { ...f, [name]: value, license_end: '9999-12-31' };
      } else if (name === 'license_type') {
        return { ...f, [name]: value, license_end: '' };
      } else if (name === 'license_end' && f.license_type === '영구') {
        // 영구일 때는 종료일을 강제로 9999-12-31로 고정
        return { ...f, license_end: '9999-12-31' };
      } else {
        return { ...f, [name]: value };
      }
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 빈 문자열을 null로 변환
    const payload = Object.fromEntries(
      Object.entries({ ...addForm, solution: solution || '' }).map(([k, v]) => [k, v === '' ? null : v])
    );
    console.log('전송값:', payload);
    const res = await fetch('http://10.10.19.189:8000/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowAddModal(false);
      // 전체 목록 새로고침
      fetch('http://10.10.19.189:8000/clients')
        .then(res => res.json())
        .then(setClients);
      setAddForm({
        name: '', solution: solution || '', contract_type: '', license_type: '', license_start: '', license_end: '',
        manager_name: '', manager_email: '', manager_phone: '', location: '', memo: '',
      });
    } else {
      alert('추가 실패');
    }
  };

  // Breadcrumb: 솔루션명 첫글자만 대문자, 나머지 소문자
  const solutionLabel = solution ? solution.charAt(0).toUpperCase() + solution.slice(1).toLowerCase() : '';

  // 메모 팝업 상태
  const [memoPopup, setMemoPopup] = useState<{ open: boolean; memo: string; anchorX?: number; anchorY?: number; anchorW?: number }>({ open: false, memo: '' });

  // 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ ...addForm });
  const [editId, setEditId] = useState<number|null>(null);
  const [alertInfo, setAlertInfo] = useState<{ open: boolean; message: string; type: 'warn'|'confirm'|'delete'; onConfirm?: () => void }>({ open: false, message: '', type: 'warn' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 수정 버튼 핸들러
  const handleEdit = () => {
    if (selected.length !== 1) {
      setAlertInfo({ open: true, message: '수정은 하나의 고객사만 선택해야 합니다.', type: 'warn' });
      return;
    }
    const client = clients.find(c => c.id === selected[0]);
    if (!client) return;
    setEditForm({ ...client });
    setEditId(client.id);
    setShowEditModal(true);
  };

  // 수정 폼 변경 핸들러
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditForm(f => {
      if (name === 'license_type' && value === '영구') {
        return { ...f, [name]: value, license_end: '9999-12-31' };
      } else if (name === 'license_type') {
        return { ...f, [name]: value, license_end: '' };
      } else if (name === 'license_end' && f.license_type === '영구') {
        return { ...f, license_end: '9999-12-31' };
      } else {
        return { ...f, [name]: value };
      }
    });
  };

  // 수정 폼 제출
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const payload = Object.fromEntries(
      Object.entries(editForm).map(([k, v]) => [k, v === '' ? null : v])
    );
    const res = await fetch(`http://10.10.19.189:8000/clients/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowEditModal(false);
      setEditId(null);
      setSelected([]);
      fetch('http://10.10.19.189:8000/clients')
        .then(res => res.json())
        .then(setClients);
    } else {
      alert('수정 실패');
    }
  };

  const handleDelete = () => {
    if (selected.length === 0) {
      setAlertInfo({ open: true, message: '삭제할 고객사를 선택하세요.', type: 'warn' });
      return;
    }
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
    try {
      for (const id of selected) {
        await fetch(`http://10.10.19.189:8000/clients/${id}`, { method: 'DELETE' });
      }
      setSelected([]);
      fetch('http://10.10.19.189:8000/clients')
        .then(res => res.json())
        .then(setClients);
    } catch (err) {
      console.error(err);
      alert('삭제 실패');
    }
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="w-full bg-gray-100 py-3 px-8">
        <span className="text-black font-semibold text-lg">
          {solutionLabel ? `${solutionLabel} > 고객사` : '고객사'}
        </span>
      </div>

      <div className="w-full mt-8 p-8 bg-white rounded shadow flex flex-col min-h-[600px] relative" style={{minHeight: '552px'}}>
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
          {!isAllClientsPage && (
            <div className="flex gap-2 items-center">
              {canEdit && (
                <>
                  <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-white text-black rounded border border-gray-300 hover:bg-gray-100 transition text-base font-medium">
                    추가
                  </button>
                  <button onClick={handleEdit} className="px-4 py-2 bg-white text-black rounded border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50 text-base font-medium" disabled={selected.length !== 1}>
                    수정
                  </button>
                  <button onClick={handleDelete} className="px-4 py-2 bg-white text-black rounded border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50 text-base font-medium" disabled={selected.length === 0}>
                    삭제
                  </button>
                </>
              )}
              <button onClick={() => setView('tile')} className={`p-2 rounded bg-white text-black border border-gray-300 hover:bg-gray-100 transition ${view === 'tile' ? 'ring-2 ring-gray-400' : ''}`}>
                <LayoutGrid />
              </button>
              <button onClick={() => setView('table')} className={`p-2 rounded bg-white text-black border border-gray-300 hover:bg-gray-100 transition ${view === 'table' ? 'ring-2 ring-gray-400' : ''}`}>
                <List />
              </button>
            </div>
          )}
        </div>

        {!isAllClientsPage && view === 'tile' ? (
          pagedClients.length === 0 ? (
            <div className="flex items-center justify-center min-h-[300px] text-gray-500 text-lg">등록된 고객사가 없습니다.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({length: 9}).map((_, idx) => (
                  pagedClients[idx] ? (
                    <div
                      key={pagedClients[idx].id}
                      className={`p-6 rounded-lg shadow hover:shadow-md transition flex flex-col gap-2 border min-h-[160px] ${selected.includes(pagedClients[idx].id) ? 'border-gray-700 bg-gray-200' : getLicenseStatusClass(pagedClients[idx].license_end)}`}
                      onClick={() => toggleSelect(pagedClients[idx].id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="relative">
                        {pagedClients[idx].memo && (
                          <button
                            className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200 z-10"
                            style={{ lineHeight: 0 }}
                            onClick={e => {
                              e.stopPropagation();
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setMemoPopup({ open: true, memo: pagedClients[idx].memo, anchorX: rect.left + rect.width / 2, anchorY: rect.top + window.scrollY + rect.height / 2, anchorW: rect.width });
                            }}
                            title="메모 보기"
                          >
                            <FileText className="w-5 h-5 text-gray-600" />
                          </button>
                        )}
                        <div className="font-bold text-lg mb-5 text-black">{pagedClients[idx].name}</div>
                        <div className="text-sm text-gray-800 mb-1">계약 종류: {pagedClients[idx].contract_type}</div>
                        <div className="text-sm text-gray-800 mb-1">라이선스 종류: {pagedClients[idx].license_type}</div>
                        <div className="text-sm text-gray-800 mb-1">라이선스: {pagedClients[idx].license_start} ~ {pagedClients[idx].license_end}</div>
                        {/*selected.includes(pagedClients[idx].id) && <div className="text-xs text-red-600">선택됨</div>*/}
                      </div>
                    </div>
                  ) : (
                    <div key={`empty-${idx}`} className="p-6 rounded-lg border-transparent bg-transparent" />
                  )
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center w-full absolute left-0 bottom-0 pb-8">
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
          )
        ) : !isAllClientsPage && view === 'table' ? (
          <div className="flex-1">
            <table ref={tableRef} className="w-full border-collapse text-sm text-black">
              <thead>
                <tr>
                  <th className="p-2 border-b border-gray-300 bg-gray-50 sticky left-0 z-10 w-12">
                    <input type="checkbox" onChange={toggleSelectAll} checked={allSelected} />
                  </th>
                  {columns.map((col, idx) => (
                    <th key={col.key} className="p-2 border-b border-gray-300 bg-gray-50 font-semibold relative" style={{ width: colWidths[idx], minWidth: 120, maxWidth: 600 }}>
                      <div className="flex items-center justify-between">
                        <span>{col.label}</span>
                        <div
                          className="w-1 h-full cursor-col-resize absolute right-0 top-0"
                          onMouseDown={e => startResize(idx, e)}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedClients.map(c => (
                  <tr key={c.id} className={`hover:bg-gray-100 transition ${getLicenseStatusClass(c.license_end)}`}>
                    <td className="p-2 border-b border-gray-200 sticky left-0 z-10 bg-inherit">
                      <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                    </td>
                    {columns.map(col => (
                      <td key={col.key} className="p-2 border-b border-gray-200">
                        {col.key === 'memo' ? (
                          c.memo ? (
                            <button
                              className="p-1 rounded hover:bg-gray-200 z-10"
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
                          ) : null
                        ) : (c[col.key] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isAllClientsPage && totalPages >= 1 && (
          <div className="flex justify-center items-center mt-6 w-full">
            <button
              className="px-3 py-1 rounded border border-gray-300 bg-white text-black hover:bg-gray-100 transition disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              이전
            </button>
            <span className="mx-4 text-sm text-gray-700 font-semibold">{page} / {totalPages || 1}</span>
            <button
              className="px-3 py-1 rounded border border-gray-300 bg-white text-black hover:bg-gray-100 transition disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
            >
              다음
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <form onSubmit={handleAddSubmit} className="bg-white p-8 rounded shadow-xl w-full max-w-xl flex flex-col gap-4 text-black border border-gray-300 pointer-events-auto">
            <h2 className="text-xl font-bold mb-4 text-black">고객사 추가</h2>
            <div className="flex flex-col gap-4">
              {/* 1행: 고객사명, 계약 종류, 라이선스 종류 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">고객사 명</label>
                  <input name="name" value={addForm.name ?? ''} onChange={handleAddChange} placeholder="고객사명" className="p-2 border rounded text-black" required/>
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">계약 종류</label>
                  <select name="contract_type" value={addForm.contract_type ?? ''} onChange={handleAddChange} className="p-2 border rounded text-black" required>
                    <option value="">선택</option>
                    <option value="PoC">PoC</option>
                    <option value="유지보수">유지보수</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">라이선스 종류 선택</label>
                  <select name="license_type" value={addForm.license_type ?? ''} onChange={handleAddChange} className="p-2 border rounded text-black" required>
                    <option value="">선택</option>
                    <option value="구독">구독</option>
                    <option value="영구">영구</option>
                  </select>
                </div>
              </div>
              {/* 2행: 라이선스 시작일, 라이선스 종료일 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">라이선스 시작일</label>
                  <input name="license_start" type="date" value={addForm.license_start ?? ''} onChange={handleAddChange} placeholder="라이선스 시작일" className="p-2 border rounded text-black" required/>
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">라이선스 종료일</label>
                  <input name="license_end" type="date" value={addForm.license_end ?? ''} onChange={handleAddChange} placeholder="라이선스 종료일" className="p-2 border rounded text-black" required disabled={addForm.license_type === '영구'} />
                </div>
              </div>
              {/* 3행: 담당자 이름, 담당자 이메일, 담당자 연락처 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">담당자 이름</label>
                  <input name="manager_name" value={addForm.manager_name ?? ''} onChange={handleAddChange} placeholder="담당자 이름" className="p-2 border rounded text-black" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">담당자 이메일</label>
                  <input name="manager_email" value={addForm.manager_email ?? ''} onChange={handleAddChange} placeholder="담당자 이메일" className="p-2 border rounded text-black" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">담당자 연락처</label>
                  <input name="manager_phone" value={addForm.manager_phone ?? ''} onChange={handleAddChange} placeholder="담당자 연락처" className="p-2 border rounded text-black" />
                </div>
              </div>
              {/* 4행: 고객사 위치, 메모 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">고객사 위치</label>
                  <input name="location" value={addForm.location ?? ''} onChange={handleAddChange} placeholder="고객사 위치" className="p-2 border rounded text-black" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">메모</label>
                  <textarea name="memo" value={addForm.memo ?? ''} onChange={handleAddChange} placeholder="메모" className="p-2 border rounded text-black h-24" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 text-black rounded">취소</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
            </div>
          </form>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <form onSubmit={handleEditSubmit} className="bg-white p-8 rounded shadow-xl w-full max-w-xl flex flex-col gap-4 text-black border border-gray-300 pointer-events-auto">
            <h2 className="text-xl font-bold mb-4 text-black">고객사 수정</h2>
            <div className="flex flex-col gap-4">
              {/* 1행: 고객사명, 계약 종류, 라이선스 종류 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">고객사명</label>
                  <input name="name" value={editForm.name ?? ''} onChange={handleEditChange} placeholder="고객사명" className="p-2 border rounded text-black" required />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">계약 종류</label>
                  <select name="contract_type" value={editForm.contract_type ?? ''} onChange={handleEditChange} className="p-2 border rounded text-black" required>
                    <option value="">선택</option>
                    <option value="PoC">PoC</option>
                    <option value="유지보수">유지보수</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">라이선스 종류 선택</label>
                  <select name="license_type" value={editForm.license_type ?? ''} onChange={handleEditChange} className="p-2 border rounded text-black" required>
                    <option value="">선택</option>
                    <option value="구독">구독</option>
                    <option value="영구">영구</option>
                  </select>
                </div>
              </div>
              {/* 2행: 라이선스 시작일, 라이선스 종료일 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">라이선스 시작일</label>
                  <input name="license_start" type="date" value={editForm.license_start ?? ''} onChange={handleEditChange} placeholder="라이선스 시작일" className="p-2 border rounded text-black" required/>
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">라이선스 종료일</label>
                  <input name="license_end" type="date" value={editForm.license_end ?? ''} onChange={handleEditChange} placeholder="라이선스 종료일" className="p-2 border rounded text-black" required disabled={editForm.license_type === '영구'} />
                </div>
              </div>
              {/* 3행: 담당자 이름, 담당자 이메일, 담당자 연락처 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">담당자 이름</label>
                  <input name="manager_name" value={editForm.manager_name ?? ''} onChange={handleEditChange} placeholder="담당자 이름" className="p-2 border rounded text-black" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">담당자 이메일</label>
                  <input name="manager_email" value={editForm.manager_email ?? ''} onChange={handleEditChange} placeholder="담당자 이메일" className="p-2 border rounded text-black" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">담당자 연락처</label>
                  <input name="manager_phone" value={editForm.manager_phone ?? ''} onChange={handleEditChange} placeholder="담당자 연락처" className="p-2 border rounded text-black" />
                </div>
              </div>
              {/* 4행: 고객사 위치, 메모 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">고객사 위치</label>
                  <input name="location" value={editForm.location ?? ''} onChange={handleEditChange} placeholder="고객사 위치" className="p-2 border rounded text-black" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700">메모</label>
                  <textarea name="memo" value={editForm.memo ?? ''} onChange={handleEditChange} placeholder="메모" className="p-2 border rounded text-black h-24" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-200 text-black rounded">취소</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
            </div>
          </form>
        </div>
      )}

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
              width: 384,
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

      {alertInfo.open && (
        <div className="fixed left-1/2 top-8 z-50" style={{ transform: 'translateX(-50%)' }}>
          <div className={`p-4 rounded shadow-lg text-white ${alertInfo.type === 'warn' ? 'bg-red-500' : 'bg-blue-500'}`}>
            <p>{alertInfo.message}</p>
            <div className="flex justify-end mt-2">
              <button onClick={() => setAlertInfo({ ...alertInfo, open: false })} className="px-2 py-1 bg-white text-black rounded text-sm">닫기</button>
              {alertInfo.type === 'confirm' && alertInfo.onConfirm && (
                <button onClick={() => { alertInfo.onConfirm!(); setAlertInfo({ ...alertInfo, open: false }); }} className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-sm">확인</button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white p-6 rounded shadow-lg pointer-events-auto">
            <h3 className="text-lg font-bold text-black">삭제 확인</h3>
            <p className="text-black my-4">정말로 선택된 {selected.length}개의 고객사를 삭제하시겠습니까?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-200 text-black rounded">취소</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded">삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 