"use client";

import React, { useState } from "react";
import { signInWithAzure, signInWithGithub } from "@/app/auth/action";
import { Github } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { ERROR_MESSAGES, ErrorMessageKey } from "@/types/login-error";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") as ErrorMessageKey | null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="loginBox">
      <div className="mb-4 flex flex-col items-center">
        <img src="/logo_white.png" alt="VLU Logo" className="logo" />
      </div>
      <h1 className="title">Login</h1>
      <form className="w-full flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            placeholder="email@vanlanguni.vn"
            className="input"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            className="input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <a href="#" className="forgot">Forgot Password?</a>
        </div>
        <button type="submit" className="signinBtn">Sign in</button>
      </form>

      <div className="divider">
        <hr className="dividerHr" />
        <span className="dividerText">or continue with</span>
        <hr className="dividerHr" />
      </div>

      {/* <button className="socialBtn" onClick={signInWithGithub}>
        <Github />
        <span>Sign in with GitHub</span>
      </button> */}
      <button className="socialBtn" onClick={signInWithAzure}>
        <span >Microsoft 365</span>
        <Image
          // src="/icons/azure/10018-icon-service-Azure-A.svg"
          src="/logo_Microsoft.png"
          alt="Azure Logo"
          width={30}
          height={30}
        />
        
      </button>

      {error && (
        <div className="text-red-600 font-medium mt-2">
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default}
        </div>
      )}
    </div>
  );
}
