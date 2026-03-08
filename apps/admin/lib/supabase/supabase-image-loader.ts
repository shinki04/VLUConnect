/**
 * Supabase image loader for Next.js Image component.
 * This file is referenced by next.config.ts
 */
export default function supabaseLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // If src is already a full URL, use it directly
  if (src.startsWith('http://') || src.startsWith('https://')) {
    if (src.includes('.supabase.co/storage/')) {
      const url = new URL(src);
      url.searchParams.set('width', width.toString());
      url.searchParams.set('quality', (quality || 75).toString());
      return url.toString();
    }
    return src;
  }

  // Local public assets (e.g., /logo.png) - serve directly
  if (src.startsWith('/')) {
    return src;
  }

  // Relative path (no leading slash) - treat as Supabase storage path
  const encodedPath = src
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

  return `${supabaseUrl}/storage/v1/object/public/${encodedPath}?width=${width}&quality=${quality || 75}`;
}
