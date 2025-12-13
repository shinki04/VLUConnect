"use client";

import type { User } from "@repo/shared/types/user";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/dialog";
import { X } from "lucide-react";
import React, { createContext, useContext, useState } from "react";

import AddPost from "@/components/posts/AddPost";

interface DashboardContextType {
  openAddPost: () => void;
  closeAddPost: () => void;
  isAddPostOpen: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: React.ReactNode;
  currentUser: User;
}

function DashboardProvider({ children, currentUser }: DashboardProviderProps) {
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  console.log('DashboardProvider render - isAddPostOpen:', isAddPostOpen);

  const openAddPost = () => {
    console.log('openAddPost() CLICKED!');
    setIsAddPostOpen(true);
  };

  const closeAddPost = () => {
    console.log('closeAddPost() CALLED');
    setIsAddPostOpen(false);
  };

  return (
    <DashboardContext.Provider value={{ openAddPost, closeAddPost, isAddPostOpen }}>
      {children}

      <Dialog open={isAddPostOpen} onOpenChange={setIsAddPostOpen}>
        <DialogContent
          className="
      fixed inset-0
      z-[9999]
      flex items-center justify-center
      bg-transparent
      border-none shadow-none p-0
    "
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <DialogTitle className="text-base font-semibold text-[#37426F]">
                Tạo bài viết
              </DialogTitle>
              <button
                type="button"
                onClick={closeAddPost}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <AddPost currentUser={currentUser} onSuccess={closeAddPost} />
          </div>
        </DialogContent>
      </Dialog>

    </DashboardContext.Provider>
  );
}

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within a DashboardProvider");
  return context;
};

export default DashboardProvider;
