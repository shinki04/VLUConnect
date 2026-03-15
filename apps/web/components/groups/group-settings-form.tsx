"use client";

import { createClient } from "@repo/supabase/client";
import AlertDialog from "@repo/ui/components/AlertDialog";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { Camera, EyeOff,Globe, Lock, Trash2, Upload, Users } from "lucide-react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useRef,useState } from "react";
import { toast } from "sonner";

import type { GroupWithDetails } from "@/app/actions/group";
import { deleteGroup, updateGroup, updateGroupImages } from "@/app/actions/group";

interface GroupSettingsFormProps {
  group: GroupWithDetails;
}

// Allowed image types (no GIF)
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function GroupSettingsForm({ group }: GroupSettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(group.avatar_url);
  const [coverPreview, setCoverPreview] = useState<string | null>(group.cover_url);

  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description || "",
    privacy_level: group.privacy_level || "public",
    membership_mode: group.membership_mode || "auto",
    allow_anonymous_posts: group.allow_anonymous_posts || false,
    allow_anonymous_comments: group.allow_anonymous_comments || false,
  });

  const validateImageFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "Chỉ chấp nhận ảnh JPG, PNG, WEBP. Không chấp nhận GIF.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Ảnh tối đa 5MB";
    }
    return null;
  };

  const uploadImage = async (file: File, type: "avatar" | "cover"): Promise<string | null> => {
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    // Path format: {group_id}/{type}-{timestamp}.{ext}
    const path = `${group.id}/${type}-${timestamp}.${extension}`;

    const { error } = await supabase.storage
      .from("groups")
      .upload(path, file, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage.from("groups").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to storage
      const url = await uploadImage(file, "avatar");
      if (url) {
        const result = await updateGroupImages(group.id, { avatar_url: url });
        if (result?.error) {
          toast.error(result.error);
          setAvatarPreview(group.avatar_url);
        } else {
          toast.success("Đã cập nhật ảnh đại diện");
        }
      } else {
        toast.error("Không thể upload ảnh");
        setAvatarPreview(group.avatar_url);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
      setAvatarPreview(group.avatar_url);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploadingCover(true);
    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to storage
      const url = await uploadImage(file, "cover");
      if (url) {
        const result = await updateGroupImages(group.id, { cover_url: url });
        if (result?.error) {
          toast.error(result.error);
          setCoverPreview(group.cover_url);
        } else {
          toast.success("Đã cập nhật ảnh bìa");
        }
      } else {
        toast.error("Không thể upload ảnh");
        setCoverPreview(group.cover_url);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
      setCoverPreview(group.cover_url);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateGroup(group.id, {
        name: formData.name,
        description: formData.description,
        privacy_level: formData.privacy_level as "public" | "private",
        membership_mode: formData.membership_mode as "auto" | "request",
        allow_anonymous_posts: formData.allow_anonymous_posts,
        allow_anonymous_comments: formData.allow_anonymous_comments,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã cập nhật group");
        router.refresh();
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteGroup(group.id);
      if (result?.error) {
        toast.error(result.error);
        setIsDeleting(false);
      }
    } catch (error) {
      // Re-throw NEXT_REDIRECT error so redirect works properly
      if (isRedirectError(error)) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast.error(message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Images Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hình ảnh</CardTitle>
          <CardDescription>
            Thay đổi ảnh đại diện và ảnh bìa của group (JPG, PNG, WEBP - tối đa
            5MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Ảnh bìa</Label>
            <div
              className="relative h-32 w-full rounded-lg overflow-hidden bg-muted cursor-pointer group"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover"
                  className="w-full h-full object-contain md:object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/30" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingCover ? (
                  <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Upload className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleCoverChange}
              className="hidden"
            />
          </div>

          {/* Avatar Image */}
          <div className="space-y-2">
            <Label>Ảnh đại diện</Label>
            <div
              className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-contain md:object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary/60" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingAvatar ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin Group</CardTitle>
          <CardDescription>
            Chỉnh sửa thông tin cơ bản của group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên Group</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Tên group"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả về group..."
                rows={4}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quyền riêng tư</Label>
                <Select
                  value={formData.privacy_level}
                  onValueChange={(val) =>
                    setFormData({ ...formData, privacy_level: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 hidden sm:inline" />
                        <span className="text-sm">Công khai</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 hidden sm:inline" />
                        <span className="text-sm">Riêng tư</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Chế độ tham gia</Label>
                <Select
                  value={formData.membership_mode}
                  onValueChange={(val) =>
                    setFormData({ ...formData, membership_mode: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 hidden sm:inline" />
                        <span className="text-sm">Tự động (Mở)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="request">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 hidden sm:inline" />
                        <span className="text-sm">Cần duyệt</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Anonymous Settings */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <EyeOff className="w-4 h-4" />
                <span className="text-sm font-medium">Cài đặt ẩn danh</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_anonymous_posts">
                    Cho phép đăng bài ẩn danh
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Thành viên có thể đăng bài mà không hiển thị tên
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="allow_anonymous_posts"
                  checked={formData.allow_anonymous_posts}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allow_anonymous_posts: e.target.checked,
                    })
                  }
                  className="h-5 w-5 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_anonymous_comments">
                    Cho phép bình luận ẩn danh
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Thành viên có thể bình luận mà không hiển thị tên
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="allow_anonymous_comments"
                  checked={formData.allow_anonymous_comments}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allow_anonymous_comments: e.target.checked,
                    })
                  }
                  className="h-5 w-5 rounded border-gray-300"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Vùng nguy hiểm</CardTitle>
          <CardDescription>Các hành động không thể hoàn tác</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "Đang xóa..." : "Xóa Group"}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Xác nhận xóa group"
        description={`Bạn có chắc chắn muốn xóa group "${group.name}"? Hành động này sẽ xóa tất cả thành viên và không thể hoàn tác.`}
        confirmText="Xóa Group"
        cancelText="Hủy"
        onConfirm={handleDelete}
      />
    </div>
  );
}
