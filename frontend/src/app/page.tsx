export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-8 py-32">
      <h1 className="text-3xl font-bold text-gray-900">CSD Portal에 오신 것을 환영합니다!</h1>
      <p className="text-gray-600 text-lg">APM/NPM 솔루션 통합 기술지원 플랫폼</p>
      <div className="flex gap-4 mt-4">
        <span className="bg-red-100 text-red-600 px-4 py-2 rounded-full font-semibold">AppDynamics</span>
        <span className="bg-red-100 text-red-600 px-4 py-2 rounded-full font-semibold">Dynatrace</span>
        <span className="bg-red-100 text-red-600 px-4 py-2 rounded-full font-semibold">Netscout</span>
        <span className="bg-red-100 text-red-600 px-4 py-2 rounded-full font-semibold">NewRelic</span>
        <span className="bg-red-100 text-red-600 px-4 py-2 rounded-full font-semibold">RWS</span>
      </div>
      <p className="text-gray-400 mt-8">좌측 메뉴와 상단 메뉴를 통해 각 기능을 이용하세요.</p>
    </div>
  );
}
