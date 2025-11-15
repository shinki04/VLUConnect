"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ERROR_MESSAGES, ErrorMessageKey } from "@/types/login-error";
import { signInWithAzure } from "@/app/auth/action";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") as ErrorMessageKey | null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="relative w-full max-w-md  px-4 sm:px-0">
      <Card className="relative bg-[rgba(181,41,52,0.55)] rounded-xl shadow-[0_6px_40px_rgba(0,0,0,0.25)] border border-white/10 backdrop-blur-lg overflow-hidden">
        <CardContent className="relative z-10 flex flex-col items-center p-6 sm:p-10 gap-2">
          <Image
            src="/logo_white.png"
            alt="VLU Logo"
            width={150}
            height={150}
            className="mb-3 sm:mb-5   "
          />

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 sm:mb-4">Login</h1>

          <form className="w-full flex flex-col gap-2 sm:gap-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="email" className="text-white mb-1 block font-semibold text-sm sm:text-base">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@vanlanguni.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/15 border border-white/30 text-white rounded-md placeholder-white/70 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-white mb-1 block font-semibold text-sm sm:text-base">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/15 border border-white/30 text-white rounded-md placeholder-white/70 text-sm sm:text-base"
              />
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-white text-xs sm:text-sm underline">
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full py-2 sm:py-3 bg-[#B52934] text-white font-bold rounded-md text-sm sm:text-base transition-colors duration-300 hover:bg-[#99252D]"
            >
              Sign in
            </Button>
          </form>

          <div className="w-full flex items-center gap-2 my-4 sm:my-6">
            <hr className="flex-1 h-px bg-white/30 border-0" />
            <span className="text-white text-xs sm:text-sm opacity-90">or continue with</span>
            <hr className="flex-1 h-px bg-white/30 border-0" />
          </div>

          <Button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-1.5 sm:py-2 bg-white text-[#B52934] font-bold rounded-lg border-2 border-[#B52934] hover:text-[#99252D] hover:border-[#99252D] hover:bg-white/90 transition-colors duration-300 text-sm sm:text-base"
            onClick={signInWithAzure}
          >
            <span>Microsoft 365</span>
            <Image src="/logo_Microsoft.png" alt="Azure Logo" width={24} height={24} className="sm:w-[30px] sm:h-[30px]" />
          </Button>

          {error && (
            <div className="text-red-600 font-semibold mt-4 text-center text-sm sm:text-base">
              {ERROR_MESSAGES[error] || ERROR_MESSAGES.default}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
