export const CATEGORIES = ["공연", "활동", "운영", "기타", "자료"];
export const PERFORMANCE_GROUPS = ["꿈꾸는배움터", "축제·한양문화제", "버즈온", "정기공연", "외부공연", "가두모집 공연"];
export const UNCLASSIFIED_PERFORMANCE = "분류 전 공연";

// 예전 분류는 읽을 때 호환한다. 원본 기록은 삭제하거나 합치지 않는다.
export const categoryOf = (event) => {
  if (event?.category === "동아리 활동") return "활동";
  if (event?.category === "동아리 운영") return "운영";
  return CATEGORIES.includes(event?.category) ? event.category : "기타";
};

export const groupOf = (event) => {
  const explicit = event?.eventGroup?.trim();
  const title = event?.title?.trim() || "이름 없는 기록";
  const category = categoryOf(event);
  const named = `${title} ${explicit || ""}`.replace(/\s/g, "");
  if (category === "활동") {
    if (/개강총회/.test(named)) return "개강총회";
    if (/종강총회/.test(named)) return "종강총회";
  }
  // 이번에 분리한 두 공연은 기존 '외부공연' 지정 기록도 새 묶음으로 표시한다.
  if (category === "공연") {
    if (/버즈온|buzzon/i.test(named)) return "버즈온";
    if (/정기공연/.test(named)) return "정기공연";
    if (["축제", "한양문화제", "축제·한양문화제"].includes(explicit)) return "축제·한양문화제";
  }
  if (explicit) return explicit;
  if (categoryOf(event) !== "공연") {
    // 연도·기수 접두사만 제외하고 같은 행사 이름으로 묶는다.
    return title.replace(/^(?:(?:\d{4}년?|\d+(?:\.\d+)?기)\s+)+/, "") || title;
  }
  const compact = `${title} ${(event.tags || []).join(" ")}`.replace(/\s/g, "");
  if (/버즈온|buzzon/i.test(compact)) return "버즈온";
  if (/정기공연/.test(compact)) return "정기공연";
  if (/꿈꾸는배움터|꿈터/.test(compact)) return "꿈꾸는배움터";
  if (/한양문화제/.test(compact)) return "축제·한양문화제";
  if (/가두모집/.test(compact)) return "가두모집 공연";
  if (/외부공연/.test(compact)) return "외부공연";
  if (/축제/.test(compact)) return "축제·한양문화제";
  return UNCLASSIFIED_PERFORMANCE;
};

export const generationKey = (event) => String(event.generation ?? "none");
export const generationLabel = (key) => key === "none" ? "기수 미지정" : `${key}기`;

export const catalogGroups = (events, category) => {
  const groups = new Map(category === "공연" ? PERFORMANCE_GROUPS.map((name) => [name, []]) : []);
  for (const event of events) {
    if (categoryOf(event) !== category) continue;
    const name = groupOf(event);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(event);
  }
  return [...groups].map(([name, records]) => ({ name, records }));
};

export const generationGroups = (events) => {
  const groups = new Map();
  for (const event of events) {
    const key = generationKey(event);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }
  return [...groups].sort(([a], [b]) => a === "none" ? 1 : b === "none" ? -1 : Number(a) - Number(b))
    .map(([key, records]) => ({
      key, label: generationLabel(key),
      records: [...records].sort((a, b) => (b.startDate || b.eventDate || "").localeCompare(a.startDate || a.eventDate || "")),
    }));
};

/** 기록이 아직 없을 때 카드에 보여 줄 예시 */
const CATEGORY_HINTS = {
  공연: ["꿈꾸는배움터", "축제", "버즈온"],
  활동: ["개강총회", "MT", "팝업 클래스"],
  운영: ["인수인계", "동아리방 이용", "회비"],
  기타: ["단체복", "굿즈"],
  자료: ["회칙", "양식", "정산 자료"],
};

/** 분류 카드에 보여 줄 예시: 기록이 많은 묶음부터 몇 개 (분류 전 공연은 빼고) */
export const categoryExamples = (events, category, limit = 3) => {
  const names = catalogGroups(events, category)
    .filter((group) => group.records.length && group.name !== UNCLASSIFIED_PERFORMANCE)
    .sort((a, b) => b.records.length - a.records.length)
    .slice(0, limit)
    .map((group) => group.name);
  return names.length ? names : CATEGORY_HINTS[category] ?? [];
};

const TIMELINE_CATEGORIES = ["공연", "활동"];
const MAX_EVENT_DAYS = 7;
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/**
 * 메인 하단 한 해 타임라인: 가장 최근 기수(N기 + N.5기)의 공연·활동을 행사 당일 날짜순으로.
 * 한 달 넘게 이어지는 프로그램은 '큰 행사 당일'이 아니라서 빼되, 만취 챌린지는 기간으로 넣는다.
 */
export const yearTimeline = (events) => {
  const gens = events.map((e) => Number(e.generation)).filter(Number.isFinite);
  if (!gens.length) return { base: null, months: [] };
  const base = Math.floor(Math.max(...gens));
  const items = events
    .filter((e) => {
      const g = Number(e.generation);
      if (g !== base && g !== base + 0.5) return false;
      if (!TIMELINE_CATEGORIES.includes(categoryOf(e))) return false;
      const start = e.startDate || e.eventDate;
      if (!start) return false;
      return /챌린지/.test(e.title || "") || daysBetween(start, e.endDate || start) < MAX_EVENT_DAYS;
    })
    .map((e) => ({ event: e, date: e.startDate || e.eventDate, endDate: e.endDate && e.endDate !== (e.startDate || e.eventDate) ? e.endDate : "" }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const months = new Map();
  for (const item of items) {
    const key = item.date.slice(0, 7);
    if (!months.has(key)) months.set(key, []);
    months.get(key).push(item);
  }
  return { base, months: [...months].map(([month, list]) => ({ month, items: list })) };
};
