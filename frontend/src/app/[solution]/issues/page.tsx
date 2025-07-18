'use client';
import { useState, useEffect, use } from 'react';
import { LayoutGrid, List, Search, MessageSquare, Calendar, User, AlertTriangle, CheckCircle, Clock, XCircle, Pencil, Trash } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useSearchParams, useRouter } from 'next/navigation';

type Client = { id: number; name: string; };
type Issue = { id: number; client: string; title: string; [key: string]: any };
type Comment = { id: number; author: string; content: string; created_at: string };

// 이슈 상태별 아이콘과 색상
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'resolved': return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'in_progress': return <Clock className="w-4 h-4 text-red-600" />;
    case 'waiting': return <Clock className="w-4 h-4 text-gray-600" />;
    default: return <Clock className="w-4 h-4 text-gray-600" />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'resolved': return '해결됨';
    case 'in_progress': return '진행중';
    case 'waiting': return '대기중';
    default: return '대기중';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'resolved': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-red-100 text-red-800';
    case 'waiting': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// 우선순위별 아이콘과 색상
const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    case 'low': return <AlertTriangle className="w-4 h-4 text-green-600" />;
    default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high': return '높음';
    case 'medium': return '보통';
    case 'low': return '낮음';
    default: return '보통';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
};

const getSolutionLabel = (val: string) => {
  if (!val) return '';
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
};

