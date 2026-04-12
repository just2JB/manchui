/**
 * 인스타그램식 #태그 문자열을 파싱해 중복 제거된 태그 배열 반환(저장 시 # 제외).
 * @param {string} raw
 * @returns {string[]}
 */
function parseHashtagString(raw) {
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
 * JSON 배열이 오면 문자열만 정리(레거시·직접 배열 전송 대비)
 * @param {unknown} arr
 * @returns {string[]}
 */
function normalizeTagArray(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Map();
  for (const x of arr) {
    const t = String(x ?? "")
      .replace(/^#+/, "")
      .trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (!seen.has(key)) seen.set(key, t);
  }
  return [...seen.values()];
}

module.exports = { parseHashtagString, normalizeTagArray };
