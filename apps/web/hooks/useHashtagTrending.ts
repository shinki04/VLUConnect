"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface HashtagWithCount {
  id: string;
  name: string;
  post_count: number;
  created_at: string;
}

interface UseHashtagTrendingOptions {
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook để subscribe realtime changes trên hashtags
 * Tự động update khi post_count thay đổi
 */
export function useHashtagTrending({
  limit = 10,
  enabled = true,
}: UseHashtagTrendingOptions = {}) {
  const supabase = createClient();
  const [hashtags, setHashtags] = useState<HashtagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch initial data
  const fetchTrendingHashtags = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("hashtags")
        .select("*")
        .order("post_count", { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setHashtags((data || []) as HashtagWithCount[]);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch hashtags")
      );
      console.error("❌ Error fetching trending hashtags:", err);
    } finally {
      setLoading(false);
    }
  }, [limit, supabase]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    (async () => {
      // Fetch initial data
      await fetchTrendingHashtags();

      // Subscribe to realtime updates
      const newChannel = supabase
        .channel("trending:hashtags")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "hashtags",
          },
          (payload) => {
            if (!mounted) return;

            console.log("🔔 Hashtag update received:", payload);

            // Handle INSERT
            if (payload.eventType === "INSERT") {
              const newHashtag = payload.new as HashtagWithCount;
              setHashtags((prev) => {
                const updated = [newHashtag, ...prev];
                return updated
                  .sort((a, b) => b.post_count - a.post_count)
                  .slice(0, limit);
              });
            }

            // Handle UPDATE
            if (payload.eventType === "UPDATE") {
              const updatedHashtag = payload.new as HashtagWithCount;
              setHashtags((prev) => {
                const updated = prev.map((tag) =>
                  tag.id === updatedHashtag.id ? updatedHashtag : tag
                );
                return updated
                  .sort((a, b) => b.post_count - a.post_count)
                  .slice(0, limit);
              });
            }

            // Handle DELETE
            if (payload.eventType === "DELETE") {
              const deletedHashtag = payload.old as HashtagWithCount;
              setHashtags((prev) =>
                prev.filter((tag) => tag.id !== deletedHashtag.id)
              );
            }
          }
        )
        .subscribe();

      setChannel(newChannel);

      return () => {
        mounted = false;
      };
    })();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [enabled, fetchTrendingHashtags, limit, supabase, channel]); // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [channel]);

  const refresh = useCallback(async () => {
    await fetchTrendingHashtags();
  }, [fetchTrendingHashtags]);

  return {
    hashtags,
    loading,
    error,
    refresh,
    isRealtime: enabled && !!channel,
  };
}

/**
 * Hook để search hashtags
 */
export function useSearchHashtags() {
  const supabase = createClient();
  const [results, setResults] = useState<HashtagWithCount[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(
    async (query: string, limit: number = 20) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        setSearching(true);
        setError(null);

        const { data, error: searchError } = await supabase
          .from("hashtags")
          .select("*")
          .ilike("name", `%${query}%`)
          .order("post_count", { ascending: false })
          .limit(limit);

        if (searchError) throw searchError;

        setResults((data || []) as HashtagWithCount[]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Search failed"));
        console.error("❌ Error searching hashtags:", err);
      } finally {
        setSearching(false);
      }
    },
    [supabase]
  );

  return { results, searching, error, search };
}

/**
 * Hook để lấy hashtags của một post
 */
export function usePostHashtags(postId: string) {
  const supabase = createClient();
  const [hashtags, setHashtags] = useState<HashtagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchHashtags = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("post_hashtags")
          .select("hashtags(*)")
          .eq("post_id", postId);

        if (fetchError) throw fetchError;

        const tags = (data?.map((ph) => ph.hashtags).filter(Boolean) ||
          []) as HashtagWithCount[];
        setHashtags(tags);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch hashtags")
        );
        console.error("❌ Error fetching post hashtags:", err);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchHashtags();
    }
  }, [postId, supabase]);

  return { hashtags, loading, error };
}
