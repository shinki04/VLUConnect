"use server";

import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createGroupSchema } from "@/lib/validations/group";

export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const rawData = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    privacy_level: formData.get("privacy_level"),
    membership_mode: formData.get("membership_mode"),
  };

  const parsed = createGroupSchema.safeParse(rawData);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      ...parsed.data,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating group:", error);
    if (error.code === "23505") { // Unique violation
        return { error: "Group with this slug already exists." };
    }
    return { error: "Failed to create group." };
  }

  // Add creator as Admin (Trigger/RLS might handle this but safer to be explicit or rely on policy if insert allowed)
  // Our RLS allows auth users to create groups.
  // We should also add them as a member. 
  // Ideally, a database trigger handles this, but we can do it manually here for now to be sure.
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: "admin",
      status: "active",
    });

  if (memberError) {
      console.error("Error adding admin member:", memberError);
      // Determine if we should rollback group creation? Supabase doesn't support transactions easily via JS client without RPC.
      // For MVP, likely acceptable risk or use RPC.
  }

  revalidatePath("/groups");
  redirect(`/groups/${group.slug}`);
}

export async function joinGroup(groupId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Fetch group to check mode
    const { data: group } = await supabase.from("groups").select("membership_mode, privacy_level").eq("id", groupId).single();
    if (!group) return { error: "Group not found" };

    const status = group.membership_mode === 'auto' ? 'active' : 'pending';

    const { error } = await supabase
        .from("group_members")
        .insert({
            group_id: groupId,
            user_id: user.id,
            role: "member",
            status: status
        });

    if (error) {
        console.error("Error joining group:", error);
        return { error: "Failed to join group" };
    }

    revalidatePath(`/groups/${groupId}`);
    return { success: true, status };
}

export async function leaveGroup(groupId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check if user is admin - admin cannot leave
    const { data: membership } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

    if (membership?.role === "admin") {
        return { error: "Admin không thể rời group. Hãy chuyển quyền admin trước." };
    }

    const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

    if (error) return { error: "Không thể rời group" };

    revalidatePath(`/groups`);
    return { success: true };
}

// ============================================================
// Member Management Actions (Admin/Moderator only)
// ============================================================

type GroupRole = "admin" | "sub_admin" | "moderator" | "member";
const ROLE_HIERARCHY: Record<GroupRole, number> = {
    admin: 4,
    sub_admin: 3,
    moderator: 2,
    member: 1,
};

/**
 * Helper to check if user can manage another member
 */
async function canManageMember(
    groupId: string,
    actorId: string,
    targetId: string
): Promise<{ canManage: boolean; actorRole: GroupRole | null; targetRole: GroupRole | null; error?: string }> {
    const supabase = await createClient();
    // Get actor's role
    const { data: actor } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", actorId)
        .single();

    if (!actor) {
        return { canManage: false, actorRole: null, targetRole: null, error: "Bạn không phải thành viên của group" };
    }

    // Get target's role
    const { data: target } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", targetId)
        .single();

    if (!target) {
        return { canManage: false, actorRole: actor.role, targetRole: null, error: "Thành viên không tồn tại" };
    }

    const actorLevel = ROLE_HIERARCHY[actor.role as GroupRole];
    const targetLevel = ROLE_HIERARCHY[target.role as GroupRole];

    // Can only manage members with lower role
    if (actorLevel <= targetLevel) {
        return { canManage: false, actorRole: actor.role, targetRole: target.role, error: "Bạn không có quyền quản lý thành viên này" };
    }

    return { canManage: true, actorRole: actor.role, targetRole: target.role };
}

/**
 * Update member role (admin/sub_admin/moderator can do this)
 */
export async function updateMemberRole(groupId: string, targetUserId: string, newRole: "sub_admin" | "moderator" | "member") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const check = await canManageMember(groupId, user.id, targetUserId);
    if (!check.canManage) return { error: check.error };

    // Cannot set role higher than or equal to actor's role
    const actorLevel = ROLE_HIERARCHY[check.actorRole!];
    const newRoleLevel = ROLE_HIERARCHY[newRole];
    if (newRoleLevel >= actorLevel) {
        return { error: "Không thể đặt role cao hơn hoặc bằng role của bạn" };
    }

    const { error } = await supabase
        .from("group_members")
        .update({ role: newRole })
        .eq("group_id", groupId)
        .eq("user_id", targetUserId);

    if (error) return { error: "Không thể cập nhật role" };

    revalidatePath(`/groups`);
    return { success: true };
}

/**
 * Transfer admin to another member (admin only)
 */
