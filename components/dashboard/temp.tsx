"use client";
import React, { useEffect } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useUserStore } from "@/stores/userStore";
import { User } from "@/types/user";
import { createClient } from "@/lib/supabase/client";
import { getUserProfile } from "@/app/actions/auth";
import { useToastFromCookie } from "@/hooks/useToastFromCookies";

export default function Tepm() {
  const toastCookies = useToastFromCookie();
  const userStore = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const loadUser = async () => {
      const profile = await getUserProfile();
      if (profile) setUser(profile);
    };

    loadUser();
  }, [setUser]);
  return (
    <>
      <Button onClick={() => toast("Toast")}>Render Toast</Button>
      <p>Hello {userStore?.display_name}</p>
    </>
  );
}
