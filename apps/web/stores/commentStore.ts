import { create } from "zustand";

interface ReplyTarget {
  name: string;
  parentId: string;
}
export type SortBy = "newest" | "top" | "discussed";
interface CommentFilters {
  search: string;
  sortBy: SortBy;
}

interface CommentState {
  // Keyed by postId to support multiple dialogs
  replyTargets: Record<string, ReplyTarget | null>;
  filters: Record<string, CommentFilters>;
  
  // Actions
  setReplyTo: (postId: string, target: ReplyTarget | null) => void;
  clearReplyTo: (postId: string) => void;
  setSearch: (postId: string, search: string) => void;
  setSortBy: (postId: string, sortBy: SortBy) => void;
  getFilters: (postId: string) => CommentFilters;
}

const defaultFilters: CommentFilters = {
  search: "",
  sortBy: "newest"
};

export const useCommentStore = create<CommentState>((set, get) => ({
  replyTargets: {},
  filters: {},
  
  setReplyTo: (postId, target) => 
    set((state) => ({
      replyTargets: {
        ...state.replyTargets,
        [postId]: target
      }
    })),
  
  clearReplyTo: (postId) => 
    set((state) => ({
      replyTargets: {
        ...state.replyTargets,
        [postId]: null
      }
    })),

  setSearch: (postId, search) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [postId]: {
          ...(state.filters[postId] || defaultFilters),
          search
        }
      }
    })),

  setSortBy: (postId, sortBy) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [postId]: {
          ...(state.filters[postId] || defaultFilters),
          sortBy
        }
      }
    })),

  getFilters: (postId) => get().filters[postId] || defaultFilters,
}));