export async function transferAdmin(groupId: string, newAdminUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check current user is admin
    const { data: currentAdmin } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

    if (currentAdmin?.role !== "admin") {
        return { error: "Chỉ admin mới có thể chuyển quyền" };
    }

    // Check target exists and is active member
    const { data: target } = await supabase
        .from("group_members")
        .select("role, status")
        .eq("group_id", groupId)
        .eq("user_id", newAdminUserId)
        .single();

    if (!target || target.status !== "active") {
        return { error: "Thành viên không tồn tại hoặc chưa được duyệt" };
    }

    // Update new admin
    await supabase
        .from("group_members")
        .update({ role: "admin" })
        .eq("group_id", groupId)
        .eq("user_id", newAdminUserId);

    // Demote old admin to sub_admin
    await supabase
        .from("group_members")
        .update({ role: "sub_admin" })
        .eq("group_id", groupId)
        .eq("user_id", user.id);

    // Update group created_by
    await supabase
        .from("groups")
        .update({ created_by: newAdminUserId })
        .eq("id", groupId);

    revalidatePath(`/groups`);
    return { success: true };
}

/**
 * Remove member from group
 */
export async function removeMember(groupId: string, targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const check = await canManageMember(groupId, user.id, targetUserId);
    if (!check.canManage) return { error: check.error };

    const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", targetUserId);

    if (error) return { error: "Không thể xóa thành viên" };

    revalidatePath(`/groups`);
    return { success: true };
}

/**
 * Approve pending member
 */
export async function approveMember(groupId: string, targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check actor has permission (at least moderator)
    const { data: actor } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

    const canApprove = ["admin", "sub_admin", "moderator"].includes(actor?.role ?? "");
    if (!canApprove) {
        return { error: "Bạn không có quyền duyệt thành viên" };
    }

    const { error } = await supabase
        .from("group_members")
        .update({ status: "active" })
        .eq("group_id", groupId)
        .eq("user_id", targetUserId)
        .eq("status", "pending");

    if (error) return { error: "Không thể duyệt thành viên" };

    revalidatePath(`/groups`);
    return { success: true };
}

/**
 * Approve all pending members at once
 */
export async function approveAllMembers(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check actor has permission (admin or sub_admin only for bulk approval)
  const { data: actor } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  const canApproveAll = ["admin", "sub_admin"].includes(actor?.role ?? "");
  if (!canApproveAll) {
    return { error: "Chỉ Admin hoặc Phó Admin mới có thể duyệt tất cả" };
  }

  const { data, error } = await supabase
    .from("group_members")
    .update({ status: "active" })
    .eq("group_id", groupId)
    .eq("status", "pending")
    .select("user_id");

  if (error) return { error: "Không thể duyệt thành viên" };

  revalidatePath(`/groups`);
  return { success: true, approvedCount: data?.length || 0 };
}

/**
 * Reject pending member
 */
export async function rejectMember(groupId: string, targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check actor has permission
    const { data: actor } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

    const canReject = ["admin", "sub_admin", "moderator"].includes(actor?.role ?? "");
    if (!canReject) {
        return { error: "Bạn không có quyền từ chối thành viên" };
    }

    const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", targetUserId)
        .eq("status", "pending");

    if (error) return { error: "Không thể từ chối thành viên" };

    revalidatePath(`/groups`);
    return { success: true };
}

/**
 * Update group settings (admin only)
 */
const updateGroupSchema = z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    privacy_level: z.enum(["public", "private"]).optional(),
    membership_mode: z.enum(["auto", "request"]).optional(),
  allow_anonymous_posts: z.boolean().optional(),
  allow_anonymous_comments: z.boolean().optional(),
});

export async function updateGroup(groupId: string, data: z.infer<typeof updateGroupSchema>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check user is admin
    const { data: membership } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

    if (membership?.role !== "admin") {
        return { error: "Chỉ admin mới có thể chỉnh sửa group" };
    }

    const parsed = updateGroupSchema.safeParse(data);
    if (!parsed.success) {
        return { error: "Dữ liệu không hợp lệ" };
    }

    const { error } = await supabase
        .from("groups")
        .update({ ...parsed.data, updated_at: new Date().toISOString() })
        .eq("id", groupId);

    if (error) return { error: "Không thể cập nhật group" };

    revalidatePath(`/groups`);
    return { success: true };
}

/**
 * Delete group (admin only)
 */
export async function deleteGroup(groupId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check user is admin
    const { data: membership } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

    if (membership?.role !== "admin") {
        return { error: "Chỉ admin mới có thể xóa group" };
    }

    // Delete all members first
    // await supabase.from("group_members").delete().eq("group_id", groupId);

    // Delete group
    const { error } = await supabase.from("groups").delete().eq("id", groupId);

    if (error) return { error: "Không thể xóa group " + error.message };

    revalidatePath("/groups");
    redirect("/groups");
}

/**
 * Update group images (avatar/cover)
 */
export async function updateGroupImages(
    groupId: string, 
    data: { avatar_url?: string; cover_url?: string }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check user is admin
    const { data: membership } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

    if (membership?.role !== "admin") {
        return { error: "Chỉ admin mới có thể thay đổi ảnh của group" };
    }

    const { error } = await supabase
        .from("groups")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", groupId);

    if (error) return { error: "Không thể cập nhật ảnh" };

    revalidatePath(`/groups`);
    return { success: true };
}

// ================== DATA FETCHING ==================

