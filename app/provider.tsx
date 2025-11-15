"use client";

import { getQueryClient } from "@/lib/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

// import { SessionProvider } from 'next-auth/react'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Toaster />
        {/* <ToastHandler /> */}

        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
