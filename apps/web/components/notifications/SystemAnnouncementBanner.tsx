"use client";

import { Card } from "@repo/ui/components/card";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";

import { useSystemAnnouncements } from "@/hooks/useSystemAnnouncements";

const typeIcons = {
  info: <Info className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
};

const typeColors = {
  info: "border-blue-500/50 bg-blue-50/50 text-blue-900 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-200",
  warning:
    "border-yellow-500/50 bg-yellow-50/50 text-yellow-900 dark:bg-yellow-950/50 dark:border-yellow-800 dark:text-yellow-200",
  success:
    "border-green-500/50 bg-green-50/50 text-green-900 dark:bg-green-950/50 dark:border-green-800 dark:text-green-200",
  error:
    "border-red-500/50 bg-red-50/50 text-red-900 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200",
};

export function SystemAnnouncementBanner() {
  const { data: announcements = [] } = useSystemAnnouncements();

  const [closedIds, setClosedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Load closed ids from local storage
    const stored = localStorage.getItem("closed_announcements");
    if (stored) {
      try {
        const parsedIds = new Set<string>(JSON.parse(stored));
        setTimeout(() => setClosedIds(parsedIds), 0);
      } catch (e) {
        console.error(
          "Error parsing closed announcements from local storage",
          e,
        );
      }
    }
  }, []);

  const handleClose = (id: string) => {
    const updated = new Set(closedIds);
    updated.add(id);
    setClosedIds(updated);
    localStorage.setItem(
      "closed_announcements",
      JSON.stringify(Array.from(updated)),
    );

    // Automatically move to the next announcement if there are more
    if (currentIndex >= visibleAnnouncements.length - 1) {
      setCurrentIndex(Math.max(0, visibleAnnouncements.length - 2));
    }
  };

  const visibleAnnouncements = announcements.filter(
    (a) => !closedIds.has(a.id),
  );

  if (visibleAnnouncements.length === 0) return null;

  const current = visibleAnnouncements[currentIndex];
  // Ensure default type values
  const typeKey =
    current?.type && current.type in typeColors
      ? (current.type as keyof typeof typeColors)
      : "info";

  return (
    <div className="px-2 my-1 sticky top-16 z-50">
      <Card
        className={`relative w-full border-b px-4 py-2 my-2 ${typeColors[typeKey]} shadow-sm transition-all duration-300`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 min-w-0 items-center gap-2">
            <span className="shrink-0">{typeIcons[typeKey]}</span>

            <div className="text-sm min-w-0 wrap-break-word">
              <span className="font-semibold mr-2">{current?.title}</span>
              <span className="opacity-90">{current?.message}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {visibleAnnouncements.length > 1 && (
              <div className="flex items-center gap-1 text-xs opacity-70 border-r pr-2 border-current/30">
                <span>
                  {currentIndex + 1} / {visibleAnnouncements.length}
                </span>
                <button
                  onClick={() =>
                    setCurrentIndex(
                      (prev) =>
                        (prev - 1 + visibleAnnouncements.length) %
                        visibleAnnouncements.length,
                    )
                  }
                  className="hover:bg-black/10 dark:hover:bg-white/10 rounded px-1"
                >
                  &lt;
                </button>
                <button
                  onClick={() =>
                    setCurrentIndex(
                      (prev) => (prev + 1) % visibleAnnouncements.length,
                    )
                  }
                  className="hover:bg-black/10 dark:hover:bg-white/10 rounded px-1"
                >
                  &gt;
                </button>
              </div>
            )}
            <button
              onClick={() => current && handleClose(current.id)}
              className="hover:bg-black/10 dark:hover:bg-white/10 p-1 rounded-full transition-colors focus:outline-none"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
