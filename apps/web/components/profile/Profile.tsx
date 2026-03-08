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
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Textarea } from "@repo/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { BadgeCheck, Camera, Pencil } from "lucide-react";
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
  const [coverPreview, setCoverPreview] = useState<string | null>(
    user?.background_url || null
  );

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
      phone_number: user?.phone_number || "",
      birth_date: user?.birth_date || "",
      avatar_image: undefined as File | undefined,
      cover_image: undefined as File | undefined,
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
        formData.append("phone_number", value.phone_number);
        formData.append("birth_date", value.birth_date);

        if (value.avatar_image) {
          formData.append("avatar_image", value.avatar_image);
        }
        if (value.cover_image) {
          formData.append("cover_image", value.cover_image);
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

  const handleCoverChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    form.setFieldValue("cover_image", file);
  };

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
              onClick={() => setIsDialogOpen(true)}
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
              <div className="flex items-center gap-2 justify-center">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {user?.display_name || user?.username}
                </h1>
                {user?.global_role === "lecturer" && (
                  <div
                    title="Giảng viên đã xác thực"
                    className="inline-flex items-center justify-center"
                  >
                    <BadgeCheck
                      className="w-6 h-6 text-blue-500"
                      fill="currentColor"
                      stroke="white"
                    />
                  </div>
                )}
              </div>
              <p className="text-foreground text-sm max-w-2xl leading-relaxed mt-2 line-clamp-2">
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
                        <div className="relative shrink-0">
                          <Image
                            src={friend.avatar_url || BLANK_AVATAR}
                            alt={friend.display_name || "User"}
                            width={64}
                            height={64}
                            className="rounded-full object-cover aspect-square border border-dashboard-border"
                          />
                          {friend.global_role === "lecturer" && (
                            <BadgeCheck
                              className="absolute -bottom-1 -right-1 w-5 h-5 text-blue-500 bg-white dark:bg-dashboard-card rounded-full"
                              fill="currentColor"
                              stroke="white"
                            />
                          )}
                        </div>
                        <span className="text-xs font-medium truncate max-w-full text-center mt-1">
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
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* THÔNG TIN CƠ BẢN */}
            <div className="bg-dashboard-card p-5 rounded-xl shadow-sm border border-dashboard-border">
              <h3 className="text-sm font-bold text-mainred uppercase tracking-wider mb-5">
                Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">
                    Mã SN sinh viên/cán bộ
                  </p>
                  <p className="text-[14px] font-semibold text-foreground text-wrap break-all">
                    @{user.username}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">
                    Họ và tên
                  </p>
                  <p className="text-[14px] font-semibold text-foreground">
                    {user.display_name}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">
                    Ngày sinh
                  </p>
                  <p className="text-[14px] font-semibold text-foreground">
                    {user.birth_date
                      ? new Date(user.birth_date).toLocaleDateString("vi-VN")
                      : "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">
                    Vai trò
                  </p>
                  <p className="text-[14px] font-semibold text-foreground capitalize">
                    {user.global_role || "Thành viên"}
                  </p>
                </div>
              </div>
            </div>

            {/* LIÊN HỆ */}
            <div className="bg-dashboard-card p-5 rounded-xl shadow-sm border border-dashboard-border">
              <h3 className="text-sm font-bold text-mainred uppercase tracking-wider mb-5">
                Liên hệ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">
                    Email
                  </p>
                  <p className="text-[14px] font-semibold text-foreground text-wrap break-all">
                    {user.email || "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">
                    Số điện thoại
                  </p>
                  <p className="text-[14px] font-semibold text-foreground">
                    {user.phone_number || "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">
                    URL Cá nhân
                  </p>
                  <p className="text-[14px] font-semibold text-foreground text-wrap break-all">
                    {user.slug ? `/${user.slug}` : "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            </div>

            {/* GIỚI THIỆU BẢN THÂN */}
            <div className="bg-dashboard-card p-5 rounded-xl shadow-sm border border-dashboard-border">
              <h3 className="text-sm font-bold text-mainred uppercase tracking-wider mb-5">
                Giới thiệu bản thân
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">
                    Tiểu sử
                  </p>
                  <p className="text-[14px] font-semibold text-foreground leading-relaxed whitespace-pre-wrap">
                    {user.description || (
                      <span className="italic opacity-60">
                        Chưa có lời giới thiệu nào
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">
                    Tương tác
                  </p>
                  <p className="text-[14px] font-semibold text-foreground">
                    {totalFriends || 0} người bạn
                  </p>
                </div>
              </div>
            </div>

            {/* THÔNG TIN TÀI KHOẢN */}
            <div className="bg-dashboard-card p-5 rounded-xl shadow-sm border border-dashboard-border">
              <h3 className="text-sm font-bold text-mainred uppercase tracking-wider mb-5">
                Thông tin tài khoản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">
                    ID Tài khoản
                  </p>
                  <p className="text-[12px] font-mono text-muted-foreground break-all">
                    {user.id}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">
                    Ngày tham gia
                  </p>
                  <p className="text-[14px] font-semibold text-foreground">
                    {user.create_at
                      ? new Date(user.create_at).toLocaleDateString("vi-VN")
                      : "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">
                    Cập nhật lần cuối
                  </p>
                  <p className="text-[14px] font-semibold text-foreground">
                    {user.updated_at
                      ? new Date(user.updated_at).toLocaleDateString("vi-VN")
                      : "Chưa cập nhật"}
                  </p>
                </div>
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
                    <div className="relative shrink-0">
                      <Image
                        src={friend.avatar_url || BLANK_AVATAR}
                        alt={friend.display_name || "User"}
                        width={96}
                        height={96}
                        className="rounded-full object-cover aspect-square border-2 border-dashboard-card shadow-sm"
                      />
                      {friend.global_role === "lecturer" && (
                        <div
                          title="Giảng viên"
                          className="absolute bottom-0 right-0"
                        >
                          <BadgeCheck
                            className="w-6 h-6 text-blue-500 bg-white dark:bg-dashboard-background rounded-full"
                            fill="currentColor"
                            stroke="white"
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-center w-full relative mt-1">
                      <span className="text-sm block font-bold text-foreground truncate max-w-full">
                        {friend.display_name || friend.username}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {/* <span className="material-symbols-outlined text-4xl mb-2">
                  person_off
                </span> */}
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
                {/* <span className="material-symbols-outlined text-4xl mb-2">
                  no_photography
                </span> */}
                <p>Chưa có ảnh nào.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isOwner && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent
            className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
            onInteractOutside={(e) => {
              e.preventDefault(); // không cho đóng khi click ra ngoài
            }}
          >
            <DialogHeader className="shrink-0">
              <DialogTitle>Chỉnh sửa trang cá nhân</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="flex-1 overflow-y-auto space-y-6 pr-2"
            >
              {/* Cover Field */}
              <div>
                <Label className="mb-2 block">Ảnh bìa</Label>
                <div className="flex flex-col space-y-4">
                  <div className="w-full h-32 md:h-40 rounded-xl overflow-hidden bg-dashboard-background border-2 border-dashed border-dashboard-border flex items-center justify-center relative">
                    {coverPreview ? (
                      <Image
                        fill
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Chưa có ảnh bìa
                      </span>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCoverChange(file);
                      }}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mainred/10 file:text-mainred hover:file:bg-mainred/20"
                    />
                    <form.Field name="cover_image">
                      {(field) => <FieldErrors field={field} />}
                    </form.Field>
                  </div>
                </div>
              </div>

              {/* Avatar Field */}
              <div>
                <Label className="mb-2 block">Ảnh đại diện</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Tên hiển thị *</Label>
                    <Input
                      id="display_name"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Nhập tên hiển thị của bạn"
                    />
                    <FieldErrors field={field} />
                  </div>
                )}
              </form.Field>

              {/* Phone Number Field */}
              <form.Field name="phone_number">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Số điện thoại</Label>
                    <Input
                      id="phone_number"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Nhập số điện thoại của bạn"
                    />
                    <FieldErrors field={field} />
                  </div>
                )}
              </form.Field>

              {/* Birth Date Field */}
              <form.Field name="birth_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Ngày sinh</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                    />
                    <FieldErrors field={field} />
                  </div>
                )}
              </form.Field>

              {/* Slug Field */}
              <form.Field name="slug">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL Profile) *</Label>
                    <Input
                      id="slug"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Nhập slug (ví dụ: ten-cua-ban)"
                    />
                    <FieldErrors field={field} />
                  </div>
                )}
              </form.Field>

              {/* Description Field */}
              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="description">Giới thiệu</Label>
                    <Textarea
                      id="description"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={4}
                      className="resize-none w-full"
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
              <DialogFooter className="shrink-0 pt-4 border-t border-dashboard-border mt-2">
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
    </div>
  );
}

export default Profile;
