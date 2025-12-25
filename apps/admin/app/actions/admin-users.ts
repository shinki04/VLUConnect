"use server";

import { Global_Roles } from "@repo/shared/types/user";
import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

interface UsersFilter {
  search?: string;
  role?: string;
}

// Get all users with pagination and filtering
export async function getAllUsers(
  page: number = 1,
  limit: number = 20,
  filters?: UsersFilter
) {
  const supabase = await createClient();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("create_at", { ascending: false })
    .range(start, end);

  if (filters?.search) {
    query = query.or(
      `username.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  if (filters?.role) {
    // Use any cast for enum type mismatch
    query = query.eq("global_role", filters.role as Global_Roles );
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    users: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// Get user by ID
export async function getUserById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

// Update user role
export async function updateUserRole(
  userId: string,
  role: "admin" | "student" | "lecturer" | "moderator"
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ global_role: role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;

  revalidatePath("/dashboard/users");
  return { success: true };
}

// Ban user (using a custom field or status)
export async function banUser(userId: string, reason: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      status: "banned",
      ban_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;

  revalidatePath("/dashboard/users");
  return { success: true };
}

// Unban user
export async function unbanUser(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      status: "active",
      ban_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;

  revalidatePath("/dashboard/users");
  return { success: true };
}
