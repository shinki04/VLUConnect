"use client";

import { ToastHandler } from "@/components/ToastHandler";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
// import { QueryClientProvider } from '@tanstack/react-query'
// import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toaster />
      <ToastHandler />

      {children}
    </ThemeProvider>
  );
}