const getDateWithDay = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const day = days[date.getDay()];
  // YYYY-MM-DD만 추출
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d} (${day})`;
};

/**
 * 솔루션별 이슈 게시판 페이지
 * - 이슈 목록, 추가/수정/상세/댓글, 필터/검색/선택 등 상태 URL 동기화
 * - 타일/테이블 모드 지원
 */
export default function SolutionIssuesPage({ params }: { params: Promise<{ solution: string }> }) {
  const { solution } = use(params);
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<'tile'|'table'>('tile');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState(() => searchParams?.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams?.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(() => searchParams?.get('priority') || '');
  const [clientFilter, setClientFilter] = useState(() => searchParams?.get('client') || '');
  const [page, setPage] = useState(() => Number(searchParams?.get('page')) || 1);
  const pageSize = 9;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIssueIds, setSelectedIssueIds] = useState<number[]>([]);
  const [addForm, setAddForm] = useState({ title: '', client: '', assignee: '', priority: 'medium', status: 'in_progress', due_date: '', tags: '', content: '' });
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentCounts, setCommentCounts] = useState<{[id: number]: number}>({});
  const [editField, setEditField] = useState<'status' | 'priority' | null>(null);
  const [editComment, setEditComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteTargetComment, setDeleteTargetComment] = useState<Comment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', client: '', assignee: '', priority: 'medium', status: 'in_progress', due_date: '', tags: '', content: '' });

  // 솔루션별 고객사 목록 불러오기
  useEffect(() => {
    if (!solution) return;
    fetch(`/api/clients/solution/${solution}`)
      .then(res => res.json())
      .then(setClients);
  }, [solution]);

  // 이슈 목록 불러오기
  const fetchIssues = async () => {
    const paramsObj: any = {};
    if (statusFilter) paramsObj.status = statusFilter;
    if (priorityFilter) paramsObj.priority = priorityFilter;
    if (clientFilter) paramsObj.client = clientFilter;
    if (search) paramsObj.search = search;
    paramsObj.skip = (page - 1) * pageSize;
    paramsObj.limit = pageSize;
    const query = new URLSearchParams(paramsObj).toString();
    const res = await fetch(`/api/issues/${encodeURIComponent(solution)}?${query}`);
    if (res.ok) {
      const data = await res.json();
      setIssues(data);
      // 댓글 개수 fetch
      const counts: {[id: number]: number} = {};
      await Promise.all(data.map(async (issue: Issue) => {
        const cres = await fetch(`/issues/${encodeURIComponent(solution)}/${issue.id}/comments`);
        if (cres.ok) {
          const clist = await cres.json();
          counts[issue.id] = clist.length;
        } else {
          counts[issue.id] = 0;
        }
      }));
      setCommentCounts(counts);
    }
  };
  useEffect(() => { fetchIssues(); }, [solution, statusFilter, priorityFilter, clientFilter, search, page]);

  // 고유 고객사 목록
  const uniqueClients = [...new Set(issues.map(issue => issue.client))];

  // 이슈 등록
  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddForm(f => ({ ...f, [name]: value }));
  };
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = {
      ...addForm,
      tags: addForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      due_date: addForm.due_date ? new Date(addForm.due_date).toISOString() : null,
    };
    const res = await fetch(`/issues/${encodeURIComponent(solution)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAddModal(false);
      setAddForm({ title: '', client: '', assignee: '', priority: 'medium', status: 'in_progress', due_date: '', tags: '', content: '' });
      fetchIssues();
    }
  };

  // 이슈 상세/댓글 불러오기
  const handleIssueClick = async (issue: Issue) => {
    setSelectedIssueIds([issue.id]);
    setShowDetailModal(true);
    // 댓글 불러오기
    const res = await fetch(`/issues/${encodeURIComponent(solution)}/${issue.id}/comments`);
    if (res.ok) setComments(await res.json());
  };

  // 댓글 등록
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIssueIds.length === 0) return;
    const res = await fetch(`/issues/${encodeURIComponent(solution)}/${selectedIssueIds[0]}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue_id: selectedIssueIds[0], author: user?.name || '익명', content: commentInput }),
    });
    if (res.ok) {
      setCommentInput('');
      // 댓글 새로고침
      const res2 = await fetch(`/issues/${encodeURIComponent(solution)}/${selectedIssueIds[0]}/comments`);
      if (res2.ok) setComments(await res2.json());
    }
  };

  // 필터링/페이지네이션은 API에서 처리하므로, 아래는 단순 정렬만 유지
  const totalPages = Math.ceil(issues.length / pageSize);
  const pagedIssues = issues; // 이미 API에서 페이징됨

  const onEditCommentClick = (comment: Comment) => {
    setEditComment(comment);
    setEditContent(comment.content);
  };
  const onDeleteCommentClick = (comment: Comment) => {
    setDeleteTargetComment(comment);
    setShowDeleteConfirm(true);
  };

  const handleEditCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIssueIds.length === 0) return;
    const res = await fetch(`/issues/${encodeURIComponent(solution)}/${selectedIssueIds[0]}/comments/${editComment?.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...editComment, content: editContent }),
    });
    if (res.ok) {
      setEditComment(null);
      // 댓글 새로고침
      const res2 = await fetch(`/issues/${encodeURIComponent(solution)}/${selectedIssueIds[0]}/comments`);
      if (res2.ok) setComments(await res2.json());
    }
  };

  const handleDeleteCommentSubmit = async () => {
    if (selectedIssueIds.length === 0 || !deleteTargetComment) return;
    const res = await fetch(`/issues/${encodeURIComponent(solution)}/${selectedIssueIds[0]}/comments/${deleteTargetComment.id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) {
      setShowDeleteConfirm(false);
      setDeleteTargetComment(null);
      // 댓글 새로고침
      const res2 = await fetch(`/issues/${encodeURIComponent(solution)}/${selectedIssueIds[0]}/comments`);
      if (res2.ok) setComments(await res2.json());
    }
  };

  const handleIssueUpdate = async (field: 'status' | 'priority', value: string) => {
    if (selectedIssueIds.length === 0) return;

    const res = await fetch(`/issues/${encodeURIComponent(solution)}/${selectedIssueIds[0]}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ [field]: value }),
    });

    if (res.ok) {
      const updatedIssue = await res.json();
      setSelectedIssueIds([updatedIssue.id]);
      // 메인 목록 업데이트
      setIssues(prev => prev.map(issue => issue.id === updatedIssue.id ? updatedIssue : issue));
      setEditField(null);
    } else {
      // TODO: 에러 처리
      console.error("Failed to update issue");
    }
  };

  // 수정 버튼 클릭 시 선택된 이슈 값으로 editForm 초기화
  useEffect(() => {
    if (showEditModal && selectedIssueIds.length === 1) {
      const issue = issues.find(i => i.id === selectedIssueIds[0]);
      if (issue) {
        setEditForm({
          title: issue.title || '',
          client: issue.client || '',
          assignee: issue.assignee || '',
          priority: issue.priority || 'medium',
          status: issue.status || 'in_progress',
          due_date: issue.due_date ? issue.due_date.slice(0, 10) : '',
          tags: (issue.tags || []).join(', '),
          content: issue.content || '',
        });
      }
    }
  }, [showEditModal, selectedIssueIds, issues]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIssueIds.length !== 1) return;
    const form = {
      ...editForm,
      tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : null,
    };
    const res = await fetch(`/issues/${encodeURIComponent(solution)}/${selectedIssueIds[0]}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowEditModal(false);
      fetchIssues();
    }
  };

  // 필터/검색/페이지 변경 시 URL 쿼리 동기화
  const updateQuery = (next: Partial<{search: string, status: string, priority: string, client: string, page: number}>) => {
    const params = new URLSearchParams();
    params.set('page', String(next.page ?? page));
    if (next.search !== undefined ? next.search : search) params.set('search', next.search !== undefined ? next.search : search);
    if (next.status !== undefined ? next.status : statusFilter) params.set('status', next.status !== undefined ? next.status : statusFilter);
    if (next.priority !== undefined ? next.priority : priorityFilter) params.set('priority', next.priority !== undefined ? next.priority : priorityFilter);
    if (next.client !== undefined ? next.client : clientFilter) params.set('client', next.client !== undefined ? next.client : clientFilter);
    router.push(`/${solution}/issues?${params.toString()}`);
  };

  return (
    <>
      <div className="w-full bg-gray-100 py-3 px-8">
        <span className="text-black font-semibold text-lg">{getSolutionLabel(solution)} &gt; 이슈게시판</span>
      </div>
      <div className="w-full mt-8 p-8 bg-white rounded shadow flex flex-col min-h-[600px] relative">
        {/* 상단 검색 및 필터 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="제목, 내용, 고객사, 담당자 검색"
                value={search}
                onChange={e => { setSearch(e.target.value); updateQuery({search: e.target.value, page: 1}); }}
                className="border px-3 py-2 pl-10 rounded w-64 text-black"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); updateQuery({status: e.target.value, page: 1}); }}
              className="border px-3 py-2 rounded text-black"
            >
              <option value="">전체 상태</option>
              <option value="in_progress">진행중</option>
              <option value="waiting">대기중</option>
              <option value="resolved">해결됨</option>
            </select>
            <select
              value={priorityFilter}
              onChange={e => { setPriorityFilter(e.target.value); updateQuery({priority: e.target.value, page: 1}); }}
              className="border px-3 py-2 rounded text-black"
            >
              <option value="">전체 우선순위</option>
              <option value="high">높음</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
            </select>
            <select
              value={clientFilter}
              onChange={e => { setClientFilter(e.target.value); updateQuery({client: e.target.value, page: 1}); }}
              className="border px-3 py-2 rounded text-black"
            >
              <option value="">전체 고객사</option>
              {clients.map(client => (
                <option key={client.id} value={client.name}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-white text-black rounded border border-gray-300 hover:bg-gray-100 transition text-base font-medium">추가</button>
            <button
              onClick={() => setShowEditModal(true)}
              disabled={selectedIssueIds.length !== 1}
              className="px-4 py-2 bg-white text-black rounded border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50 text-base font-medium"
            >
              수정
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={selectedIssueIds.length === 0}
              className="px-4 py-2 bg-white text-black rounded border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50 text-base font-medium"
            >
              삭제
            </button>
            <button onClick={()=>setMode('tile')} className={`p-2 rounded bg-white text-black border border-gray-300 hover:bg-gray-100 transition ${mode==='tile' ? 'ring-2 ring-gray-400' : ''}`}>
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button onClick={()=>setMode('table')} className={`p-2 rounded bg-white text-black border border-gray-300 hover:bg-gray-100 transition ${mode==='table' ? 'ring-2 ring-gray-400' : ''}`}>
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 이슈 통계 */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-red-600 font-bold text-lg">{issues.filter(i => i.status === 'in_progress').length}</div>
            <div className="text-red-700 text-sm">진행중</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-gray-600 font-bold text-lg">{issues.filter(i => i.status === 'waiting').length}</div>
            <div className="text-gray-700 text-sm">대기중</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 font-bold text-lg">{issues.filter(i => i.status === 'resolved').length}</div>
            <div className="text-green-700 text-sm">해결됨</div>
          </div>
        </div>

        {/* 이슈 목록 */}
        {issues.length === 0 ? (
          <div className="flex items-center justify-center min-h-[300px] text-gray-500 text-lg">등록된 이슈가 없습니다.</div>
        ) : (
          <>
            {mode === 'tile' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {pagedIssues.map(issue => (
                  <div
                    key={issue.id}
                    className={`p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition cursor-pointer ${selectedIssueIds.includes(issue.id) ? '!bg-gray-200' : 'bg-white'}`}
                    onClick={() => setSelectedIssueIds(ids => ids.includes(issue.id) ? ids.filter(id => id !== issue.id) : [...ids, issue.id])}
                    onDoubleClick={() => handleIssueClick(issue)}
                  >
                    {/* 헤더 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(issue.priority)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                          {getPriorityLabel(issue.priority)}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                        {getStatusLabel(issue.status)}
                      </div>
                    </div>

                    {/* 제목 */}
                    <h3 className="font-bold text-lg mb-2 text-black line-clamp-2">{issue.title}</h3>

                    {/* 고객사 및 담당자 */}
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {issue.client}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {issue.assignee}
                      </div>
                    </div>

                    {/* 내용 미리보기 */}
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">{issue.content}</p>

                    {/* 태그 */}
                    <div className="flex flex-wrap gap-1 mb-3" style={{ minHeight: '28px' }}>
                      {issue.tags.length > 0
                        ? issue.tags.map((tag: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {tag}
                            </span>
                          ))
                        : null}
                    </div>

                    {/* 하단 정보 */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs text-gray-700">{getDateWithDay(issue.created_at || issue.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{commentCounts[issue.id] ?? 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full mt-4 text-left text-black">
                <thead>
                  <tr className="bg-gray-100 text-black">
                    <th className="px-4 py-2 text-black">우선순위</th>
                    <th className="px-4 py-2 text-black">제목</th>
                    <th className="px-4 py-2 text-black">고객사</th>
                    <th className="px-4 py-2 text-black">담당자</th>
                    <th className="px-4 py-2 text-black">상태</th>
                    <th className="px-4 py-2 text-black">등록일</th>
                    <th className="px-4 py-2 text-black">마감일</th>
                    <th className="px-4 py-2 text-black">댓글</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedIssues.map(issue => (
                    <tr 
                      key={issue.id} 
                      className={`border-b text-black hover:bg-gray-50 cursor-pointer ${selectedIssueIds.includes(issue.id) ? 'bg-gray-200' : ''}`}
                      onClick={() => setSelectedIssueIds(ids => ids.includes(issue.id) ? ids.filter(id => id !== issue.id) : [...ids, issue.id])}
                      onDoubleClick={() => handleIssueClick(issue)}
                    >
                      <td className="px-4 py-2 text-black">
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(issue.priority)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                            {getPriorityLabel(issue.priority)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-black font-medium">{issue.title}</td>
                      <td className="px-4 py-2 text-black">{issue.client}</td>
                      <td className="px-4 py-2 text-black">{issue.assignee}</td>
                      <td className="px-4 py-2 text-black">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                          {getStatusLabel(issue.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-black">{getDateWithDay(issue.created_at || issue.createdAt)}</td>
                      <td className="px-4 py-2 text-black">{getDateWithDay(issue.due_date || issue.dueDate)}</td>
                      <td className="px-4 py-2 text-black">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{commentCounts[issue.id] ?? 0}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 페이지네이션 */}
            {totalPages > 0 && (
              <div className="flex justify-center items-center mt-6 w-full">
                <button
                  className="px-3 py-1 rounded border border-gray-300 bg-white text-black hover:bg-gray-100 transition disabled:opacity-50"
                  onClick={() => { setPage(p => Math.max(1, p - 1)); updateQuery({page: Math.max(1, page - 1)}); }}
                  disabled={page === 1}
                >
                  이전
                </button>
                <span className="mx-4 text-sm text-gray-700 font-semibold">{page} / {totalPages}</span>
                <button
                  className="px-3 py-1 rounded border border-gray-300 bg-white text-black hover:bg-gray-100 transition disabled:opacity-50"
                  onClick={() => { setPage(p => Math.min(totalPages, p + 1)); updateQuery({page: Math.min(totalPages, page + 1)}); }}
                  disabled={page === totalPages}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}

        {/* 이슈 상세 모달 */}
        {showDetailModal && selectedIssueIds.length > 0 && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto" onClick={e => { if (e.target === e.currentTarget) setShowDetailModal(false); }}>
            <div className="bg-white p-8 rounded shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  {getPriorityIcon(issues.find(i => i.id === selectedIssueIds[0])?.priority || '')}
                  <h2 className="text-xl font-bold text-black">{issues.find(i => i.id === selectedIssueIds[0])?.title}</h2>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* 메타 정보 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600">고객사</span>
                  <span className="font-medium text-black">{issues.find(i => i.id === selectedIssueIds[0])?.client}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600">담당자</span>
                  <span className="font-medium text-black">{issues.find(i => i.id === selectedIssueIds[0])?.assignee}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600">등록일</span>
                  <span className="font-medium text-black">{getDateWithDay(issues.find(i => i.id === selectedIssueIds[0])?.created_at || issues.find(i => i.id === selectedIssueIds[0])?.createdAt)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600">마감일</span>
                  <span className="font-medium text-black">{getDateWithDay(issues.find(i => i.id === selectedIssueIds[0])?.due_date || issues.find(i => i.id === selectedIssueIds[0])?.dueDate)}</span>
                </div>
              </div>

              {/* 상태 및 우선순위 */}
              <div className="flex gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">우선순위:</span>
                  {editField === 'priority' ? (
                    <select
                      value={issues.find(i => i.id === selectedIssueIds[0])?.priority}
                      onChange={(e) => handleIssueUpdate('priority', e.target.value)}
                      onBlur={() => setEditField(null)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPriorityColor(issues.find(i => i.id === selectedIssueIds[0])?.priority || '')}`}
                      autoFocus
                    >
                      <option value="high">높음</option>
                      <option value="medium">보통</option>
                      <option value="low">낮음</option>
                    </select>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${getPriorityColor(issues.find(i => i.id === selectedIssueIds[0])?.priority || '')}`}
                      onClick={() => setEditField('priority')}
                    >
                      {getPriorityLabel(issues.find(i => i.id === selectedIssueIds[0])?.priority || '')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">상태:</span>
                  {editField === 'status' ? (
                    <select
                      value={issues.find(i => i.id === selectedIssueIds[0])?.status}
                      onChange={(e) => handleIssueUpdate('status', e.target.value)}
                      onBlur={() => setEditField(null)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(issues.find(i => i.id === selectedIssueIds[0])?.status || '')}`}
                      autoFocus
                    >
                      <option value="in_progress">진행중</option>
                      <option value="waiting">대기중</option>
                      <option value="resolved">해결됨</option>
                    </select>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${getStatusColor(issues.find(i => i.id === selectedIssueIds[0])?.status || '')}`}
                      onClick={() => setEditField('status')}
                    >
                      {getStatusLabel(issues.find(i => i.id === selectedIssueIds[0])?.status || '')}
                    </span>
                  )}
                </div>
              </div>

              {/* 태그 */}
              <div className="mb-6">
                <span className="text-sm text-gray-600 mb-2 block">태그:</span>
                <div className="flex flex-wrap gap-2">
                  {issues.find(i => i.id === selectedIssueIds[0])?.tags.map((tag: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 상세 내용 */}
              <div className="mb-6">
                <span className="text-sm text-gray-600 mb-2 block">상세 내용:</span>
                <div className="p-4 bg-gray-50 rounded text-black">
                  {issues.find(i => i.id === selectedIssueIds[0])?.content}
                </div>
              </div>

              {/* 댓글 섹션 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-black">댓글 ({comments.length})</span>
                </div>
                <div className="border rounded p-4">
                  <textarea 
                    placeholder="댓글을 입력하세요..."
                    className="w-full p-3 border rounded text-black resize-none"
                    rows={3}
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={handleCommentSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      댓글 작성
                    </button>
                  </div>
                </div>
              </div>

              {/* 댓글 목록 */}
              {comments.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {comments.map((c: Comment, i: number) => (
                    <div key={i} className="bg-gray-50 rounded p-2 text-sm text-black border">
                      <div className="font-semibold text-xs text-gray-600 mb-1 flex items-center gap-2">
                        {c.author} <span className="text-gray-400">{getDateWithDay(c.created_at || c.createdAt)}</span>
                        {user?.name === c.author && (
                          <span className="flex items-center gap-1 ml-2">
                            <button className="hover:text-blue-600 p-1" title="수정" onClick={() => onEditCommentClick(c)}><Pencil className="w-3 h-3" /></button>
                            <button className="hover:text-red-600 p-1" title="삭제" onClick={() => onDeleteCommentClick(c)}><Trash className="w-3 h-3" /></button>
                          </span>
                        )}
                      </div>
                      <div>{c.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm mt-4">등록된 댓글이 없습니다.</div>
              )}
            </div>
          </div>
        )}

        {/* 새 이슈 등록 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto" onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
            <div className="bg-white p-8 rounded shadow-xl w-full max-w-xl pointer-events-auto">
              <h2 className="text-xl font-bold mb-6 text-black">새 이슈 등록</h2>
              <form className="space-y-4" onSubmit={handleAddSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded text-black"
                    placeholder="이슈 제목을 입력하세요"
                    name="title"
                    value={addForm.title}
                    onChange={handleAddChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">고객사</label>
                    <select 
                      className="w-full p-3 border rounded text-black"
                      name="client"
                      value={addForm.client}
                      onChange={handleAddChange}
                    >
                      <option value="">선택</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.name}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded text-black"
                      placeholder="담당자명"
                      name="assignee"
                      value={addForm.assignee}
                      onChange={handleAddChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
                    <select 
                      className="w-full p-3 border rounded text-black"
                      name="priority"
                      value={addForm.priority}
                      onChange={handleAddChange}
                    >
                      <option value="high">높음</option>
                      <option value="medium">보통</option>
                      <option value="low">낮음</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                    <input 
                      type="date" 
                      className="w-full p-3 border rounded text-black"
                      name="due_date"
                      value={addForm.due_date}
                      onChange={handleAddChange}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded text-black"
                    placeholder="태그를 쉼표로 구분하여 입력"
                    name="tags"
                    value={addForm.tags}
                    onChange={handleAddChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
                  <textarea 
                    className="w-full p-3 border rounded text-black resize-none"
                    rows={4}
                    placeholder="이슈에 대한 상세 내용을 입력하세요"
                    name="content"
                    value={addForm.content}
                    onChange={handleAddChange}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition"
                  >
                    취소
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    등록
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && selectedIssueIds.length === 1 && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto" onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
            <div className="bg-white p-8 rounded shadow-xl w-full max-w-xl pointer-events-auto">
              <h2 className="text-xl font-bold mb-6 text-black">이슈 수정</h2>
              <form className="space-y-4" onSubmit={handleEditSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded text-black"
                    placeholder="이슈 제목을 입력하세요"
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">고객사</label>
                    <select 
                      className="w-full p-3 border rounded text-black"
                      name="client"
                      value={editForm.client}
                      onChange={handleEditChange}
                    >
                      <option value="">선택</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.name}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded text-black"
                      placeholder="담당자명"
                      name="assignee"
                      value={editForm.assignee}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
                    <select 
                      className="w-full p-3 border rounded text-black"
                      name="priority"
                      value={editForm.priority}
                      onChange={handleEditChange}
                    >
                      <option value="high">높음</option>
                      <option value="medium">보통</option>
                      <option value="low">낮음</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                    <input 
                      type="date" 
                      className="w-full p-3 border rounded text-black"
                      name="due_date"
                      value={editForm.due_date}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded text-black"
                    placeholder="태그를 쉼표로 구분하여 입력"
                    name="tags"
                    value={editForm.tags}
                    onChange={handleEditChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select 
                    className="w-full p-3 border rounded text-black"
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                  >
                    <option value="in_progress">진행중</option>
                    <option value="waiting">대기중</option>
                    <option value="resolved">해결됨</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
                  <textarea
                    className="w-full p-3 border rounded text-black"
                    placeholder="이슈 상세 내용을 입력하세요"
                    name="content"
                    value={editForm.content}
                    onChange={handleEditChange}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-200 text-black rounded">취소</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">수정</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none" onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}>
            <div className="bg-white p-6 rounded shadow-lg pointer-events-auto">
              <h3 className="text-lg font-bold text-black">삭제 확인</h3>
              <p className="text-black my-4">정말로 선택된 {selectedIssueIds.length}개의 이슈를 삭제하시겠습니까?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-200 text-black rounded">취소</button>
                <button
                  onClick={async () => {
                    for (const id of selectedIssueIds) {
                      await fetch(`/issues/${encodeURIComponent(solution)}/${id}`, { method: 'DELETE' });
                    }
                    setShowDeleteConfirm(false);
                    setSelectedIssueIds([]);
                    fetchIssues();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 