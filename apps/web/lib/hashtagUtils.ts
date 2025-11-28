export function extractHashtags(content: string) {
  const hashtagRegex = /#[\wà-ỹÀ-Ỹ]+/g;
  const matches = content.match(hashtagRegex);

  if (!matches) return [];

  // Loại bỏ dấu # và chuyển thành chữ thường
  return matches
    .map((tag) => tag.replace("#", "").toLowerCase())
    .filter((tag) => tag.length > 0);
}
