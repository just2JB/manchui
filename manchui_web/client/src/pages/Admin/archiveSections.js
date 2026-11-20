/**
 * 본문 안의 섹션(노션 콜아웃처럼 보이는 상자).
 * 본문은 그대로 문자열로 저장하고, 섹션 시작 줄만 표시한다:
 *   첫 섹션 앞 내용(평범한 글)
 *   @@section 📌 섹션 제목(없어도 됨)
 *   콜아웃 내용…
 * 검색·스크립트가 본문을 문자열로 다루므로 형식은 이 한 줄뿐이다. (server/utils/archiveSections.js 와 같은 형식)
 */
export const SECTION_ICONS = ["💡", "📌", "📢", "📅", "📍", "✅", "⚠️", "💸"];
export const DEFAULT_ICON = SECTION_ICONS[0];
const MARKER = /^@@section(?:[ \t]+(.*?))?[ \t]*$/;

/** → [{ icon: null | string, title, text }]. 첫 항목(icon null)은 콜아웃이 아닌 평범한 글. */
export const parseSections = (body = "") => {
  const sections = [{ icon: null, title: "", lines: [] }];
  for (const line of String(body).split("\n")) {
    const m = line.match(MARKER);
    if (m) {
      const [icon, ...rest] = (m[1] || "").split(/\s+/).filter(Boolean);
      sections.push({ icon: icon || DEFAULT_ICON, title: rest.join(" "), lines: [] });
    } else sections[sections.length - 1].lines.push(line);
  }
  return sections.map(({ icon, title, lines }) => ({ icon, title, text: lines.join("\n").replace(/^\n+|\n+$/g, "") }));
};

export const serializeSections = (sections) => {
  const [lead = { text: "" }, ...callouts] = sections;
  const parts = lead.text ? [lead.text] : [];
  for (const s of callouts) {
    const title = (s.title || "").replace(/\s+/g, " ").trim();
    parts.push(`@@section ${s.icon || DEFAULT_ICON}${title ? ` ${title}` : ""}\n${s.text}`);
  }
  return parts.join("\n\n");
};

/** 섹션 표시 줄을 뺀 순수 글 (미리보기·검색 문맥용) */
export const plainText = (body = "") => String(body).split("\n").filter((line) => !MARKER.test(line)).join("\n");
