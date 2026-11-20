/**
 * 1회용: 14 · 14.5기 아카이브 행사에 카테고리 넣기 (공연 · 동아리 활동 · 동아리 운영 · 기타)
 *
 *   node scripts/archiveSetCategory14.js        → 확인만
 *   node scripts/archiveSetCategory14.js --yes  → 저장
 */
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");

const confirmed = process.argv.includes("--yes");

/** 행사 이름 → 카테고리 (목록에 없으면 기타) */
const CATEGORY_BY_TITLE = {
  // 공연
  "문과대 꿈꾸는배움터 (꿈터) · 공x소": "공연",
  "외부공연 몬스터 (만취×필소굿)": "공연",
  "라이언스 칼리지 신입생 OT 무대": "공연",
  "봄 축제": "공연",
  "1학기 버즈온": "공연",
  "소융 라칼 행사 공연": "공연",
  "국제교육원 여름학기 말하기 대회 공연": "공연",
  "한양 문화제 (한양제 · 가을 축제)": "공연",
  "문과인의 밤": "공연",
  "공페": "공연",
  "안산유니온": "공연",
  "2학기 버즈온": "공연",
  "정기공연": "공연",
  "겨울밤의 콘서트 공연": "공연",
  "e스포츠 행사 공연": "공연",
  // 동아리 활동
  "1학기 가두모집": "동아리 활동",
  "2학기 가두모집": "동아리 활동",
  "1학기 개강총회": "동아리 활동",
  "2학기 개강총회": "동아리 활동",
  "종강총회": "동아리 활동",
  "만취 챌린지": "동아리 활동",
  "친해지길 바라": "동아리 활동",
  "팝업 클래스": "동아리 활동",
  MT: "동아리 활동",
  "올랭말랭 촬영": "동아리 활동",
  // 동아리 운영
  "14기 임원진 시작 · 인수인계": "동아리 운영",
  "14기 운영 · 동아리 행정": "동아리 운영",
  "다음 임원진 준비 (14 → 14.5기)": "동아리 운영",
  "14.5기 임원진 시작 · 인수인계": "동아리 운영",
  "2학기 동아리 재등록 · 대표자 수련회": "동아리 운영",
  "14.5기 운영 · 정기 회의": "동아리 운영",
  // 기타
  "바람막이(단체복) 수요조사": "기타",
};

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI 가 설정되지 않았습니다 (.env 확인).");
  await mongoose.connect(process.env.MONGO_URI);
  const col = mongoose.connection.db.collection("archiveevents");
  const docs = await col.find({}, { projection: { title: 1, category: 1 } }).toArray();
  const counts = {};
  for (const d of docs) {
    const category = CATEGORY_BY_TITLE[d.title] ?? d.category ?? "기타";
    counts[category] = (counts[category] ?? 0) + 1;
    if (confirmed && d.category !== category) {
      await col.updateOne({ _id: d._id }, { $set: { category } });
    }
  }
  console.log(`행사 ${docs.length}개 →`, JSON.stringify(counts), confirmed ? "(저장함)" : "(확인만, 저장하려면 --yes)");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
