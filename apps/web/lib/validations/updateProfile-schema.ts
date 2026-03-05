import { z } from "zod";

import { fileImageSchema } from "./fileImage-schema";

// Stricter: chỉ chữ, số, space
const stricterTextRegex = /^[a-zA-Z0-9\s]*$/;
// An toàn hơn: cho phép chữ Unicode, số, space
const safeTextRegex = /^[\p{L}\p{N}\s]+$/u;

// Schema cho client-side validation (sync)
export const updateProfileSchema = z.object({
  description: z
    .string()
    .refine((val) => val === "" || safeTextRegex.test(val), {
      message: "Mô tả chứa ký tự không hợp lệ",
    })
    .max(500, "Mô tả không được quá 500 ký tự")
    .transform((val) => val.trim()),

  display_name: z
    .string()
    .min(2, "Tên hiển thị phải có ít nhất 2 ký tự")
    .max(50, "Tên hiển thị không được quá 50 ký tự")
    .refine((val) => safeTextRegex.test(val), {
      message: "Tên hiển thị chứa ký tự không hợp lệ",
    })
    .transform((val) => val.trim()),

  slug: z
    .string()
    .min(2, "Slug phải có ít nhất 2 ký tự")
    .max(50, "Slug không được quá 50 ký tự")
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      "Slug chỉ được chứa chữ cái không dấu, số, gạch ngang và gạch dưới"
    ),

  phone_number: z
    .string()
    .refine((val) => {
      if (val === "") return true;
      const cleaned = val.replace(/[\s\-\.]/g, "");
      return /^[0-9]{10,11}$/.test(cleaned);
    }, {
      message: "Số điện thoại không hợp lệ (cần 10-11 số)",
    }),

  birth_date: z
    .string()
    .refine((val) => val === "" || !isNaN(Date.parse(val)), {
      message: "Ngày sinh không hợp lệ",
    }),

  avatar_image: z.union([
    fileImageSchema.refine((file) => file.size >= 2, "Chỉ được chọn 1 ảnh"),
    z.undefined(),
  ]),

  cover_image: z.union([
    fileImageSchema.refine((file) => file.size >= 2, "Chỉ được chọn 1 ảnh"),
    z.undefined(),
  ]),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
