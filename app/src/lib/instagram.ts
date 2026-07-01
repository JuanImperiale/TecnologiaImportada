export type InstagramMediaType = 'reel' | 'p' | 'tv';

export interface ParsedInstagramPost {
  mediaType: InstagramMediaType;
  shortcode: string;
  canonicalUrl: string;
  embedUrl: string;
}

const INSTAGRAM_POST_RE = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(reel|p|tv)\/([^/?#]+)/i;

/**
 * Parse and normalize Instagram post/reel/tv URLs into canonical and embed variants.
 */
export function parseInstagramPostUrl(rawUrl: string): ParsedInstagramPost | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const match = trimmed.match(INSTAGRAM_POST_RE);
  if (!match) return null;

  const mediaType = match[1].toLowerCase() as InstagramMediaType;
  const shortcode = match[2];
  const canonicalUrl = `https://www.instagram.com/${mediaType}/${shortcode}/`;
  const embedUrl = `https://www.instagram.com/${mediaType}/${shortcode}/embed`;

  return {
    mediaType,
    shortcode,
    canonicalUrl,
    embedUrl,
  };
}
