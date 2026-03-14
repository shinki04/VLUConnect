"use client";

import { QueryClientProvider } from "@tanstack/react-query";
// import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { useToastFromCookie } from "@/hooks/useToastFromCookies";
import { getQueryClient } from "@/lib/react-query";

export default function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  useToastFromCookie();

  return (
    <QueryClientProvider client={queryClient}>
      {/* <ReactQueryDevtools /> */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Toaster />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
