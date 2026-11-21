import { tr } from "./lightingI18n";

/**
 * 조명 프리셋 설정 (정기공연 1회용).
 *
 * 콘솔 채널 28 · 29 · 30, 채널마다 1~10번 (30-8 은 비어 있음).
 * 이미지(16:9): client/public/lighting-presets/ch{채널}-{번호}.jpg  예) ch28-1.jpg
 * 이미지가 없으면 색 그라데이션으로 대체 미리보기가 보입니다.
 * 이름을 붙이려면 PRESET_NAMES 에 적어 주세요.
 */
export const CHANNELS = [28, 29, 30];
export const DEFAULT_CHANNEL = CHANNELS[0];
export const PRESET_COUNT = 10;
/** 암전 (모든 채널 공통, 저장값 0) */
export const BLACKOUT = 0;

/** 움직이는 조명(사이키 등): public/lighting-presets/ch{채널}-{번호}.gif 가 있는 번호 */
const ANIMATED_PRESETS = { 28: [8], 30: [7] };

/** 채널별로 비어 있는 번호 */
const EMPTY_PRESETS = { 30: [8] };

/** 채널 색 (팀 카드 색으로도 씀) */
export const CHANNEL_COLORS = {
  28: "#E87070",
  29: "#5B8DEF",
  30: "#B07CE8",
};
const FALLBACK_COLORS = [
  "#ff3b3b",
  "#ff9f1a",
  "#ffe14d",
  "#4dff88",
  "#33d6ff",
  "#3b6bff",
  "#a34dff",
  "#ff4dc4",
  "#ffffff",
  "#555555",
];

/** PRESET_NAMES[채널][번호] = 번역 키 (lightingI18n.js) — 비워두면 "n번" */
export const PRESET_NAMES = {
  28: { 8: "psyche" },
  29: {},
  30: {},
};

/** 지금 고른 언어로 조명 이름 */
export function getPresetName(channel, preset) {
  if (preset === BLACKOUT) return tr("blackout");
  const key = PRESET_NAMES[channel]?.[preset];
  return key ? tr(key) : tr("presetN", { n: preset });
}

export function getPresetImage(channel, preset) {
  return `/lighting-presets/ch${channel}-${preset}.jpg`;
}

/** 움직이는 조명이면 GIF 주소, 아니면 null */
export function getPresetAnimation(channel, preset) {
  return ANIMATED_PRESETS[channel]?.includes(preset)
    ? `/lighting-presets/ch${channel}-${preset}.gif`
    : null;
}

export function getPresetColor(preset) {
  if (preset === BLACKOUT) return "#000000";
  return FALLBACK_COLORS[(preset - 1) % FALLBACK_COLORS.length];
}

export const channelList = CHANNELS;

/** 콘솔에 비어 있는 번호인지 (예: 30-8) */
export function isPresetEmpty(channel, preset) {
  return (EMPTY_PRESETS[channel] || []).includes(preset);
}

/** 1~10 전체 번호 (비어 있는 번호도 포함, 화면에 "비어 있음"으로 표시) */
export const allPresets = Array.from({ length: PRESET_COUNT }, (_, i) => i + 1);

/** 이 채널에서 고를 수 있는 번호 (비어 있는 번호 제외) */
export function getPresetList(channel) {
  const empty = EMPTY_PRESETS[channel] || [];
  return Array.from({ length: PRESET_COUNT }, (_, i) => i + 1).filter((n) => !empty.includes(n));
}

/** 초 → "mm:ss" (모든 시간 표기는 이 한 가지) */
export function formatTime(sec) {
  if (!Number.isFinite(sec)) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 저장된 값을 "mm:ss" 로 (못 읽으면 그대로) */
export function normalizeTime(text) {
  const sec = parseTime(text);
  return sec === null ? String(text ?? "") : formatTime(sec);
}

/** 입력 중: 숫자만 받아서 "0130" → "01:30" 모양으로 */
export function maskTime(text) {
  const d = String(text ?? "").replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, -2)}:${d.slice(-2)}`;
}

/** "m:ss" | "mm:ss" | "130"(=01:30) | "45" → 초. 실패 시 null */
export function parseTime(text) {
  const t = String(text ?? "").trim();
  if (!t) return null;
  const m = /^(\d{1,2}):([0-5]?\d)$/.exec(t);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  if (/^\d{1,4}$/.test(t)) {
    if (t.length <= 2) return Number(t);
    const min = Number(t.slice(0, -2));
    const s = Number(t.slice(-2));
    return s < 60 ? min * 60 + s : null;
  }
  return null;
}
