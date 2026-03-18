import { Skeleton } from "@repo/ui/components/skeleton";
import React from "react";

function LoadingChatWindow() {
  return (
    <>
      {" "}
      {/* Main area skeleton */}
      <div className="flex-1 hidden md:flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 ${
                i % 2 === 0 ? "" : "flex-row-reverse"
              }`}
            >
              {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
              <Skeleton
                className={`h-12 rounded-2xl ${
                  i % 2 === 0 ? "w-48 rounded-bl-md" : "w-64 rounded-br-md"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <Skeleton className="h-11 w-full rounded-2xl" />
        </div>
      </div>
    </>
  );
}

export default LoadingChatWindow;
