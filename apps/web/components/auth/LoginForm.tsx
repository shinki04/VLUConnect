"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React from "react";

import { signInWithAzure } from "@/app/auth/action";
import { Button } from "@/components/ui/button";
import { ERROR_MESSAGES, ErrorMessageKey } from "@/types/login-error";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") as ErrorMessageKey | null;

  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center bg-transparent py-4 px-2">
      {/* Main Login Card */}
      <div className="bg-mainred-blur w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-lg flex flex-col items-center">
        <div className="w-full flex flex-col items-center px-4 py-8 sm:px-8 sm:py-10 gap-6">{/* Logo lớn & đẹp */}
          <Image
            src="/logo_white.png"
            alt="VLU Logo"
            width={120}
            height={120}
            className="mb-2"
          />

          {/* Tiêu đề */}
          <h2 className="px-2 py-0 text-xl sm:text-2xl font-bold text-custom-white text-center tracking-tight whitespace-nowrap">
            Student & Staff Login
          </h2>

          {/* Description với 2 line ở hai bên */}
          <div className="flex items-center w-full gap-2 my-3">
            <div className="h-px flex-1 bg-white/30 rounded-full max-w-[40px] sm:max-w-[60px]" />
            <p className="px-2 text-custom-white/80 text-center text-sm sm:text-base leading-snug font-light">
              Please use your official university
              <br />Microsoft account to sign in.
            </p>
            <div className="h-px flex-1 bg-white/30 rounded-full max-w-[40px] sm:max-w-[60px]" />
          </div>

          {/* Microsoft 365 Button */}
          <Button
            type="button"
            className="btn-mainred w-full flex items-center justify-center gap-2 py-2 bg-custom-white text-mainred text-sm sm:text-base font-bold rounded-lg border-2 border-mainred hover:text-[#99252D] hover:border-[#99252D] hover:bg-custom-white/90 transition-all duration-300"
            onClick={signInWithAzure}
          >
            <span>Microsoft 365</span>
            <Image
              src="/logo_Microsoft.png"
              alt="Azure Logo"
              width={21}
              height={21}
              className="sm:w-[26px] sm:h-[26px]"
            />
          </Button>

          {error && (
            <div className="text-destructive font-semibold mt-3 text-center text-xs sm:text-sm">
              {ERROR_MESSAGES[error] || ERROR_MESSAGES.default}
            </div>
          )}

          {/* Support Link */}
          <p className="text-custom-white/70 text-xs text-center mt-2">
            Trouble logging in?{" "}
            <a
              href="#"
              className="underline hover:text-custom-white transition-colors"
            >
              Contact IT Support
            </a>
          </p>
        </div>
      </div>

      {/* Footer Card */}
      <div className="bg-mainred-blur w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-md flex flex-col items-center mt-7 mb-4">
        <div className="w-full flex flex-col items-center px-4 py-4 gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-custom-white text-center">
            Welcome to the VLU Connect
          </h3>

          {/* Footer links với 2 line hai bên */}
          <div className="flex items-center w-full justify-center gap-2 mb-1">
            <div className="h-px flex-1 bg-white/20 rounded-full max-w-[28px] sm:max-w-[50px]" />
            <div className="flex items-center gap-2 text-custom-white/80 text-xs sm:text-sm">
              <a href="#" className="hover:text-custom-white underline">Privacy Policy</a>
              <span className="text-custom-white/40">•</span>
              <a href="#" className="hover:text-custom-white underline">Terms of Service</a>
            </div>
            <div className="h-px flex-1 bg-white/20 rounded-full max-w-[28px] sm:max-w-[50px]" />
          </div>

          <p className="text-custom-white/60 text-[12px] sm:text-xs text-center">
            © 2025 Van Lang University. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
