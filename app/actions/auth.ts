"use server";
import { createClient } from "@/lib/supabase/server";
import { User } from "@/types/user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (!data.user || error) {
    revalidatePath("/", "layout");
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select()
    .eq("id", data.user?.id)
    .single();

  return profile;
}

//* Temp
export async function getUserAvatars(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("avatars").list(id, {
    limit: 5,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });

  if (error || !data) throw new Error(`Error: ${error.message}`);

  const avatars = data.map((file) => {
    return {
      name: file.name,
      fullPath: `avatars/${id}/${file.name}`, // Format: bucket/userId/filename
    };
  });

  return avatars;
}

export async function getUserProfile(id: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select()
    .eq("id", id)
    .single();

  return profile;
}

export async function updateUserProfile(user: User) {
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").upsert(user);

  if (error) {
    throw new Error(`Profile update failed: ${error.message}`);
  }

  return user;
}

export async function uploadAvatar({
  userId,
  image,
}: {
  userId: string;
  image: File;
}) {
  const supabase = await createClient();

  const fileExt = image.name.split(".").pop();

  console.log(fileExt);
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const filePath = `${userId}/${fileName}`;

  // Upload file lên storage
  const { data, error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, image, {
      contentType: "image/*",
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  return data.fullPath;
}

export async function updateProfileWithAvatar(
  userId: string,
  formData: FormData
) {
  // Parse FormData thành object
  const rawData = {
    display_name: formData.get("display_name") as string,
    description: formData.get("description") as string,
    avatar_image: formData.get("avatar_image") as File | null,
  };
  const supabase = await createClient();

  let avatarUrl: string | undefined;

  // Nếu có avatar mới, upload lên storage
  if (rawData.avatar_image) {
    const uploadResult = await uploadAvatar({
      userId,
      image: rawData.avatar_image,
    });
    avatarUrl = uploadResult;
  }

  // Chuẩn bị data cho profile update
  const profileData = {
    id: userId,
    display_name: rawData.display_name,
    description: rawData.description,
    ...(avatarUrl && { avatar_url: avatarUrl }),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(profileData)
    .select()
    .single();

  if (error) {
    throw new Error(`Profile update failed: ${error.message}`);
  }

  // Revalidate paths
  revalidatePath("/profile");
  revalidatePath(`/profile/${userId}`);
  return data;
}
