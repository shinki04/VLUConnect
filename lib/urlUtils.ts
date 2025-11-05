"use client";

import { ReadonlyURLSearchParams } from "next/navigation";

type UpdateQueryParamsOptions = {
  resetPage?: boolean;
  scroll?: boolean;
  shallow?: boolean;
};

/**
scroll: false → giữ nguyên vị trí cuộn, không đẩy trang về đầu.
shallow: true → không reload lại toàn bộ route, chỉ thay đổi URL và state client.
resetPage: true → tự set page=1, tiện cho filter/sort mà không cần code thêm.
 */

/**
 * Cập nhật 1 hoặc nhiều query param trên URL hiện tại
 * @param searchParams - object searchParams của Next.js
 * @param pathname - current pathname (usePathname())
 * @param replace - hàm replace của useRouter()
 * @param updates - object key-value chứa các param cần cập nhật
 * @param options - { resetPage?: boolean, scroll?: boolean, shallow?: boolean }
 */
export function updateQueryParams(
  searchParams: ReadonlyURLSearchParams | URLSearchParams,
  pathname: string,
  replace: (
    url: string,
    options?: { scroll?: boolean; shallow?: boolean }
  ) => void,
  updates: Record<string, string | undefined>,
  options?: UpdateQueryParamsOptions
) {
  const params = new URLSearchParams(searchParams.toString());

  // Gộp updates vào URL hiện tại
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null) params.delete(key);
    else params.set(key, value);
  }

  // Optionally reset page về 1 nếu flag được bật
  if (options?.resetPage) {
    params.set("page", "1");
  }

  replace(`${pathname}?${params.toString()}`, {
    scroll: options?.scroll ?? true, // mặc định scroll về đầu
    shallow: options?.shallow ?? true, // mặc định không render
    // shallow: options?.shallow ?? false, // mặc định render lại toàn bộ
  });
}
