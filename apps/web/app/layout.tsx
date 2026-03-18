import "./globals.css";

import { Metadata } from "next";

import Providers from "./provider";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Social",
  description: "A modern social media platform built with Next.js 16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`min-h-screen text-foreground bg-background font-sans text-sm sm:text-base md:text-lg antialiased`}
      >
        <main className="mx-auto min-h-screen flex flex-col">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
