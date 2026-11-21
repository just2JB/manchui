import { tr } from "./lightingI18n";
import { formatTime, getPresetName, parseTime } from "./lightingPresets";

/**
 * 조명 큐시트를 시트 파일(CSV)로 내려받기. 엑셀 · 구글 시트 · 넘버스에서 열린다.
 * - 엑셀에서 한글이 안 깨지게 BOM 을 붙인다
 * - "00:07" 이 엑셀에서 시각(0시 7분)으로 바뀌지 않게 ="00:07" 로 넣는다
 */

const cell = (value) => {
  const s = String(value ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const timeCell = (text) => (text ? `="${text}"` : "");
/** 사람이 적은 글(팀 이름 · 설명): = + - @ 로 시작하면 엑셀이 수식으로 실행하지 않게 앞에 ' 를 붙인다 */
const textCell = (value) => {
  const s = String(value ?? "");
  return cell(/^[=+\-@]/.test(s) ? `'${s}` : s);
};
const TEXT_COLUMNS = new Set([1, 9]);

/** 팀 하나의 구간을 시작 시간 순으로, 끝 시간(다음 구간 시작 또는 곡 끝)까지 붙여서 */
function teamLines(team) {
  const lengthSec = parseTime(team.length);
  const rows = [...(team.rows || [])].sort(
    (a, b) =>
      (parseTime(a.start) ?? 0) - (parseTime(b.start) ?? 0) ||
      String(a.createdAt).localeCompare(String(b.createdAt)),
  );
  return rows.map((r, i) => {
    const start = parseTime(r.start) ?? 0;
    const next = rows[i + 1] ? parseTime(rows[i + 1].start) ?? 0 : lengthSec;
    return [
      team.order ?? "",
      team.name || "",
      team.channel,
      timeCell(team.length || ""),
      i + 1,
      timeCell(formatTime(start)),
      timeCell(next !== null && next !== undefined ? formatTime(next) : ""),
      r.preset,
      getPresetName(team.channel, r.preset),
      r.note || "",
    ];
  });
}

/** teams: [{ order, name, channel, length, rows: [{ start, preset, note, createdAt }] }] */
export function buildLightingCsv(teams) {
  const header = [
    tr("colOrder"),
    tr("colTeam"),
    tr("colChannel"),
    tr("songLength"),
    tr("colNo"),
    tr("colStart"),
    tr("colEnd"),
    tr("colLightNo"),
    tr("colLight"),
    tr("colNote"),
  ];
  const lines = [header];
  teams.forEach((team) => {
    const body = teamLines(team);
    // 구간이 없는 팀도 한 줄은 보이게
    lines.push(...(body.length ? body : [[team.order ?? "", team.name || "", team.channel, timeCell(team.length || ""), "", "", "", "", "", ""]]));
  });
  return lines
    .map((line) =>
      line
        .map((v, i) => {
          if (TEXT_COLUMNS.has(i)) return textCell(v);
          return String(v).startsWith('="') ? v : cell(v);
        })
        .join(","),
    )
    .join("\r\n");
}

export function downloadCsv(filename, csv) {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 파일 이름에 못 쓰는 글자 정리 */
export function safeFileName(text) {
  return String(text || "lighting").replace(/[\\/:*?"<>|]+/g, "_").trim() || "lighting";
}
