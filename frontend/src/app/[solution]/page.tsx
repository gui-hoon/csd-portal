"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

/**
 * 솔루션별 대시보드 페이지
 * - 고객사, 작업, 이슈 등 주요 현황을 주차별로 시각화
 * - URL 쿼리(week)와 상태 동기화
 */
export default function SolutionDashboard() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const solution = params?.solution as string | undefined;
  const solutionLabel = solution ? solution.charAt(0).toUpperCase() + solution.slice(1).toLowerCase() : '';
  const [clientCount, setClientCount] = useState(0);
  const [workCount, setWorkCount] = useState(0);
  const [issueCount, setIssueCount] = useState(0);
  const [clientTypeData, setClientTypeData] = useState<{ labels: string[]; values: number[] }>({ labels: [], values: [] });
  const [workByDayData, setWorkByDayData] = useState<{ labels: string[]; values: number[] }>({ labels: ['월', '화', '수', '목', '금', '토', '일'], values: [0,0,0,0,0,0,0] });
  const [issueStatusData, setIssueStatusData] = useState<{ labels: string[]; values: number[] }>({ labels: ['진행중', '대기', '해결'], values: [0,0,0] });
  const [newClients, setNewClients] = useState<string[]>([]);
  const [mainWorks, setMainWorks] = useState<any[]>([]);
  const [openIssues, setOpenIssues] = useState<any[]>([]);
  const [openIssuePriorityCount, setOpenIssuePriorityCount] = useState({ high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [expiredClients, setExpiredClients] = useState<string[]>([]);

  // 오늘 날짜, 주차 계산 (간단 예시)
  const today = new Date().toLocaleDateString('ko-KR');
  // 주 단위 선택 상태
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const urlWeek = searchParams?.get('week');
    if (urlWeek) return urlWeek;
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil(((+now - +new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  });

  // 주차의 월~일 날짜 구하기
  function getWeekRangeDates(weekStr: string) {
    if (!weekStr) return { start: '', end: '' };
    const [year, week] = weekStr.split('-W');
    if (!year || !week) return { start: '', end: '' };
    const firstDay = new Date(Number(year), 0, 1);
    const dayOfWeek = firstDay.getDay();
    const dayOffset = (dayOfWeek <= 4 ? dayOfWeek - 1 : dayOfWeek - 8);
    const monday = new Date(Number(year), 0, 1 - dayOffset + (Number(week) - 1) * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday };
  }

  // 데이터 fetch 및 집계
  useEffect(() => {
    if (!solution) return;
    setLoading(true);
    setError(null);
    const { start, end } = getWeekRangeDates(selectedWeek);
    const startDate = start instanceof Date ? start.toISOString().slice(0,10) : '';
    const endDate = end instanceof Date ? end.toISOString().slice(0,10) : '';
    // 1. 고객사 fetch
    fetch(`/clients/solution/${solution}`)
      .then(res => res.json())
      .then(data => {
        // 선택한 주차(기간)에 등록되어 있는 고객사만 필터링
        const filteredClients = data.filter((c: any) => {
          if (!c.license_start || !c.license_end) return false;
          const startD = new Date(c.license_start);
          const endD = new Date(c.license_end);
          // license_start <= end && license_end >= start
          return startD <= end && endD >= start;
        });
        setClientCount(filteredClients.length);
        // 계약 유형별 집계 (필터링된 고객사 기준)
        const typeMap: Record<string, number> = {};
        filteredClients.forEach((c: any) => { typeMap[c.contract_type] = (typeMap[c.contract_type]||0)+1; });
        setClientTypeData({ labels: Object.keys(typeMap), values: Object.values(typeMap) });
        // 신규 고객사(최근 1주)
        const newList = data.filter((c: any) => {
          if (!c.created_at) return false;
          const d = new Date(c.created_at);
          return d >= start && d <= end;
        }).map((c: any) => c.name);
        setNewClients(newList.slice(0,5));
        // 라이선스 만료 고객사(만료일이 end 이하인 경우 모두 표시)
        const expiredList = data.filter((c: any) => {
          if (!c.license_end) return false;
          const d = new Date(c.license_end);
          return d <= end;
        }).map((c: any) => c.name);
        setExpiredClients(expiredList);
      })
      .catch(e => setError('고객사 데이터 오류'));
    // 2. 작업 fetch
    fetch(`http://10.10.19.189:8000/works/solution/${solution}?start=${startDate}&end=${endDate}`)
      .then(res => res.json())
      .then(data => {
        setWorkCount(data.length);
        // 요일별 집계
        const days = [0,0,0,0,0,0,0];
        data.forEach((w: any) => {
          const d = new Date(w.date);
          days[d.getDay()]++;
        });
        setWorkByDayData({ labels: ['일','월','화','수','목','금','토'], values: days });
        // 주요 작업(최근순, id 포함)
        setMainWorks(data.slice(0,5).map((w: any) => ({ id: w.id, client: w.client, content: w.content, date: w.date })));
      })
      .catch(e => setError('작업 데이터 오류'));
    // 3. 이슈 fetch
    fetch(`/issues/${solution}?start=${startDate}&end=${endDate}`)
      .then(res => res.json())
      .then(data => {
        setIssueCount(data.length);
        // 상태별 집계
        const statusMap: Record<string, number> = { '진행중':0, '대기':0, '해결':0 };
        data.forEach((i: any) => {
          if(i.status==='in_progress') statusMap['진행중']++;
          else if(i.status==='waiting') statusMap['대기']++;
          else if(i.status==='resolved') statusMap['해결']++;
        });
        setIssueStatusData({ labels: Object.keys(statusMap), values: Object.values(statusMap) });
        // 미해결 이슈 Top 5 → 미해결 이슈 전체 객체 배열로 저장
        const open = data.filter((i: any) => i.status !== 'resolved');
        setOpenIssues(open);
        // 우선순위별 집계
        const priorityCount = { high: 0, medium: 0, low: 0 };
        open.forEach((i: any) => {
          if (i.priority === 'high') priorityCount.high++;
          else if (i.priority === 'medium') priorityCount.medium++;
          else if (i.priority === 'low') priorityCount.low++;
        });
        setOpenIssuePriorityCount(priorityCount);
      })
      .catch(e => setError('이슈 데이터 오류'))
      .finally(() => setLoading(false));
  }, [solution, selectedWeek]);

  // Pie/Bar 차트 데이터 준비
  const pieClientTypeData = {
    labels: clientTypeData.labels,
    datasets: [{ data: clientTypeData.values, backgroundColor: ['#60a5fa', '#fbbf24', '#34d399', '#f87171', '#a78bfa', '#f472b6', '#facc15'] }]
  };
  const barWorkByDayData = {
    labels: workByDayData.labels,
    datasets: [{ label: '작업 건수', data: workByDayData.values, backgroundColor: '#60a5fa' }]
  };
  const pieIssueStatusData = {
    labels: issueStatusData.labels,
    datasets: [{
      data: issueStatusData.values,
      backgroundColor: [
        '#ef4444', // 진행중(빨강)
        '#9ca3af', // 대기중(회색)
        '#22c55e'  // 해결(초록)
      ]
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full bg-gray-100 py-3 px-8">
        <span className="text-black font-semibold text-lg">
          {solutionLabel ? `${solutionLabel} > 대시보드` : '대시보드'}
        </span>
      </div>
      <div className="w-full max-w-7xl mx-auto mt-8 p-8 bg-white rounded shadow border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <span className="text-gray-700 text-base font-medium">
            {getWeekRange(selectedWeek)}
          </span>
          <input
            id="week-picker"
            type="week"
            className="border px-3 py-2 rounded text-black"
            value={selectedWeek}
            onChange={e => {
              setSelectedWeek(e.target.value);
              router.push(`/${solution}?week=${e.target.value}`);
            }}
            style={{ width: 180 }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard title="전체 고객사" value={clientCount} />
          <SummaryCard title="이번주 작업" value={workCount} />
          <div className="bg-white rounded shadow border border-gray-200 p-6 flex flex-col items-center justify-center">
            <div className="text-gray-600 text-sm mb-2">이번주 이슈</div>
            <div className="text-2xl font-bold text-red-600">{issueCount}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded shadow border border-gray-200 p-6 flex flex-col items-center justify-between">
            <div className="text-gray-600 text-sm mb-2 font-semibold">계약 유형별 고객사</div>
            <div className="w-40 h-40 flex items-center justify-center mb-6">
              <Pie data={pieClientTypeData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
            </div>
            <div className="flex gap-2 text-xs text-black mt-auto">
              {clientTypeData.labels.map((l, i) => <span key={i}>{l}: {clientTypeData.values[i]}개</span>)}
            </div>
          </div>
          <div className="bg-white rounded shadow border border-gray-200 p-6 flex flex-col items-center justify-between col-span-2">
            <div className="text-gray-600 text-sm mb-2 font-semibold">요일별 작업 건수</div>
            <div className="w-full h-40 flex items-center justify-center mb-6">
              <Bar
                data={barWorkByDayData}
                options={{
                  plugins: { legend: { display: false } },
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        precision: 0
                      }
                    }
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-black mt-auto w-full justify-center">
              {workByDayData.labels.map((l, i) => <span key={i}>{l}: {workByDayData.values[i]}건</span>)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded shadow border border-gray-200 p-6 flex flex-col items-center justify-between">
            <div className="text-gray-600 text-sm mb-2 font-semibold">이슈 상태별</div>
            <div className="w-40 h-40 flex items-center justify-center mb-6">
              <Pie data={pieIssueStatusData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
            </div>
            <div className="flex gap-2 text-xs text-black mt-auto">
              {issueStatusData.labels.map((l, i) => <span key={i}>{l}: {issueStatusData.values[i]}건</span>)}
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <ListCard
              title="주요 작업 내역"
              items={mainWorks.map(w => `${w.client} ${w.content}`)}
              renderItem={(_, i) => {
                const w = mainWorks[i];
                return (
                  <li
                    key={w.id}
                    className="truncate max-w-full cursor-pointer hover:underline"
                    onClick={() => router.push(`/${solution}/works?week=${selectedWeek}&selected=${w.id}`)}
                  >
                    • {w.client} {w.content}
                  </li>
                );
              }}
            />
            <div className="bg-white rounded shadow border border-gray-200 p-6 flex flex-col items-center justify-center">
              <div className="text-gray-600 text-sm mb-2 font-semibold">미해결 이슈</div>
              <div className="flex flex-row items-center gap-4">
                <span className="text-base font-semibold">
                  <span className="text-orange-500">높음:</span> <span className="text-black">{openIssuePriorityCount.high}건</span>
                </span>
                <span className="text-base font-semibold">
                  <span className="text-yellow-400">보통:</span> <span className="text-black">{openIssuePriorityCount.medium}건</span>
                </span>
                <span className="text-base font-semibold">
                  <span className="text-green-600">낮음:</span> <span className="text-black">{openIssuePriorityCount.low}건</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <ListCard title="신규 고객사" items={newClients} />
            <ListCard title="라이선스 만료 고객사" items={expiredClients} renderItem={(item, i) => <li key={i} className="text-red-600 font-bold">• {item}</li>} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 요약 카드 컴포넌트
 * - 타이틀과 값 표시
 */
function SummaryCard({ title, value }: { title: string, value: number|string }) {
  return (
    <div className="bg-white rounded shadow border border-gray-200 p-6 flex flex-col items-center justify-center">
      <div className="text-gray-600 text-sm mb-2">{title}</div>
      <div className="text-2xl font-bold text-black">{value}</div>
    </div>
  );
}

/**
 * 리스트 카드 컴포넌트
 * - 타이틀과 리스트 항목 표시
 */
function ListCard({ title, items, renderItem }: { title: string, items: string[], renderItem?: (item: string, i: number) => React.ReactNode }) {
  return (
    <div className="bg-white rounded shadow border border-gray-200 p-6">
      <div className="text-gray-600 text-sm mb-2 font-semibold">{title}</div>
      <ul className="text-black text-sm space-y-1">
        {items.length === 0 ? <li className="text-gray-400">데이터 없음</li> : items.map((item, i) => renderItem ? renderItem(item, i) : <li key={i} className="truncate max-w-full">• {item}</li>)}
      </ul>
    </div>
  );
}

/**
 * 주차 문자열(YYYY-Www)로 날짜 범위(월~일) 반환
 */
function getWeekRange(weekStr: string) {
  // weekStr: 'YYYY-Www' 형식
  if (!weekStr) return '';
  const [year, week] = weekStr.split('-W');
  if (!year || !week) return '';
  // ISO week: 월요일 시작
  const firstDay = new Date(Number(year), 0, 1);
  const dayOfWeek = firstDay.getDay();
  const dayOffset = (dayOfWeek <= 4 ? dayOfWeek - 1 : dayOfWeek - 8); // ISO: 0(일)~6(토)
  const monday = new Date(Number(year), 0, 1 - dayOffset + (Number(week) - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} (${days[d.getDay()]})`;
  return `${format(monday)} ~ ${format(sunday)}`;
} 