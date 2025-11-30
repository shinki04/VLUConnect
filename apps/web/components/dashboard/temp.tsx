"use client";
import React from "react";
import { toast } from "sonner";

import { useGetCurrentUser } from "@/hooks/useAuth";

import { Button } from "../ui/button";

export default function Tepm() {
  const { data } = useGetCurrentUser();

  return (
    <>
      <Button onClick={() => toast("Toast")}>Render Toast</Button>
      <p>Hello {data?.display_name}</p>
    </>
  );
}
