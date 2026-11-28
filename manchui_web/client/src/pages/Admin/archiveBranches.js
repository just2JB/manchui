/**
 * 항목 갈래: 같은 기록 안에서 누구에게 낸 공지인지 (공연진 · 곡장 …).
 * 직접 정한 갈래가 먼저이고, 비어 있으면 제목에 먼저 나오는 갈래 이름으로 추론한다.
 */
export const BRANCH_SUGGESTIONS = ["공연진", "곡장", "임원진", "전체 부원", "외부"];
const INFER = ["공연진", "곡장", "임원진"];

export const inferBranch = (title) => {
  const text = String(title ?? "");
  let best = "";
  let at = Infinity;
  for (const name of INFER) {
    const i = text.indexOf(name);
    if (i >= 0 && i < at) { best = name; at = i; }
  }
  return best;
};

export const branchOf = (notice) => String(notice?.branch ?? "").trim() || inferBranch(notice?.title);

/** 기록 안에서 쓰인 갈래 + 기본 제안 (중복 없이) */
export const branchOptions = (notices = []) =>
  [...new Set([...notices.map(branchOf).filter(Boolean), ...BRANCH_SUGGESTIONS])];
