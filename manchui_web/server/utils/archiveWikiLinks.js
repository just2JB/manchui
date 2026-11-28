/**
 * 본문 속 옵시디언식 위키링크 [[대상]] · [[대상|보이는 글]] · [[대상#소제목]] 에서 대상 이름만 뽑는다.
 * 같은 대상은 한 번만, 최대 50개.
 */
const WIKI_LINK = /\[\[([^[\]\n]+?)\]\]/g;

const wikiLinksOf = (text) => {
  const out = new Set();
  for (const match of String(text ?? "").matchAll(WIKI_LINK)) {
    const raw = match[1].split("|")[0].trim();
    // [[#태그]] 는 그대로, [[기록#소제목]] 은 기록 이름만
    const target = (raw.startsWith("#") ? raw : raw.split("#")[0].trim()).slice(0, 120);
    if (target) out.add(target);
    if (out.size >= 50) break;
  }
  return [...out];
};

module.exports = { wikiLinksOf };
