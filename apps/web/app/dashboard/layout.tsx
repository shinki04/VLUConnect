import Link from "next/link";
import * as React from "react";

import AppSidebar from "@/components/app-sidebar";
import LightRays from "@/components/LightRays";
import DashboardProvider from "@/components/providers/DashboardProvider";
import { TrendingHashtags } from "@/components/TrendingHashtags";

import { getCurrentUser } from "../actions/user";
import { signOut } from "../auth/action";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser();

  return (
    <>
      <div className="w-full h-full fixed top-0 left-0 z-0 min-h-screen pointer-events-none overflow-hidden">
        <LightRays raysOrigin="top-center" raysColor="#ffffff" raysSpeed={1.5}
          lightSpread={0.8} rayLength={1.2} followMouse mouseInfluence={0.1}
          noiseAmount={0.1} distortion={0.05} className="custom-rays opacity-40" />
      </div>

      {/* PROVIDER WRAP TOÀN BỘ */}
      <DashboardProvider currentUser={currentUser!}>
        {/* ... Dialog nằm trong main ... */}
        <section className="min-h-screen bg-background relative z-10 flex font-sans text-foreground">

          {/* Sidebar - TRONG Provider */}
          <AppSidebar currentUser={currentUser} onSignOut={signOut} />

          {/* Main Content */}
          {/* <main className="flex-1 md:ml-[260px] flex justify-center h-screen overflow-y-auto no-scrollbar"> */}
          <main className="flex-1 md:ml-[260px] flex justify-center /* h-screen */ /* overflow-y-auto */">

            <div className="w-full max-w-[1150px] grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 p-6 lg:p-8">
              <div className="w-full space-y-6">{children}</div>

              <aside className="hidden lg:flex flex-col space-y-6 sticky top-8 h-fit">
                <TrendingHashtags />
                <div className="text-center text-[11px] text-muted-foreground mt-2 px-4 leading-relaxed">
                  <Link href="/privacy" className="hover:text-sidebar hover:underline transition-colors">
                    Quyền riêng tư
                  </Link>
                  <span className="mx-1">•</span>
                  <Link href="/terms" className="hover:text-sidebar hover:underline transition-colors">
                    Điều khoản sử dụng
                  </Link>
                  <br />
                  VLUConnect © 2025
                </div>
              </aside>
            </div>
          </main>
        </section>
      </DashboardProvider>
    </>
  );
}
