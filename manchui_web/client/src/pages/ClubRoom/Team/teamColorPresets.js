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

const DEFAULT_ACCENT = "#E87070";
// 화면에서 쓸 팀 색 밝기 범위 (상대 휘도). 이 범위를 벗어나면 배경에 묻힌다.
const MIN_LUMINANCE = 0.16;
const MAX_LUMINANCE = 0.62;

function parseHexColor(color) {
  const raw = String(color ?? "").trim().replace(/^#/, "");
  const hex =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
}

function relativeLuminance([r, g, b]) {
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function rgbToHsl([r, g, b]) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb([h, s, l]) {
  if (s === 0) return [l, l, l].map((v) => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)].map((v) => Math.round(v * 255));
}

function toHex(rgb) {
  return `#${rgb.map((value) => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** 너무 어둡거나(검정 등) 너무 밝은(흰색 등) 팀 색이면 배경에 묻히지 않을 만큼 보정 */
export function isTeamColorTooDark(color) {
  const rgb = parseHexColor(color);
  return Boolean(rgb) && relativeLuminance(rgb) < MIN_LUMINANCE;
}

export function isTeamColorTooLight(color) {
  const rgb = parseHexColor(color);
  return Boolean(rgb) && relativeLuminance(rgb) > MAX_LUMINANCE;
}

export function toVisibleTeamColor(color, fallback = DEFAULT_ACCENT) {
  const rgb = parseHexColor(color);
  if (!rgb) return color || fallback;

  const luminance = relativeLuminance(rgb);
  if (luminance >= MIN_LUMINANCE && luminance <= MAX_LUMINANCE) return toHex(rgb);

  // 색조·채도는 그대로 두고 밝기(HSL L)만 조금씩 옮긴다
  const [h, sat, l] = rgbToHsl(rgb);
  const direction = luminance < MIN_LUMINANCE ? 1 : -1;
  let next = rgb;
  for (let step = 1; step <= 40; step += 1) {
    const lightness = Math.min(1, Math.max(0, l + direction * step * 0.02));
    next = hslToRgb([h, sat, lightness]);
    const value = relativeLuminance(next);
    if (value >= MIN_LUMINANCE && value <= MAX_LUMINANCE) break;
  }
  return toHex(next);
}
