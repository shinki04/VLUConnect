"use client";
import { Button } from "@repo/ui/components/button";
import React from "react";
import { toast } from "sonner";

import { useGetCurrentUser } from "@/hooks/useAuth";

export default function Tepm() {
  const { data } = useGetCurrentUser();

  return (
    <>
      <Button onClick={() => toast("Toast")}>Render Toast</Button>
      <p>Hello {data?.display_name}</p>
    </>
  );
}
