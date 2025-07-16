import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 환경 최적화
  swcMinify: true,
  experimental: {
    // 개발 시 성능 향상
    optimizePackageImports: ['lucide-react'],
  },
  // 개발 서버 최적화
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  // 이미지 최적화
  images: {
    unoptimized: true, // 개발 환경에서 이미지 최적화 비활성화
  },
  async rewrites() {
    return [
      {
        source: "/issues/:path*",
        destination: "http://10.10.19.189:8000/issues/:path*",
      },
      {
        source: "/clients/:path*",
        destination: "http://10.10.19.189:8000/clients/:path*",
      },
      {
        source: "/api/:path*",
        destination: "http://10.10.19.189:8000/:path*",
      },
    ];
  },
};

export default nextConfig;