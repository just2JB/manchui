/**
 * 링크 썸네일 URL 추출.
 * - Spotify: 공식 oEmbed(JSON의 thumbnail_url) — 앨범/트랙/플레이리스트 커버에 가깝게 동작하는 편.
 * - 그 외: HTML og:image / twitter:image (벅스·멜론 등).
 * Instagram 등은 로그인·봇 차단으로 자주 실패할 수 있음.
 */

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function isPublicHttpUrl(urlString) {
  try {
    const u = new URL(urlString);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "::1") return false;
    if (h.endsWith(".local")) return false;
    if (/^10\./.test(h)) return false;
    if (/^192\.168\./.test(h)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
    return true;
  } catch {
    return false;
  }
}

function extractOgImage(html) {
  if (!html || typeof html !== "string") return null;
  const patterns = [
    /<meta[^>]*property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::url)?["'][^>]*>/i,
    /<meta[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["'][^>]*>/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

/**
 * https://developer.spotify.com/documentation/widgets/oembed/
 * 인증 없이 thumbnail_url 제공 (트랙·앨범·플레이리스트 등 open.spotify 링크).
 */
async function fetchSpotifyOEmbedThumbnail(pageUrl) {
  let host;
  try {
    host = new URL(pageUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host.includes("spotify.com")) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const api = `https://open.spotify.com/oembed?url=${encodeURIComponent(pageUrl)}`;
    const res = await fetch(api, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const thumb = data?.thumbnail_url;
    if (!thumb || typeof thumb !== "string") return null;
    if (!isPublicHttpUrl(thumb)) return null;
    return thumb;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

/**
 * @param {string} pageUrl
 * @returns {Promise<string|null>}
 */
async function fetchOpenGraphImage(pageUrl) {
  const urlStr = String(pageUrl || "").trim();
  if (!urlStr || !isPublicHttpUrl(urlStr)) return null;

  const spotifyThumb = await fetchSpotifyOEmbedThumbnail(urlStr);
  if (spotifyThumb) return spotifyThumb;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(urlStr, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": DEFAULT_UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      return null;
    }

    const html = await res.text();
    const raw = extractOgImage(html);
    if (!raw) return null;

    let absolute;
    try {
      absolute = new URL(raw, urlStr).href;
    } catch {
      return null;
    }

    if (!isPublicHttpUrl(absolute)) return null;
    return absolute;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

module.exports = { fetchOpenGraphImage };
