"use client";

import { Card } from "@repo/ui/components/card";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";

import { getActiveAnnouncements } from "@/app/actions/notifications";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
}

const typeIcons = {
  info: <Info className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
};

const typeClasses = {
  info: "glass-info text-blue-900 dark:text-blue-100",
  warning: "glass-warning text-yellow-900 dark:text-yellow-100",
  success: "glass-success text-green-900 dark:text-green-100",
  error: "glass-error text-red-900 dark:text-red-100",
};

export function SystemAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [closedIds, setClosedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchActive = async () => {
      const data = await getActiveAnnouncements();

      // Load closed ids from local storage
      const stored = localStorage.getItem("closed_announcements");
      if (stored) {
        try {
          setClosedIds(new Set(JSON.parse(stored)));
        } catch (e) {
          console.error(
            "Error parsing closed announcements from local storage",
            e,
          );
        }
      }

      setAnnouncements(data || []);
    };

    fetchActive();
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
    current?.type && current.type in typeClasses
      ? (current.type as keyof typeof typeClasses)
      : "info";

  return (
    <div className="px-2 my-1 sticky top-16 z-50">
      <Card
        className={`relative w-full rounded-2xl overflow-hidden glass-surface border-0 px-4 py-2 my-2 bg-liquid ${typeClasses[typeKey]} transition-all duration-300`}
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
