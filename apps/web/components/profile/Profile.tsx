"use client";
import { useForm } from "@tanstack/react-form";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { getUserAvatars } from "@/app/actions/user";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGetCurrentUser, useUpdateProfile } from "@/hooks/useAuth";
import { updateProfileSchema } from "@/lib/validations/updateProfile-schema";
import { Avatar, BLANK_AVATAR, User } from "@repo/shared/types/user";

import { FieldErrors } from "../FieldErrors";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import OldAvatars from "./OldAvatars";

interface ProfileProps {
  user: User;
}

function Profile({ user }: ProfileProps) {
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.avatar_url || BLANK_AVATAR
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [avatars, setAvatars] = useState<Avatar[]>([]);

  const { data: currentUser, error } = useGetCurrentUser();

  // TODO , sửa logic để lấy all avatars
  useEffect(() => {
    const fetchAvatars = async () => {
      const data = await getUserAvatars(user.id);
      setAvatars(data);
    };
    fetchAvatars();
  }, []);

  const form = useForm({
    defaultValues: {
      display_name: user?.display_name || "",
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

  return error || !user ? (
    <>
      <div>User not found</div>
      <Skeleton className="h-12 my-4 max-w-[30px]" />
      <Button onClick={() => router.back()}>Go Back</Button>
    </>
  ) : (
    <div>
      <p>Display name: {user?.display_name || user?.username}</p>
      <p>Username: {user?.username}</p>
      <p>Email: {user?.email}</p>
      <p>Roles: {user?.global_role}</p>

      <div>
        <p>Avatar</p>
        <Image
          loading="lazy"
          width={200}
          height={200}
          alt={`Avatar user ${user?.id}`}
          src={user?.avatar_url ?? BLANK_AVATAR}
        />
      </div>

      <Button onClick={() => router.back()}>Go Back</Button>

      <div>
        The last change avatar_image
        <OldAvatars avatars={avatars} />
      </div>

      <p>Des : {user?.description}</p>

      {isOwner && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Update Profile</Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh đại diện
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                    <Image
                      width={10}
                      height={10}
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
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên hiển thị *
                    </label>
                    <input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập tên hiển thị của bạn"
                    />
                    <FieldErrors field={field} />
                  </div>
                )}
              </form.Field>

              {/* Description Field */}
              <form.Field name="description">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giới thiệu
                    </label>
                    <textarea
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Giới thiệu về bản thân..."
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
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
    </div>
  );
}

export default Profile;
