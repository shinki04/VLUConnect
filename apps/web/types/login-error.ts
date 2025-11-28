export const ERROR_MESSAGES = {
  invalid_domain: "Email không thuộc VLU — tài khoản đã bị xoá!",
  user_not_found: "Không tìm thấy tài khoản. Vui lòng thử lại!",
  default: "Có lỗi xảy ra. Vui lòng thử lại!",
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
