const solutions = [
  { name: 'AppDynamics', icon: '/appdynamics.png' },
  { name: 'Dynatrace', icon: '/dynatrace.png' },
  { name: 'Netscout', icon: '/netscout.png' },
  { name: 'New Relic', icon: '/newrelic.png' },
  { name: 'RWS', icon: '/rws.png' },
];

export default function DocsOverviewPage() {
  return (
    <div className="max-w-5xl mx-auto mt-12 p-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-8 text-black">Docs Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {solutions.map((solution) => (
          <div key={solution.name} className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow hover:shadow-md transition">
            <img src={solution.icon} alt={solution.name} className="h-12 w-12 mb-3" />
            <div className="font-semibold text-lg mb-2 text-black">{solution.name}</div>
            <a
              href={`/${solution.name.toLowerCase().replace(/ /g, '')}/docs`}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              {solution.name} Docs 바로가기
            </a>
          </div>
        ))}
      </div>
    </div>
  );
} 