/** 오픈 리디렉션 방지: 같은 앱 내 상대 경로만 허용 */
export function safeInternalPath(raw, fallback = "/club") {
  if (raw == null || typeof raw !== "string") return fallback;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    return fallback;
  }
  if (!s.startsWith("/") || s.startsWith("//")) return fallback;
  return s || fallback;
}
