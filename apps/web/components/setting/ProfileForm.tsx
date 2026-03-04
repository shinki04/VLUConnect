"use client";

import { BLANK_AVATAR } from "@repo/shared/types/user";
import { Button } from "@repo/ui/components/button";
import { CardContent } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { getCurrentUser, updateProfileWithAvatar } from "@/app/actions/user";

import { User } from "@repo/shared/types/user";

export function ProfileForm() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUser(),
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-mainred" />
      </div>
    );
  if (!user)
    return (
      <div className="p-8 text-center text-red-500">
        Đã có lỗi xảy ra. Không thể tải dữ liệu.
      </div>
    );

  return <ProfileFormContent user={user} />;
}

function ProfileFormContent({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [description, setDescription] = useState(user.description || "");
  const [slug, setSlug] = useState(user.slug || "");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatar_url || BLANK_AVATAR,
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(
    user.background_url || null,
  );

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Chưa đăng nhập");
      const formData = new FormData();
      formData.append("display_name", displayName);
      formData.append("description", description);
      formData.append("slug", slug);
      if (avatarFile) formData.append("avatar_image", avatarFile);
      if (coverFile) formData.append("cover_image", coverFile);

      return updateProfileWithAvatar(user.id, formData);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["currentUser"], updatedUser);
      toast.success("Cập nhật thông tin thành công!");
      setAvatarFile(null);
      setCoverFile(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi cập nhật. Vui lòng thử lại.");
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto w-full mt-4 overflow-hidden border-none shadow-none md:border-solid bg-transparent md:bg-dashboard-card dark:md:bg-dashboard-darkCard">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full pb-8">
        <div className="relative w-full h-48 md:h-64 bg-slate-200 dark:bg-slate-800 md:rounded-t-xl overflow-hidden group">
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-primary/10 to-primary/30" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              type="button"
              variant="secondary"
              onClick={() => coverInputRef.current?.click()}
            >
              <Camera className="w-4 h-4 mr-2" />
              Thay đổi ảnh bìa
            </Button>
            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleCoverChange}
            />
          </div>
        </div>

        <div className="relative -mt-20 ml-4 md:ml-8 w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-dashboard-sidebar bg-slate-200 dark:bg-slate-800 overflow-hidden group z-10 shrink-0">
          <img
            src={avatarPreview || BLANK_AVATAR}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            <Camera className="w-6 h-6 text-white" />
          </div>
          <input
            type="file"
            ref={avatarInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </div>

        <CardContent className="px-4 md:px-8 flex flex-col gap-6 pt-0">
          <div className="space-y-2">
            <Label htmlFor="displayName">Tên hiển thị</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập tên hiển thị"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Đường dẫn hồ sơ (Slug)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="duong-dan-ho-so"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Được dùng cho đường dẫn URL: /profile/
              <strong>{slug || user.id}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Tiểu sử</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu đôi nét về bạn..."
              className="min-h-32 resize-none w-full"
            />
          </div>

          <div className="pt-4 border-t border-dashboard-border flex justify-end">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-mainred hover:bg-mainred-hover text-white w-full sm:w-auto px-8"
            >
              {updateMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </CardContent>
      </form>
    </div>
  );
}
