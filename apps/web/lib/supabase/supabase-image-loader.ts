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
    // Check if it's a Supabase URL
    if (src.includes('.supabase.co/storage/')) {
      // Already a Supabase storage URL, add transform params
      const url = new URL(src);
      url.searchParams.set('width', width.toString());
      url.searchParams.set('quality', (quality || 75).toString());
      return url.toString();
    }
    // External URL, return as-is
    return src;
  }

  // Local public assets (e.g., /logo_red_noname.png) - serve directly
  if (src.startsWith('/')) {
    return src;
  }

  // Relative path (no leading slash) - treat as Supabase storage path
  // Encode the path segments properly to handle special characters
  const encodedPath = src
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

  return `${supabaseUrl}/storage/v1/object/public/${encodedPath}?width=${width}&quality=${quality || 75}`;
}

