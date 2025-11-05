"use client";
import React from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";

export default function Tepm() {
  return <Button onClick={() => toast("Toast")}>Render Toast</Button>;
}
