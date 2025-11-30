import { create } from "zustand";

import { User } from "@/types/user";

// Define types for state & actions
interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  //   getCurrentUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
