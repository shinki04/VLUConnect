"use server";
import { getRedisClient } from "@repo/redis/redis";
import { User } from "@repo/shared/types/user";
import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Constants
const CACHE_KEYS = {
  user: (id: string) => `user:${id}`,
} as const;

const CACHE_TTL = {
  USER: 3600, // 1 hour
  SHORT: 60, // 1 minute
} as const;

const redis = getRedisClient();

// Cache helpers
async function setUserCache(
  id: string,
  value: User,
  expire: number = CACHE_TTL.USER
) {
  try {
    await redis.setCache(CACHE_KEYS.user(id), value, expire);
  } catch (error) {
    console.error(`Failed to set cache for user ${id}:`, error);
    // Don't throw - cache failure shouldn't break the main flow
  }
}

async function getUserCache(id: string): Promise<User | null> {
  try {
    return await redis.getCache<User>(CACHE_KEYS.user(id));
  } catch (error) {
    console.error(`Failed to get cache for user ${id}:`, error);
    return null;
  }
}

async function delUserCache(id: string): Promise<void> {
  try {
    await redis.delCache(CACHE_KEYS.user(id));
  } catch (error) {
    console.error(`Failed to delete cache for user ${id}:`, error);
    // Don't throw - cache failure shouldn't break the main flow
  }
}

// Auth and user functions
export async function getCurrentUser(): Promise<User> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (!data || error) {
    redirect("/login");
  }

  // Try cache first
  const cachedUser = await getUserCache(data.user.id);
  if (cachedUser) {
    return cachedUser;
  }

  // Fetch from database if cache miss
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message || "Profile not found");
  }
  // Set cache asynchronously without waiting
  setUserCache(profile.id, profile).catch(console.error);

  return profile;
}

export async function getUserProfile(id: string): Promise<User | null> {
  if (!id) {
    throw new Error("User ID is required");
  }

  // Try cache first
  const cachedUser = await getUserCache(id);
  if (cachedUser) {
    return cachedUser;
  }

  // Check if id is UUID
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const supabase = await createClient();
  let query = supabase.from("profiles").select("*");

  if (isUUID) {
    query = query.eq("id", id);
  } else {
    query = query.eq("slug", id);
  }

  const { data: profile, error } = await query.single();

  if (error || !profile) {
    console.error(error?.message || "Profile not found");
    return null;
  }

  // Set cache asynchronously without waiting
  // Cache by both ID and Slug if available to ensure fast lookups
  setUserCache(profile.id, profile as User).catch(console.error);
  if (profile.slug) {
    setUserCache(profile.slug, profile as User).catch(console.error);
  }

  return profile as User;
}

// Storage functions
export async function getUserAvatars(id: string) {
  if (!id) {
    throw new Error("User ID is required");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("avatars").list(id, {
    limit: 5,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    throw new Error(`Failed to get user avatars: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((file) => ({
    name: file.name,
    fullPath: `avatars/${id}/${file.name}`,
  }));
}

async function uploadAvatar(userId: string, image: File): Promise<string> {
  if (!userId || !image) {
    throw new Error("User ID and image are required");
  }

  const supabase = await createClient();
  const fileExt = image.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, image, {
      contentType: image.type,
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    throw new Error(`Avatar upload failed: ${error.message}`);
  }
  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  return publicUrl;
}

// Update functions
export async function updateUserProfile(user: User): Promise<User> {
  if (!user?.id) {
    throw new Error("Valid user data is required");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      ...user,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Profile update failed: ${error.message}`);
  }

  // Invalidate cache asynchronously
  delUserCache(user.id).catch(console.error);

  return data;
}

export async function updateProfileWithAvatar(
  userId: string,
  formData: FormData
): Promise<User> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Parse and validate form data
  const displayName = formData.get("display_name") as string;
  const description = formData.get("description") as string;
  const slug = formData.get("slug") as string;
  const avatarImage = formData.get("avatar_image") as File | null;

  if (!displayName?.trim()) {
    throw new Error("Display name is required");
  }

  const supabase = await createClient();
  let avatarUrl: string | undefined;

  // Upload new avatar if provided
  if (avatarImage && avatarImage.size > 0) {
    try {
      avatarUrl = await uploadAvatar(userId, avatarImage);
    } catch (error) {
      console.error("Avatar upload failed:", error);
      throw new Error(
        `Failed to upload avatar: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Prepare profile data
  const profileData = {
    id: userId,
    display_name: displayName.trim(),
    description: description?.trim() || null,
    slug: slug?.trim() || null,
    ...(avatarUrl && { avatar_url: avatarUrl }),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(profileData)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Slug đã tồn tại, vui lòng chọn slug khác");
    }
    throw new Error(`Profile update failed: ${error.message}`);
  }

  // Invalidate cache
  await delUserCache(userId);

  // Revalidate relevant paths
  revalidatePath("/profile");
  revalidatePath("/profile");
  revalidatePath(`/profile/${userId}`);
  if (data.slug) {
    revalidatePath(`/profile/${data.slug}`);
  }
  revalidatePath("/", "layout");

  return data as User;
}

// Utility function to clear all user-related cache
export async function clearUserCache(userId: string): Promise<void> {
  if (!userId) return;

  await delUserCache(userId);
  // Add other cache keys if you have more user-related cache
  // await delCache(`user:${userId}:avatars`);
  // await delCache(`user:${userId}:settings`);
}
