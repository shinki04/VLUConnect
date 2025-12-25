"use client";

import * as React from "react";

interface RefreshContextValue {
  refreshKey: number;
  triggerRefresh: () => void;
}

const RefreshContext = React.createContext<RefreshContextValue | null>(null);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = React.useState(0);

  const triggerRefresh = React.useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = React.useContext(RefreshContext);
  if (!context) {
    // Return a default value instead of throwing to allow usage outside provider
    return { refreshKey: 0, triggerRefresh: () => {} };
  }
  return context;
}
