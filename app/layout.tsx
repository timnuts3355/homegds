import type { Metadata, Viewport } from "next";
import "./globals.css";

// ============================================================
// ルートレイアウト（メタデータのみ）
// ============================================================

export const metadata: Metadata = {
  title: {
    default: "homegds - 家庭用在庫管理",
    template: "%s | homegds",
  },
  description: "家庭の食材・日用品を手軽に管理するPWAアプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "homegds",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f2524a",          // coral-500（新パレット）
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
