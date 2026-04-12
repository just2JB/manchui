/** @param {string} raw */
export function parseHashtagString(raw) {
  if (raw == null || !String(raw).trim()) return [];
  const s = String(raw);
  const seen = new Map();
  const re = /#([^\s#]+)/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const t = m[1].trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (!seen.has(key)) seen.set(key, t);
  }
  return [...seen.values()];
}

/**
 * 검색 q 문자열 → 해시 태그 목록(순서 유지, 대소문자 구분 첫 등장) + 나머지 일반 검색어
 */
export function splitSearchQuery(raw) {
  const s = raw != null ? String(raw) : "";
  const trimmed = s.trim();
  if (!trimmed) return { tags: [], rest: "" };
  const tags = [];
  const seen = new Set();
  const re = /#([^\s#]+)/g;
  let m;
  while ((m = re.exec(trimmed)) !== null) {
    const t = m[1].trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      tags.push(t);
    }
  }
  const rest = trimmed.replace(/#[^\s#]+/g, " ").replace(/\s+/g, " ").trim();
  return { tags, rest };
}

/**
 * 입력 칸 끝에만 있는 `#` 또는 `#글자`(스페이스로 아직 확정 안 된 부분)를 제거한 문자열.
 * API/디바운스 검색에 사용해, 타이핑 중인 해시는 검색 조건에 넣지 않음.
 */
export function stripTrailingIncompleteHashtag(rest) {
  return String(rest ?? "")
    .replace(/#[^\s#]*$/g, "")
    .trimEnd();
}

/** 태그 배열 + 일반 검색어 → API용 q 한 줄 */
export function joinSearchQuery(tags, rest) {
  const tagPart = (Array.isArray(tags) ? tags : [])
    .map((t) => String(t ?? "").replace(/^#+/, "").trim())
    .filter(Boolean);
  const unique = [];
  const seen = new Set();
  for (const t of tagPart) {
    const k = t.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      unique.push(t);
    }
  }
  const tp = unique.map((t) => `#${t}`).join(" ");
  const r = String(rest ?? "").trim();
  if (!tp) return r;
  if (!r) return tp;
  return `${tp} ${r}`;
}

/** API의 tags 배열 → 편집용 #a #b 문자열 */
export function tagsToTagLine(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return tags
    .map((t) => {
      const s = String(t ?? "").replace(/^#+/, "").trim();
      return s ? `#${s}` : "";
    })
    .filter(Boolean)
    .join(" ");
}
