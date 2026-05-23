import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "AI Trading Assistant | Phân tích XAUUSD bằng AI",
  description: "Hệ thống hỗ trợ phân tích giao dịch vàng (XAUUSD) bằng AI Gemini. Nhận tín hiệu Entry, Stop Loss, Take Profit chính xác.",
  keywords: ["XAUUSD", "gold trading", "AI trading", "forex", "phân tích vàng", "tín hiệu giao dịch"],
  openGraph: {
    title: "AI Trading Assistant | Phân tích XAUUSD bằng AI",
    description: "Hệ thống hỗ trợ phân tích giao dịch vàng (XAUUSD) bằng AI Gemini",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-gray-950 text-gray-100">{children}</body>
    </html>
  );
}
