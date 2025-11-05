"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import * as React from "react";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { signInWithAzure, signInWithGithub } from "@/app/auth/action";

import { ERROR_MESSAGES, ErrorMessageKey } from "@/types/login-error";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") as ErrorMessageKey | null;
  return (
    <div>
      <Button onClick={signInWithGithub}>
        <span>
          <Github />
        </span>
        Click me
      </Button>
      <Button onClick={signInWithAzure}>
        <Image
          src="/icons/azure/10018-icon-service-Azure-A.svg"
          alt="Azure Logo"
          width={10}
          height={10}
        />
        <span></span>
        Login with azure
      </Button>
      {error && (
        <div className="text-red-600 font-medium mt-2">
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default}
        </div>
      )}
    </div>
  );
}
