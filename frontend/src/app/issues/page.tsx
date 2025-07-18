const solutions = [
  { name: 'AppDynamics', icon: '/appdynamics.png' },
  { name: 'Dynatrace', icon: '/dynatrace.png' },
  { name: 'Netscout', icon: '/netscout.png' },
  { name: 'New Relic', icon: '/newrelic.png' },
  { name: 'RWS', icon: '/rws.png' },
];

/**
 * 전체 이슈 오버뷰 페이지
 * - 솔루션별 이슈 게시판 진입 링크 제공
 */
export default function IssuesOverviewPage() {
  return (
    <>
      <div className="w-full bg-gray-100 py-3 px-8">
        <span className="text-black font-semibold text-lg">Issues Overview</span>
      </div>
      <div className="w-full mt-8 p-8 bg-white rounded shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {solutions.map((solution) => (
            <div key={solution.name} className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow hover:shadow-md transition">
              <img src={solution.icon} alt={solution.name} className="h-12 w-12 mb-3" />
              <div className="font-semibold text-lg mb-2 text-black">{solution.name}</div>
              <a
                href={`/${solution.name.toLowerCase().replace(/ /g, '')}/issues`}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                {solution.name} Issues 바로가기
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  );
} 