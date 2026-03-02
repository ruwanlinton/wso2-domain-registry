import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WSO2 Domain Registry",
  description: "Governed domain and subdomain management for WSO2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 flex flex-col min-h-full overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
