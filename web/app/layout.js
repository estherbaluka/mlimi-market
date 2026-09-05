import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata = {
  title: "Mlimi Market — Farm Marketplace",
  description: "Mlimi Market connects farmers and buyers for fresh farm produce.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page">
        <QueryProvider>
          <Header />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