export interface GroupData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  privacy_level: string | null;
  membership_mode: string | null;
  allow_anonymous_posts: boolean | null;
  allow_anonymous_comments: boolean | null;
  created_by: string | null;
  created_at: string | null;
}

export interface MemberProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  global_role?: string | null;
}

export interface GroupMember {
  user_id: string;
  role: "admin" | "sub_admin" | "moderator" | "member";
  status: "active" | "banned" | "pending";
  joined_at: string | null;
  profile?: MemberProfile | null;
}

export interface GroupWithDetails extends GroupData {
  members_count: number;
  my_membership: GroupMember | null;
}

/**
 * Get group by slug with membership info for current user
 */
export async function getGroup(slug: string): Promise<GroupWithDetails | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch group basic info
  const { data: group, error } = await supabase
    .from("groups")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !group) {
    console.error("Error fetching group:", error);
    return null;
  }

  // Fetch member count
  const { count: membersCount } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id)
    .eq("status", "active");

  // Fetch current user's membership if logged in
  let myMembership: GroupMember | null = null;
  if (user) {
    const { data: membership } = await supabase
      .from("group_members")
      .select("user_id, role, status, joined_at")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .single();

    myMembership = membership as GroupMember | null;
  }

  return {
    ...group,
    members_count: membersCount || 0,
    my_membership: myMembership,
  };
}

/**
 * Get posts for a group
 */
export async function getGroupPosts(groupId: string, page = 1, pageSize = 10) {
  const supabase = await createClient();
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, error, count } = await supabase
    .from("posts")
    .select(
      `
      id,
      created_at, 
      author:profiles!author_id(
        id,
        username,
        display_name,
        avatar_url,
        global_role
      ),
      content,
      media_urls,
      updated_at,
      like_count,
      comment_count,
      share_count,
      privacy_level,
      is_anonymous,
      group_id,
      group:groups!group_id(
        id,
        name,
        slug
      )
    `,
      { count: "exact" }
    )
    .eq("group_id", groupId)
    .is("is_deleted", false)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    console.error("Error fetching group posts:", error);
    return { posts: [], count: 0 };
  }

  return { posts: data || [], count: count || 0 };
}

/**
 * Get group members with profiles
 */
export async function getGroupMembers(
  groupId: string,
  options?: { status?: "active" | "pending" | "banned" }
) {
  const supabase = await createClient();

  let query = supabase
    .from("group_members")
    .select(
      `
      user_id,
      role,
      status,
      joined_at,
      profile:profiles!user_id(id, display_name, username, avatar_url)
    `
    )
    .eq("group_id", groupId);

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query.order("joined_at", { ascending: true });

  if (error) {
    console.error("Error fetching members:", error);
    return [];
  }

  return data || [];
}


/**
 * Get group overview members (Core members + Friends)
 */
export async function getGroupOverviewMembers(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get Core Members (Admin, Sub-admin, Moderator)
  const { data: coreMembers } = await supabase
    .from("group_members")
    .select(`
      user_id,
      role,
      status,
      joined_at,
      profile:profiles!user_id(id, display_name, username, avatar_url, global_role)
    `)
    .eq("group_id", groupId)
    .in("role", ["admin", "sub_admin", "moderator"])
    .eq("status", "active")
    .order("role", { ascending: false }); // admin > sub > mod

  let friendMembers: GroupMember[] = [];

  if (user) {
    // 2. Get Friends IDs
    // Friendships where (requester = me OR addressee = me) AND status = accepted
    const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq("status", "friends");

    const friendIds = friendships?.map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
    ) || [];

    if (friendIds.length > 0) {
        // 3. Get Group Members who are friends
        const { data: friends } = await supabase
            .from("group_members")
            .select(`
                user_id,
                role,
                status,
                joined_at,
                profile:profiles!user_id(id, display_name, username, avatar_url, global_role)
            `)
            .eq("group_id", groupId)
            .eq("status", "active")
            .in("user_id", friendIds);
        
        // Filter out those who are already in coreMembers to avoid duplication in display if desired, 
        // but user might want to see them in "Friends" section explicitly.
        // We will return them as is, UI can decide how to render.
        friendMembers = friends || [];
    }
  }

  return {
    coreMembers: coreMembers || [],
    friendMembers: friendMembers || []
  };
}

/**
 * Get list of suggested groups
 */
export async function getSuggestedGroups() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("groups")
        .select(`
            *,
            members:group_members(count)
        `)
        .limit(20); // Removed explicit public filter as requested previously
    
    // Transform data to match UI needs if necessary, ensuring members count is accessible
    // The query returns members as an array of objects with count.
    return data?.map(group => ({
        ...group,
        member_count: group.members?.[0]?.count || 0
    })) || [];
}

/**
 * Get groups the current user has joined
 */
export async function getMyGroups() {
     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return [];

     const { data } = await supabase
        .from("group_members")
        .select(`
            group:groups(*)
        `)
        .eq("user_id", user.id);
    
    return data?.map(m => m.group).filter(Boolean) || [];
}
