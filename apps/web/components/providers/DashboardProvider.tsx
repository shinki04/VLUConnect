import React from "react";

interface DashboardProviderProps {
  children: React.ReactNode;
}

function DashboardProvider({ children }: DashboardProviderProps) {
  return <div>{children}</div>;
}

export default DashboardProvider;
