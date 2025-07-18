import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/components/AuthProvider";
import BodyWrapper from "./BodyWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CSD Portal",
  description: "Cloud Solution Division Portal",
};

/**
 * 루트 레이아웃 컴포넌트
 * - 글로벌 스타일, 인증 Provider, BodyWrapper 적용
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={"bg-white min-h-screen flex " + inter.className}>
        <AuthProvider>
          <BodyWrapper>{children}</BodyWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
