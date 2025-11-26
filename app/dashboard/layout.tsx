import LightRays from "@/components/LightRays";
import { TrendingHashtags } from "@/components/TrendingHashtags";
import * as React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <div className="w-full h-full fixed top-0 left-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="custom-rays"
        />
      </div>
      <section className="container mx-auto relative z-1">
        <div className="flex flex-row gap-3">
          <div>
            <TrendingHashtags className="sticky top-0" />
          </div>
          <div> {children}</div>
        </div>
      </section>
    </>
  );
}
