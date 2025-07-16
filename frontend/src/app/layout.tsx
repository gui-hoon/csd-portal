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
