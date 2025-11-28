import { z } from "zod";

// Tách file schema riêng để có thể dùng sync validation
export const fileImageSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "Vui lòng chọn ảnh")
  .refine(
    (file) =>
      ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(
        file.type
      ),
    "Chỉ hỗ trợ định dạng JPEG, PNG và WebP"
  )
  .refine((file) => file.size <= 5_000_000, "Kích thước file phải nhỏ hơn 5MB");
