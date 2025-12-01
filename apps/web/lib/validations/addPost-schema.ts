import { privacyPost } from "@repo/shared/types/post";
import { z } from "zod";

// Định nghĩa các loại file được phép
const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/gif",
  "image/svg+xml",
];
const allowedVideoTypes = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];
const allowedDocumentTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const allowedExcelTypes = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
];

const allAllowedTypes = [
  ...allowedImageTypes,
  ...allowedVideoTypes,
  ...allowedDocumentTypes,
  ...allowedExcelTypes,
];

export const fileMediaSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "File không được để trống")
  .refine(
    (file) => allAllowedTypes.includes(file.type),
    "Chỉ hỗ trợ file ảnh, video, tài liệu (PDF, Word, Text) và Excel"
  )
  .refine(
    (file) => file.size <= 10_000_000,
    "Kích thước file phải nhỏ hơn 10MB"
  );

export const privacyLevels: privacyPost[] = ["public", "friends", "private"];
export type PrivacyPost = (typeof privacyLevels)[number];
export const privacyLevelEnum = z.enum(privacyLevels);

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Nội dung không được để trống")
    .max(5000, "Nội dung quá dài"),
  media: z
    .array(fileMediaSchema)
    .max(10, "Chỉ được chọn tối đa 10 file")
    .default([]),
  privacy_level: privacyLevelEnum.default("public"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

// Validator for individual fields
export const validateContent = (value: string) => {
  const schema = z
    .string()
    .min(1, "Nội dung không được để trống")
    .max(5000, "Nội dung quá dài");
  const result = schema.safeParse(value);
  return result.success
    ? undefined
    : result.error.flatten().formErrors[0] || result.error.issues[0]?.message;
};

export const validateMedia = (files: File[]) => {
  const schema = z
    .array(fileMediaSchema)
    .max(10, "Chỉ được chọn tối đa 10 file");
  const result = schema.safeParse(files);
  return result.success
    ? undefined
    : result.error.flatten().formErrors[0] || result.error.issues[0]?.message;
};
