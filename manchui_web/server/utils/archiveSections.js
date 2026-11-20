/**
 * 아카이브 항목 본문 속 섹션(콜아웃) 형식. client/src/pages/Admin/archiveSections.js 와 같은 형식.
 *   @@section 📌 섹션 제목
 *   내용…
 */
const DEFAULT_ICON = "💡";
const MARKER = /^@@section(?:[ \t]+(.*?))?[ \t]*$/;

function parseSections(body = "") {
  const sections = [{ icon: null, title: "", lines: [] }];
  for (const line of String(body).split("\n")) {
    const m = line.match(MARKER);
    if (m) {
      const [icon, ...rest] = (m[1] || "").split(/\s+/).filter(Boolean);
      sections.push({ icon: icon || DEFAULT_ICON, title: rest.join(" "), lines: [] });
    } else sections[sections.length - 1].lines.push(line);
  }
  return sections.map(({ icon, title, lines }) => ({ icon, title, text: lines.join("\n").replace(/^\n+|\n+$/g, "") }));
}

function serializeSections(sections) {
  const [lead = { text: "" }, ...callouts] = sections;
  const parts = lead.text ? [lead.text] : [];
  for (const s of callouts) {
    const title = (s.title || "").replace(/\s+/g, " ").trim();
    parts.push(`@@section ${s.icon || DEFAULT_ICON}${title ? ` ${title}` : ""}\n${s.text}`);
  }
  return parts.join("\n\n");
}

/** 이 본문에 해당 제목의 섹션이 있는지 (같은 날 항목을 섹션으로 합친 뒤 스크립트를 다시 돌릴 때 중복 방지) */
const hasSectionTitled = (body, title) => parseSections(body).some((s) => s.icon !== null && s.title === title);

module.exports = { DEFAULT_ICON, parseSections, serializeSections, hasSectionTitled };
