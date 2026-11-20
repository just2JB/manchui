/**
 * 공지 본문 첫 줄로 제목 만들기 (나누기 기능·원문 가져오기 스크립트 공용).
 * '파일: ...' 줄, 링크만 있는 줄, 톡게시판 표시는 건너뛰고 앞뒤 이모지·기호를 뗀다.
 */
const MAX = 60;

const cleanLine = (line) =>
  line
    .replace(/\*\*/g, "")
    .replace(/^톡게시판 '[^']*': /, "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[^\p{L}\p{N})\]!?]+$/u, "")
    .trim();

function titleFromBody(body, fallback = "나눈 항목") {
  for (const raw of String(body ?? "").split("\n")) {
    const line = raw.trim();
    if (!line || /^파일: /.test(line) || /^https?:\/\//.test(line)) continue;
    const text = cleanLine(line);
    if (text.length < 2) continue;
    return text.length > MAX ? `${text.slice(0, MAX - 1)}…` : text;
  }
  return fallback;
}

module.exports = { titleFromBody };
