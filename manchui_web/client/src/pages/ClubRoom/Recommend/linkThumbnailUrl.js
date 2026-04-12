/**
 * 영상·음원 링크에서 미리보기 썸네일 URL을 추론 (DB 없이 클라이언트 전용).
 * 지원: YouTube, Vimeo(서드파티 썸네일 프록시). 그 외는 null → 플레이스홀더 아이콘.
 */

function extractYouTubeId(raw) {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const shorts = u.pathname.match(/\/shorts\/([\w-]{11})/);
      if (shorts) return shorts[1];
      const embed = u.pathname.match(/\/embed\/([\w-]{11})/);
      if (embed) return embed[1];
      const live = u.pathname.match(/\/live\/([\w-]{11})/);
      if (live) return live[1];
    }
  } catch {
    return null;
  }
  return null;
}

function extractVimeoId(raw) {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "vimeo.com") {
      const m = u.pathname.match(/\/(?:video\/)?(\d+)/);
      return m ? m[1] : null;
    }
    if (host.includes("player.vimeo.com")) {
      const m = u.pathname.match(/\/video\/(\d+)/);
      return m ? m[1] : null;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * @param {string | undefined} url 링크
 * @param {string | undefined} persistedThumbnail 서버에 저장된 썸네일 URL(있으면 우선)
 * @returns {string | null} 이미지 URL 또는 알 수 없으면 null
 */
export function getLinkThumbnailUrl(url, persistedThumbnail) {
  if (persistedThumbnail && String(persistedThumbnail).trim()) {
    return String(persistedThumbnail).trim();
  }
  if (!url || typeof url !== "string") return null;
  const yt = extractYouTubeId(url);
  if (yt) {
    return `https://img.youtube.com/vi/${yt}/mqdefault.jpg`;
  }
  const vm = extractVimeoId(url);
  if (vm) {
    return `https://vumbnail.com/${vm}`;
  }
  return null;
}
