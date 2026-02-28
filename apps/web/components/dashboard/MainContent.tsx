import * as React from "react";

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return <main className="flex flex-col gap-6">{children}</main>;
}
