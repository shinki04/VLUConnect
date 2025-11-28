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

const privacyLevels = ["public", "friends", "private"] as const;
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
    .optional()
    .default([]),
  privacy_level: privacyLevelEnum.default("public"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
