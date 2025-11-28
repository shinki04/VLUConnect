import LightRays from "@/components/LightRays";
import { TrendingHashtags } from "@/components/TrendingHashtags";
import * as React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <div className="w-full h-full fixed top-0 left-0 z-0 min-h-screen">
        {/* <Galaxy
          mouseRepulsion={false}
          mouseInteraction={false}
          density={1.5}
          glowIntensity={0.5}
          saturation={0.8}
          hueShift={240}
        /> */}
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
      <section className=" min-h-screen container mx-auto relative z-1">
        <div className="flex flex-col md:flex-row gap-3">
          <div>
            <TrendingHashtags className="md:sticky top-0" />
          </div>
          <div> {children}</div>
        </div>
      </section>
    </>
  );
}
