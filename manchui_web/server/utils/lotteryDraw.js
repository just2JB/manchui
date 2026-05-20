/**
 * 참여 횟수 → 추첨 가중치 (1회:1, 2회:2, 3회 이상:3)
 */
function participationWeight(entries) {
  const n = Math.max(1, Math.floor(Number(entries) || 1));
  if (n <= 1) return 1;
  if (n === 2) return 2;
  return 3;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWeightedIndex(pool) {
  const weights = pool.map((p) => participationWeight(p.entries));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return 0;
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return pool.length - 1;
}

/**
 * @param {{ label: string, winnerCount: number }[]} prizes
 * @param {{ name: string, entries: number }[]} participants
 * @returns {{ name: string, entries: number, prize: string }[]}
 */
function runLotteryDraw(prizes, participants) {
  const totalWinners = prizes.reduce(
    (sum, p) => sum + Math.max(0, Math.floor(Number(p.winnerCount) || 0)),
    0,
  );
  if (totalWinners <= 0) {
    throw new Error("상품 당첨 인원이 없습니다.");
  }
  if (!participants.length) {
    throw new Error("참여자가 없습니다.");
  }
  if (participants.length < totalWinners) {
    throw new Error(
      `참여자(${participants.length}명)가 당첨 인원(${totalWinners}명)보다 적습니다.`,
    );
  }

  const pool = participants.map((p) => ({
    name: String(p.name || "").trim(),
    entries: Math.max(1, Math.floor(Number(p.entries) || 1)),
  }));

  const winners = [];
  for (let i = 0; i < totalWinners; i++) {
    const idx = pickWeightedIndex(pool);
    const picked = pool[idx];
    winners.push({ ...picked });
    pool.splice(idx, 1);
  }

  const prizeSlots = [];
  for (const prize of prizes) {
    const count = Math.max(0, Math.floor(Number(prize.winnerCount) || 0));
    const label = String(prize.label || "").trim();
    for (let i = 0; i < count; i++) {
      prizeSlots.push(label);
    }
  }
  const shuffledPrizes = shuffle(prizeSlots);

  return winners.map((w, i) => ({
    name: w.name,
    entries: w.entries,
    prize: shuffledPrizes[i],
  }));
}

/** 당첨 목록 이름 가나다순 */
function sortResultsByNameKo(results) {
  return [...results].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), "ko"),
  );
}

module.exports = { participationWeight, runLotteryDraw, sortResultsByNameKo };
