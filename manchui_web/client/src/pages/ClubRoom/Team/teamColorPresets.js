/** 팀 카드·아바타에 쓰는 추천 색상 (어두운 배경에서도 구분되도록 채도 유지) */
export const TEAM_COLOR_PRESETS = [
  "#E85050",
  "#FF5C7A",
  "#F06B9A",
  "#E87BB0",
  "#F08A40",
  "#F0A850",
  "#E8C050",
  "#D4B84A",
  "#8FBC6B",
  "#5CB85C",
  "#3DB89A",
  "#4ECAD4",
  "#4A9FE8",
  "#5B8DEF",
  "#6B7BE8",
  "#7B68EE",
  "#9B6BE8",
  "#B06BE8",
  "#C77DFF",
  "#78909C",
  "#90A4AE",
  "#8D6E63",
  "#A1887F",
  "#B0BEC5",
];

export const DEFAULT_TEAM_COLOR = TEAM_COLOR_PRESETS[0];

export function isTeamColorPreset(color) {
  const normalized = String(color ?? "").toLowerCase();
  return TEAM_COLOR_PRESETS.some(
    (preset) => preset.toLowerCase() === normalized,
  );
}
