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

/** tagLine에 태그 하나를 추가하거나 제거(토글) */
export function toggleTagInTagLine(tagLine, rawTag) {
  const tag = String(rawTag ?? "")
    .replace(/^#+/, "")
    .trim();
  if (!tag) return tagLine;
  const key = tag.toLowerCase();
  const existing = parseHashtagString(tagLine);
  const has = existing.some((t) => t.toLowerCase() === key);
  const next = has
    ? existing.filter((t) => t.toLowerCase() !== key)
    : [...existing, tag];
  return tagsToTagLine(next);
}

/** tagLine에 해당 태그가 포함돼 있는지 */
export function tagLineHasTag(tagLine, rawTag) {
  const key = String(rawTag ?? "")
    .replace(/^#+/, "")
    .trim()
    .toLowerCase();
  if (!key) return false;
  return parseHashtagString(tagLine).some((t) => t.toLowerCase() === key);
}

/** 확정 태그 배열에 태그가 있는지 */
export function tagListHasTag(tags, rawTag) {
  const key = String(rawTag ?? "")
    .replace(/^#+/, "")
    .trim()
    .toLowerCase();
  if (!key) return false;
  return (Array.isArray(tags) ? tags : []).some(
    (t) => t.toLowerCase() === key,
  );
}

/** 확정 태그 배열에 태그 추가·제거(토글) */
export function toggleTagInList(tags, rawTag) {
  const tag = String(rawTag ?? "")
    .replace(/^#+/, "")
    .trim();
  if (!tag) return Array.isArray(tags) ? tags : [];
  const key = tag.toLowerCase();
  const list = Array.isArray(tags) ? tags : [];
  const has = list.some((t) => t.toLowerCase() === key);
  if (has) return list.filter((t) => t.toLowerCase() !== key);
  return [...list, tag];
}

/** 등록 폼 입력 초안 → 태그 문자열(# 제거) */
export function normalizeEditorDraftTag(raw) {
  return String(raw ?? "")
    .replace(/^#+/, "")
    .trim();
}

/** 등록 폼: 확정 태그 + 입력 중 초안 → API용 tagLine */
export function tagLineFromEditorState(committedTags, tagDraft) {
  const merged = [...(Array.isArray(committedTags) ? committedTags : [])];
  const seen = new Set(merged.map((t) => t.toLowerCase()));
  const add = (raw) => {
    const t = normalizeEditorDraftTag(raw);
    if (!t) return;
    const k = t.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      merged.push(t);
    }
  };
  for (const t of parseHashtagString(tagDraft)) add(t);
  const leftover = String(tagDraft ?? "")
    .replace(/#[^\s#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (leftover) add(leftover);
  return tagsToTagLine(merged);
}
