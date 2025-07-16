"use client";
import { usePathname } from "next/navigation";

export default function BodyWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  return (
    <div className={isAuthPage ? "bg-gray-200 w-full min-h-screen" : "bg-gray-50 w-full min-h-screen"}>
      {children}
    </div>
  );
} 