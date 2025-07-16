"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function AccountPage() {
  const { user, token, login } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(members.length / pageSize);
  const sortedMembers = useMemo(() =>
    [...members].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko-KR')),
    [members]
  );
  const pagedMembers = sortedMembers.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (user?.role !== "admin" || !token) return;
    fetch("/api/account/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setMembers(data));
  }, [user, token]);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/account/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
        }),
      });
      if (!res.ok) throw new Error("수정에 실패했습니다.");
      const data = await res.json();
      login(token!, data, undefined); // user 정보 갱신, 리다이렉트 없음
      setSuccess("수정이 완료되었습니다.");
      setEditMode(false);
    } catch (e: any) {
      setError(e.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/account/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: form.password,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (err.detail === "기존 비밀번호와 다른 비밀번호를 입력해 주세요.") {
          setError(err.detail);
        } else {
          setError("비밀번호 변경에 실패했습니다.");
        }
        setLoading(false);
        return;
      }
      setSuccess("비밀번호가 변경되었습니다.");
      setShowPasswordInput(false);
      setForm(f => ({ ...f, password: "" }));
    } catch (e: any) {
      setError(e.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // success 메시지 자동 제거 핸들러
  const handleEditMode = () => {
    setEditMode(true);
    setSuccess("");
    setError("");
  };
  const handleCancel = () => {
    setEditMode(false);
    setSuccess("");
    setError("");
  };
  const handleShowPasswordInput = () => {
    setShowPasswordInput(true);
    setSuccess("");
    setError("");
  };
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, password: e.target.value }));
    setSuccess("");
    setError("");
  };

  // 권한 변경 핸들러 (UI만)
  const handleRoleChange = (id: number, newRole: string) => {
    setMembers(members => members.map(m => m.id === id ? { ...m, role: newRole } : m));
  };
  // 승인 핸들러 (UI만)
  const handleApprove = async (id: number) => {
    if (!token) return;
    const res = await fetch("/api/account/users/activate", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: id }),
    });
    if (res.ok) {
      setMembers(members => members.map(m => m.id === id ? { ...m, is_active: true } : m));
    }
  };

  const handlePrevPage = () => setPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setPage(p => Math.min(totalPages, p + 1));
  const handlePageClick = (n: number) => setPage(n);

  return (
    <>
      {user?.role !== "admin" && (
        <div className="flex justify-center items-start min-h-[60vh] mt-12">
          <div className="max-w-sm w-full p-8 bg-white rounded shadow mb-8 md:mb-0">
            <h1 className="text-2xl font-bold mb-6 text-black">내 정보</h1>
            <div className="space-y-6">
              {/* 이름 */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">이름</label>
                {editMode ? (
                  <input
                    className="p-2 border rounded w-full text-black"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                ) : (
                  <div className="text-gray-900 text-base">{user?.name}</div>
                )}
              </div>
              {/* 이메일 */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">이메일</label>
                {editMode ? (
                  <input
                    className="p-2 border rounded w-full text-black"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                ) : (
                  <div className="text-gray-900 text-base">{user?.email}</div>
                )}
              </div>
              {/* 권한 */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">권한</label>
                <div className="text-gray-900 text-base">{user?.role}</div>
              </div>
              {/* 비밀번호 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-700 font-semibold font-bold">비밀번호</label>
                  {showPasswordInput && (
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 bg-gray-200 text-black rounded text-sm font-bold whitespace-nowrap"
                        onClick={e => { e.preventDefault(); setShowPasswordInput(false); setForm(f => ({ ...f, password: "" })); setSuccess(""); }}
                      >
                        취소
                      </button>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold whitespace-nowrap"
                        onClick={e => { e.preventDefault(); handlePasswordChange(); }}
                      >
                        변경
                      </button>
                    </div>
                  )}
                </div>
                {showPasswordInput ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="password"
                      className="p-2 border rounded flex-1 text-black"
                      value={form.password}
                      onChange={handlePasswordInputChange}
                      placeholder="새 비밀번호 입력"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 text-base tracking-widest">••••••••</span>
                    <button
                      className="text-blue-600 text-sm underline hover:text-blue-800"
                      onClick={e => { e.preventDefault(); handleShowPasswordInput(); }}
                    >
                      비밀번호 변경
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-8">
              {editMode ? (
                <>
                  <button className="px-4 py-2 bg-gray-200 text-black rounded text-sm font-bold whitespace-nowrap" onClick={handleCancel}>취소</button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold whitespace-nowrap" onClick={handleSave} disabled={loading}>{loading ? "저장중..." : "저장"}</button>
                </>
              ) : (
                <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold whitespace-nowrap" onClick={handleEditMode}>수정</button>
              )}
            </div>
            {error && <div className="text-red-500 mt-2">{error}</div>}
            {success && <div className="text-green-600 mt-2">{success}</div>}
          </div>
        </div>
      )}
      {user?.role === "admin" && (
        <div className="max-w-6xl mx-auto mt-12 flex flex-col md:flex-row gap-8">
          {/* 내 정보 */}
          <div className="max-w-sm w-full p-8 bg-white rounded shadow mb-8 md:mb-0">
            <h1 className="text-2xl font-bold mb-6 text-black">내 정보</h1>
            <div className="space-y-6">
              {/* 이름 */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">이름</label>
                {editMode ? (
                  <input
                    className="p-2 border rounded w-full text-black"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                ) : (
                  <div className="text-gray-900 text-base">{user?.name}</div>
                )}
              </div>
              {/* 이메일 */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">이메일</label>
                {editMode ? (
                  <input
                    className="p-2 border rounded w-full text-black"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                ) : (
                  <div className="text-gray-900 text-base">{user?.email}</div>
                )}
              </div>
              {/* 권한 */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">권한</label>
                <div className="text-gray-900 text-base">{user?.role}</div>
              </div>
              {/* 비밀번호 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-700 font-semibold font-bold">비밀번호</label>
                  {showPasswordInput && (
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 bg-gray-200 text-black rounded text-sm font-bold whitespace-nowrap"
                        onClick={e => { e.preventDefault(); setShowPasswordInput(false); setForm(f => ({ ...f, password: "" })); setSuccess(""); }}
                      >
                        취소
                      </button>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold whitespace-nowrap"
                        onClick={e => { e.preventDefault(); handlePasswordChange(); }}
                      >
                        변경
                      </button>
                    </div>
                  )}
                </div>
                {showPasswordInput ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="password"
                      className="p-2 border rounded flex-1 text-black"
                      value={form.password}
                      onChange={handlePasswordInputChange}
                      placeholder="새 비밀번호 입력"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 text-base tracking-widest">••••••••</span>
                    <button
                      className="text-blue-600 text-sm underline hover:text-blue-800"
                      onClick={e => { e.preventDefault(); handleShowPasswordInput(); }}
                    >
                      비밀번호 변경
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-8">
              {editMode ? (
                <>
                  <button className="px-4 py-2 bg-gray-200 text-black rounded text-sm font-bold whitespace-nowrap" onClick={handleCancel}>취소</button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold whitespace-nowrap" onClick={handleSave} disabled={loading}>{loading ? "저장중..." : "저장"}</button>
                </>
              ) : (
                <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold whitespace-nowrap" onClick={handleEditMode}>수정</button>
              )}
            </div>
            {error && <div className="text-red-500 mt-2">{error}</div>}
            {success && <div className="text-green-600 mt-2">{success}</div>}
          </div>
          {/* 회원 정보 (admin만) */}
          <div className="flex-[3] min-w-0 max-w-5xl w-full p-8 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4 text-black">회원 정보</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded shadow">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-black">이름</th>
                    <th className="py-2 px-4 border-b text-black">이메일</th>
                    <th className="py-2 px-4 border-b text-black">권한</th>
                    <th className="py-2 px-4 border-b text-black">상태</th>
                    <th className="py-2 px-4 border-b text-black">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMembers.map(member => (
                    <tr key={member.id} className="text-center text-black">
                      <td className="py-2 px-4 border-b text-black min-w-[70px] whitespace-nowrap">{member.name}</td>
                      <td className="py-2 px-4 border-b text-black min-w-[180px] whitespace-nowrap">{member.email}</td>
                      <td className="py-2 px-4 border-b text-black min-w-[60px] whitespace-nowrap">
                        {member.id === user?.id ? (
                          <span className="text-black">{member.role}</span>
                        ) : (
                          <select
                            className="border rounded px-2 py-1 text-black"
                            value={member.role}
                            onChange={async e => {
                              const newRole = e.target.value;
                              const res = await fetch("/api/account/users/role", {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ user_id: member.id, role: newRole }),
                              });
                              if (res.ok) {
                                setMembers(members => members.map(m => m.id === member.id ? { ...m, role: newRole } : m));
                              }
                            }}
                            disabled={!member.is_active}
                          >
                            <option value="admin">admin</option>
                            <option value="editor">editor</option>
                            <option value="viewer">viewer</option>
                          </select>
                        )}
                      </td>
                      <td className="py-2 px-4 border-b text-black min-w-[60px] whitespace-nowrap">
                        {member.is_active ? (
                          <span className="text-green-600 font-bold">승인됨</span>
                        ) : (
                          <span className="text-gray-400">대기중</span>
                        )}
                      </td>
                      <td className="py-2 px-4 border-b text-black min-w-[60px] whitespace-nowrap">
                        {!member.is_active && (
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-bold"
                            onClick={() => handleApprove(member.id)}
                          >
                            승인
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* 페이지네이션: 회원 1명 이상일 때만 표시, 0명일 때는 표시 X */}
            {members.length > 0 && (
              <div className="flex justify-center items-center mt-6 w-full">
                <button
                  className="px-3 py-1 rounded border border-gray-300 bg-white text-black hover:bg-gray-100 transition disabled:opacity-50"
                  onClick={handlePrevPage}
                  disabled={page === 1}
                >
                  이전
                </button>
                <span className="mx-4 text-sm text-gray-700 font-semibold">{page} / {totalPages || 1}</span>
                <button
                  className="px-3 py-1 rounded border border-gray-300 bg-white text-black hover:bg-gray-100 transition disabled:opacity-50"
                  onClick={handleNextPage}
                  disabled={page === totalPages || totalPages === 0}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 