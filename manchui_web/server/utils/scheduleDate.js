/** API·캘린더용 YYYY-MM-DD 정규화 */
function normalizeScheduleDate(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().replace(/\s/g, "");
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const dotted = s.split(".").filter(Boolean);
  if (dotted.length >= 3) {
    const y = dotted[0];
    const m = String(dotted[1]).padStart(2, "0");
    const d = String(dotted[2]).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return null;
}

function isScheduleDateOnOrAfterYesterday(dateKey) {
  const normalized = normalizeScheduleDate(dateKey);
  if (!normalized) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const [y, m, d] = normalized.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  return target >= yesterday;
}

module.exports = {
  normalizeScheduleDate,
  isScheduleDateOnOrAfterYesterday,
};
