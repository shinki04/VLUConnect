"use client";
import { Avatar, BLANK_AVATAR, User } from "@repo/shared/types/user";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useForm } from "@tanstack/react-form";
import { Camera, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { getUserAvatars } from "@/app/actions/user";
import { useGetCurrentUser, useUpdateProfile } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriendship";
import { updateProfileSchema } from "@/lib/validations/updateProfile-schema";

import { FieldErrors } from "../FieldErrors";
import { FriendButton } from "../friendship/FriendButton";
import OldAvatars from "./OldAvatars";

interface ProfileProps {
  user: User;
  children?: React.ReactNode;
}

function Profile({ user, children }: ProfileProps) {
  const { mutateAsync: updateProfile, isPending: isProfileUpdating } =
    useUpdateProfile();
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.avatar_url || BLANK_AVATAR,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCoverDialogOpen, setIsCoverDialogOpen] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [activeTab, setActiveTab] = useState<
    "posts" | "about" | "friends" | "photos"
  >("posts");

  const { data: currentUser, error } = useGetCurrentUser();
  const { data: friends } = useFriends(user.id);
  const totalFriends = friends?.length || 0;

  // TODO , sửa logic để lấy all avatars
  useEffect(() => {
    const fetchAvatars = async () => {
      const data = await getUserAvatars(user.id);
      setAvatars(data);
    };
    fetchAvatars();
     
  }, [user.id]);

  const form = useForm({
    defaultValues: {
      display_name: user?.display_name || "",
      slug: user?.slug || "",
      description: user?.description || "",
      avatar_image: undefined as File | undefined,
    },
    validators: {
      onSubmit: updateProfileSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (!user || !currentUser) console.error("User not found");

        const validatedData = updateProfileSchema.safeParse(value);

        if (!validatedData.success) {
          const errors = validatedData.error;
          toast.error(`Dữ liệu không hợp lệ: ${errors}`);
          return;
        }

        // Tạo FormData để gửi file
        const formData = new FormData();
        formData.append("display_name", value.display_name);
        formData.append("slug", value.slug);
        formData.append("description", value.description);

        if (value.avatar_image) {
          formData.append("avatar_image", value.avatar_image);
        }

        await updateProfile({ userId: currentUser!.id, data: formData });
        toast.success("Cập nhật hồ sơ thành công!");
        setIsDialogOpen(false); // Đóng dialog sau khi thành công
      } catch (error) {
        console.error("Lỗi cập nhật hồ sơ:", error);
        toast.error("Có lỗi xảy ra khi cập nhật hồ sơ");
      }
    },
  });

  const handleAvatarChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    form.setFieldValue("avatar_image", file);
  };

  const isOwner = currentUser?.id === user?.id;

  if (error || !user) {
    return (
      <div className="p-8 flex flex-col items-center gap-4">
        <h2 className="text-xl font-bold">User not found</h2>
        <Skeleton className="h-12 w-32" />
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="profile-container w-full max-w-5xl mx-auto">
      {/* Cover & Avatar Header */}
      <div className="bg-dashboard-card rounded-b-xl overflow-hidden border border-dashboard-border shadow-sm">
        <div className="profile-cover h-48 md:h-[350px]">
          {user.background_url ? (
            <Image
              src={user.background_url}
              alt="Cover Image"
              fill
              className="object-cover w-full h-full"
              priority
            />
          ) : user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt="Cover Image"
              fill
              className="object-cover w-full h-full brightness-50 blur-sm"
              priority
            />
          ) : (
            <div className="w-full h-full bg-mainred/20 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-black/10 dark:text-white/10"
                style={{ fontSize: "100px" }}
              >
                school
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"></div>
          {isOwner && (
            <Button
              onClick={() => setIsCoverDialogOpen(true)}
              className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white dark:hover:bg-black transition-colors flex items-center gap-2 shadow-sm"
            >
              <Camera />
              <span className="hidden sm:inline">Chỉnh sửa ảnh bìa</span>
            </Button>
          )}
        </div>

        {/* Avatar & Info */}
        <div className="px-4 md:px-8 pb-2 -mt-16 md:-mt-20">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 mb-4 relative z-10">
            <div className="relative shrink-0 mx-auto md:mx-0">
              <div className="h-32 w-32 md:h-44 md:w-44 rounded-full p-1.5 bg-dashboard-card shadow-xl">
                <Image
                  width={176}
                  height={176}
                  alt={`Avatar ${user?.display_name || user?.username}`}
                  className="profile-avatar h-full w-full"
                  src={user?.avatar_url || BLANK_AVATAR}
                />
              </div>
              {isOwner && (
                <div
                  className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-mainred text-white p-2 rounded-full cursor-pointer hover:bg-mainred/90 border-4 border-dashboard-card shadow-md transition-transform active:scale-95"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Camera />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center md:items-start pt-2 md:pt-16 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {user?.display_name || user?.username}
                </h1>
                {user?.global_role === "lecturer" && (
                  <div
                    className="bg-mainred text-white rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm border border-mainred"
                    title="Giảng viên đã xác thực"
                  >
                    <span className="material-symbols-outlined text-[14px] font-bold filled">
                      verified
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                      Xác thực giảng viên
                    </span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground font-medium line-clamp-2 md:line-clamp-3">
                {user?.description || (
                  <span className="italic opacity-60">
                    Chưa có lời giới thiệu nào
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-3 mb-2 md:mb-4">
              {/* Actions */}
              {!isOwner && currentUser && (
                <FriendButton
                  targetUserId={user.id}
                  currentUserId={currentUser.id}
                />
              )}
              {isOwner && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  variant="outline"
                  className="font-bold flex items-center gap-2"
                >
                  <Pencil />
                  Chỉnh sửa trang cá nhân
                </Button>
              )}
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="profile-tabs overflow-x-auto">
            <button
              onClick={() => setActiveTab("posts")}
              className={
                activeTab === "posts"
                  ? "profile-tab-active"
                  : "profile-tab-inactive"
              }
            >
              Bài viết
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={
                activeTab === "about"
                  ? "profile-tab-active"
                  : "profile-tab-inactive"
              }
            >
              Giới thiệu
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={
                activeTab === "friends"
                  ? "profile-tab-active"
                  : "profile-tab-inactive"
              }
            >
              Bạn bè
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={
                activeTab === "photos"
                  ? "profile-tab-active"
                  : "profile-tab-inactive"
              }
            >
              Ảnh
            </button>
          </div>
        </div>
      </div>

      {/* Main Profile Content */}
      <div className="w-full">
        {activeTab === "posts" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
            {/* Left Sidebar Info */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-5">
              <div className="bg-dashboard-card p-5 rounded-xl shadow-sm border border-dashboard-border">
                <h2 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                  Giới thiệu
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    {/* <span className="material-symbols-outlined text-mainred filled">
                      rss_feed
                    </span> */}
                    <div className="text-sm text-foreground">
                      <span className="text-muted-foreground">
                        Tên người dùng:
                      </span>{" "}
                      <span className="font-bold">@{user.username}</span>
                    </div>
                  </li>
                  {user.email && (
                    <li className="flex items-start gap-3">
                      {/* <Mail /> */}
                      <div className="text-sm text-foreground">
                        <span className="text-muted-foreground">Email:</span>{" "}
                        <span className="font-bold">{user.email}</span>
                      </div>
                    </li>
                  )}
                </ul>
              </div>

              <div className="bg-dashboard-card p-5 rounded-xl shadow-sm border border-dashboard-border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-foreground">Bạn bè</h2>
                  <span className="text-sm text-muted-foreground">
                    {totalFriends} người bạn
                  </span>
                </div>
                {friends && friends.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {friends.slice(0, 6).map((friend) => (
                      <Link
                        key={friend.id}
                        href={`/profile/${friend.id}`}
                        className="flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-dashboard-background"
                      >
                        <Image
                          src={friend.avatar_url || BLANK_AVATAR}
                          alt={friend.display_name || "User"}
                          width={64}
                          height={64}
                          className="rounded-full object-cover aspect-square border border-dashboard-border"
                        />
                        <span className="text-xs font-medium truncate max-w-full text-center">
                          {friend.display_name || friend.username}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Chưa có bạn bè
                  </p>
                )}
              </div>
            </div>

            {/* Right Content Stream (Posts) */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-5">
              {children}
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="bg-dashboard-card p-5 rounded-xl shadow-sm border border-dashboard-border w-full max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-6 text-foreground border-b border-dashboard-border pb-4">
              Giới thiệu
            </h2>
            <div className="grid gap-6">
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Thông tin cơ bản
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    {/* <span className="material-symbols-outlined text-mainred filled">
                      rss_feed
                    </span> */}
                    <div className="text-base text-foreground">
                      <span className="text-muted-foreground">
                        Tên người dùng:
                      </span>{" "}
                      <span className="font-bold">@{user.username}</span>
                    </div>
                  </li>
                  {user.email && (
                    <li className="flex items-start gap-3">
                      {/* <Mail /> */}
                      <div className="text-base text-foreground">
                        <span className="text-muted-foreground">Email:</span>{" "}
                        <span className="font-bold">{user.email}</span>
                      </div>
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Về bản thân
                </h3>
                <p className="text-foreground text-base leading-relaxed">
                  {user?.description || (
                    <span className="italic opacity-60">
                      Chưa có lời giới thiệu nào
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "friends" && (
          <div className="bg-dashboard-card p-5 rounded-xl shadow-sm border border-dashboard-border">
            <h2 className="text-xl font-bold mb-6 text-foreground border-b border-dashboard-border pb-4">
              Bạn bè{" "}
              <span className="text-muted-foreground text-lg ml-2 font-normal">
                ({totalFriends})
              </span>
            </h2>
            {friends && friends.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {friends.map((friend) => (
                  <Link
                    key={friend.id}
                    href={`/profile/${friend.id}`}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border border-dashboard-border bg-dashboard-background hover:border-mainred/50 hover:shadow-sm transition-all"
                  >
                    <Image
                      src={friend.avatar_url || BLANK_AVATAR}
                      alt={friend.display_name || "User"}
                      width={96}
                      height={96}
                      className="rounded-full object-cover aspect-square border-2 border-dashboard-card shadow-sm"
                    />
                    <div className="text-center w-full">
                      <span className="text-sm block font-bold text-foreground truncate max-w-full">
                        {friend.display_name || friend.username}
                      </span>
                      {friend.global_role === "lecturer" && (
                        <span className="text-[10px] text-mainred font-semibold mt-1 inline-block bg-mainred/10 px-2 py-0.5 rounded-full">
                          Giảng viên
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-2">
                  person_off
                </span>
                <p>Chưa có bạn bè.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "photos" && (
          <div className="bg-dashboard-card p-5 rounded-xl shadow-sm border border-dashboard-border">
            <h2 className="text-xl font-bold mb-6 text-foreground border-b border-dashboard-border pb-4">
              Ảnh
            </h2>
            {avatars && avatars.length > 0 ? (
              <OldAvatars avatars={avatars} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-2">
                  no_photography
                </span>
                <p>Chưa có ảnh nào.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isOwner && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent
            className="max-w-2xl"
            onInteractOutside={(e) => {
              e.preventDefault(); // không cho đóng khi click ra ngoài
            }}
          >
            <DialogHeader>
              <DialogTitle>Chỉnh sửa trang cá nhân</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-6"
            >
              {/* Avatar Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ảnh đại diện
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-dashboard-background">
                    <Image
                      width={80}
                      height={80}
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarChange(file);
                      }}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mainred/10 file:text-mainred hover:file:bg-mainred/20"
                    />
                    <form.Field name="avatar_image">
                      {(field) => <FieldErrors field={field} />}
                    </form.Field>
                  </div>
                </div>
              </div>

              {/* Display Name Field */}
              <form.Field name="display_name">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Tên hiển thị *
                    </label>
                    <input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-dashboard-border bg-dashboard-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-mainred"
                      placeholder="Nhập tên hiển thị của bạn"
                    />
                    <FieldErrors field={field} />
                  </div>
                )}
              </form.Field>

              {/* Slug Field */}
              <form.Field name="slug">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Slug (URL Profile) *
                    </label>
                    <input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-dashboard-border bg-dashboard-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-mainred"
                      placeholder="Nhập slug (ví dụ: ten-cua-ban)"
                    />
                    <FieldErrors field={field} />
                  </div>
                )}
              </form.Field>

              {/* Description Field */}
              <form.Field name="description">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Giới thiệu
                    </label>
                    <textarea
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-dashboard-border bg-dashboard-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-mainred"
                      placeholder="Giới thiệu về bản thân..."
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <FieldErrors field={field} />
                      <div>{field.state.value.length}/500</div>
                    </div>
                  </div>
                )}
              </form.Field>

              {/* Dialog Footer */}
              <DialogFooter>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <>
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!canSubmit || isSubmitting}
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                      >
                        {isSubmitting ? "Đang cập nhật..." : "Save changes"}
                      </Button>
                    </>
                  )}
                </form.Subscribe>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Cover Image Dialog */}
      {isOwner && (
        <Dialog
          open={isCoverDialogOpen}
          onOpenChange={(open) => {
            setIsCoverDialogOpen(open);
            if (!open) {
              setCoverPreview(null);
              setCoverFile(null);
            }
          }}
        >
          <DialogContent
            className="max-w-2xl"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Chỉnh sửa ảnh bìa</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Preview */}
              <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden bg-dashboard-background border border-dashboard-border">
                {coverPreview ? (
                  <Image
                    src={coverPreview}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                ) : user.background_url ? (
                  <Image
                    src={user.background_url}
                    alt="Current cover"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-4xl mb-2">
                        add_photo_alternate
                      </span>
                      <p className="text-sm">Chọn ảnh bìa</p>
                    </div>
                  </div>
                )}
              </div>

              {/* File Input */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoverFile(file);
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setCoverPreview(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mainred/10 file:text-mainred hover:file:bg-mainred/20"
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isProfileUpdating}
                >
                  Hủy
                </Button>
              </DialogClose>
              <Button
                disabled={!coverFile || isProfileUpdating}
                onClick={async () => {
                  if (!coverFile || !currentUser) return;
                  try {
                    const formData = new FormData();
                    formData.append("cover_image", coverFile);
                    await updateProfile({
                      userId: currentUser.id,
                      data: formData,
                    });
                    toast.success("Cập nhật ảnh bìa thành công!");
                    setIsCoverDialogOpen(false);
                    setCoverPreview(null);
                    setCoverFile(null);
                  } catch (err) {
                    console.error("Cover update error:", err);
                    toast.error("Có lỗi xảy ra khi cập nhật ảnh bìa");
                  }
                }}
              >
                {isProfileUpdating ? "Đang tải lên..." : "Lưu ảnh bìa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default Profile;
