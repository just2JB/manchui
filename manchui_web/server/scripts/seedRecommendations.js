/**
 * 곡 추천 목 데이터 60건 삽입
 * 실행: node scripts/seedRecommendations.js
 * 기존 목 데이터를 지우고 새로 넣으려면: node scripts/seedRecommendations.js --reset
 */
require("dotenv").config();
const mongoose = require("mongoose");
const SongRecommendation = require("../models/SongRecommendation");
const User = require("../models/User");

const MOCK_RECOMMENDATIONS = [
  {
    title: "NewJeans — Super Shy",
    videoUrl: "https://www.youtube.com/watch?v=ArmDp-zijig",
    body: "수업 전 워밍업용으로 가볍게 틀기 좋아요. 포인트 안무가 깔끔합니다.",
    tags: ["k-pop", "여돌", "코레오"],
    likeCount: 12,
    scrapCount: 5,
  },
  {
    title: "Stray Kids — S-Class",
    videoUrl: "https://www.youtube.com/watch?v=JsOOis4PM2k",
    body: "힙합 베이스에 파워 넘치는 동작. 중급 이상 추천.",
    tags: ["k-pop", "남돌", "힙합"],
    likeCount: 18,
    scrapCount: 7,
  },
  {
    title: "LE SSERAFIM — UNFORGIVEN",
    videoUrl: "https://www.youtube.com/watch?v=UCLZP4dLdhU",
    body: "그루브 살리기 연습할 때 자주 씁니다.",
    tags: ["k-pop", "여돌", "코레오"],
    likeCount: 9,
    scrapCount: 3,
  },
  {
    title: "RIIZE — Get A Guitar",
    videoUrl: "https://www.youtube.com/watch?v=19aX9W45qWY",
    body: "기타 사운드에 맞춰 박수·스텝 타이밍 잡기 좋아요.",
    tags: ["k-pop", "남돌"],
    likeCount: 6,
    scrapCount: 2,
  },
  {
    title: "aespa — Spicy",
    videoUrl: "https://www.youtube.com/watch?v=Os_heh8vPfs",
    body: "여름 공연 모음곡 후보로 추천합니다.",
    tags: ["k-pop", "여돌", "챌린지"],
    likeCount: 14,
    scrapCount: 4,
  },
  {
    title: "SEVENTEEN — 손오공",
    videoUrl: "https://www.youtube.com/watch?v=ThI0pBAbZ8Y",
    body: "대형 팀 안무 레퍼런스로 보기 좋습니다.",
    tags: ["k-pop", "남돌", "코레오"],
    likeCount: 22,
    scrapCount: 9,
  },
  {
    title: "ITZY — CAKE",
    videoUrl: "https://www.youtube.com/watch?v=92gHq1s7q6Y",
    body: "발목·무릎 사용이 많아 스트레칭 후 추천.",
    tags: ["k-pop", "여돌", "힙합"],
    likeCount: 11,
    scrapCount: 6,
  },
  {
    title: "BTS — IDOL",
    videoUrl: "https://www.youtube.com/watch?v=3YqPKLZF_WU",
    body: "전통 요소 섞인 안무, 공연 구성 아이디어용.",
    tags: ["k-pop", "남돌", "코레오"],
    likeCount: 31,
    scrapCount: 12,
  },
  {
    title: "IVE — I AM",
    videoUrl: "https://www.youtube.com/watch?v=6f1c7wqQq_c",
    body: "라인 정리 연습에 좋은 곡입니다.",
    tags: ["k-pop", "여돌"],
    likeCount: 8,
    scrapCount: 1,
  },
  {
    title: "NCT U — Baggy Jeans",
    videoUrl: "https://www.youtube.com/watch?v=gk0YdJo6fVc",
    body: "힙합 스타일 릴스 챌린지 참고용.",
    tags: ["k-pop", "남돌", "힙합", "챌린지"],
    likeCount: 16,
    scrapCount: 8,
  },
  {
    title: "인스타 릴스 — 힙합 기본 바운스",
    videoUrl: "https://www.instagram.com/reel/Cxample01/",
    body: "기초 바운스 느낌 잡을 때 참고한 릴스입니다.",
    tags: ["힙합", "챌린지"],
    likeCount: 4,
    scrapCount: 2,
  },
  {
    title: "인스타 릴스 — 코레오 클린 버전",
    videoUrl: "https://www.instagram.com/reel/Cxample02/",
    body: "동작 크기 줄인 버전이라 초보자도 따라 하기 쉬워요.",
    tags: ["코레오", "챌린지"],
    likeCount: 7,
    scrapCount: 3,
  },
  {
    title: "(G)I-DLE — Queencard",
    videoUrl: "https://www.youtube.com/watch?v=7HDeem-JaSY",
    body: "박수·포즈 전환이 많아 팀 연습용으로 좋습니다.",
    tags: ["k-pop", "여돌", "코레오"],
    likeCount: 19,
    scrapCount: 5,
  },
  {
    title: "TOMORROW X TOGETHER — Chasing That Feeling",
    videoUrl: "https://www.youtube.com/watch?v=4QhQ3j8RexM",
    body: "런닝·점프 동작이 많아 체력 붙이기 좋아요.",
    tags: ["k-pop", "남돌"],
    likeCount: 10,
    scrapCount: 4,
  },
  {
    title: "Red Velvet — Chill Kill",
    videoUrl: "https://www.youtube.com/watch?v=YYR6hlL8NqM",
    body: "몽환적인 무드의 안무, 감정 표현 연습용.",
    tags: ["k-pop", "여돌", "코레오"],
    likeCount: 5,
    scrapCount: 1,
  },
  {
    title: "Zico — Any Song",
    videoUrl: "https://www.youtube.com/watch?v=r7qovpFAGrQ",
    body: "누구나 따라 할 수 있는 챌린지 곡.",
    tags: ["힙합", "챌린지"],
    likeCount: 25,
    scrapCount: 11,
  },
  {
    title: "NewJeans — ETA",
    videoUrl: "https://www.youtube.com/watch?v=jOTfBlKSQYY",
    body: "그루브 위주라 자유 연습 때 틀기 좋습니다.",
    tags: ["k-pop", "여돌", "힙합"],
    likeCount: 13,
    scrapCount: 6,
  },
  {
    title: "ENHYPEN — Bite Me",
    videoUrl: "https://www.youtube.com/watch?v=1y7uCZLxMn0",
    body: "날카로운 동작 연습에 추천합니다.",
    tags: ["k-pop", "남돌", "코레오"],
    likeCount: 15,
    scrapCount: 7,
  },
  {
    title: "인스타 릴스 — 여돌 포인트 모음",
    videoUrl: "https://www.instagram.com/reel/Cxample03/",
    body: "최근 인기 포인트만 모아둔 릴스 링크입니다.",
    tags: ["여돌", "챌린지", "k-pop"],
    likeCount: 3,
    scrapCount: 0,
  },
  {
    title: "BABYMONSTER — SHEESH",
    videoUrl: "https://www.youtube.com/watch?v=2wA_bLRGNxs",
    body: "에너지 높은 곡, 마무리 퍼포먼스 후보.",
    tags: ["k-pop", "여돌", "힙합", "코레오"],
    likeCount: 20,
    scrapCount: 10,
  },
  {
    title: "BLACKPINK — Pink Venom",
    videoUrl: "https://www.youtube.com/watch?v=gQlMMD8aqMs",
    body: "퍼포먼스 오프닝 곡으로 자주 쓰입니다.",
    tags: ["k-pop", "여돌", "코레오"],
    likeCount: 28,
    scrapCount: 13,
  },
  {
    title: "TWICE — SET ME FREE",
    videoUrl: "https://www.youtube.com/watch?v=cXCBiF67jLM",
    body: "리듬감 있는 스텝 연습용.",
    tags: ["k-pop", "여돌"],
    likeCount: 17,
    scrapCount: 6,
  },
  {
    title: "ATEEZ — Bouncy",
    videoUrl: "https://www.youtube.com/watch?v=7aMOurgDB-o",
    body: "바운스·킥 동작 타이밍 맞추기 좋아요.",
    tags: ["k-pop", "남돌", "힙합"],
    likeCount: 21,
    scrapCount: 9,
  },
  {
    title: "STAYC — Teddy Bear",
    videoUrl: "https://www.youtube.com/watch?v=5rXPrfnU3G0",
    body: "귀여운 무드의 안무, 신입 환영 공연용.",
    tags: ["k-pop", "여돌", "챌린지"],
    likeCount: 9,
    scrapCount: 3,
  },
  {
    title: "BOYNEXTDOOR — One and Only",
    videoUrl: "https://www.youtube.com/watch?v=2wVquhJWSvY",
    body: "가사 따라 부르며 동작 외우기 쉬워요.",
    tags: ["k-pop", "남돌"],
    likeCount: 8,
    scrapCount: 2,
  },
  {
    title: "ILLIT — Magnetic",
    videoUrl: "https://www.youtube.com/watch?v=zlZDTvJ4n8s",
    body: "챌린지로 유행했던 포인트 안무 모음.",
    tags: ["k-pop", "여돌", "챌린지"],
    likeCount: 24,
    scrapCount: 14,
  },
  {
    title: "TWS — plot twist",
    videoUrl: "https://www.youtube.com/watch?v=9mR3d7Y5q0k",
    body: "밝은 분위기 연습 때 틀기 좋습니다.",
    tags: ["k-pop", "남돌", "코레오"],
    likeCount: 11,
    scrapCount: 4,
  },
  {
    title: "KISS OF LIFE — Sticky",
    videoUrl: "https://www.youtube.com/watch?v=1y7uCZLxMn0",
    body: "그루브·몸 풀기용으로 추천.",
    tags: ["k-pop", "여돌", "힙합"],
    likeCount: 7,
    scrapCount: 2,
  },
  {
    title: "인스타 릴스 — 남돌 킬링 파트",
    videoUrl: "https://www.instagram.com/reel/Cxample04/",
    body: "남돌 곡 킬링 파트만 모은 릴스.",
    tags: ["남돌", "k-pop", "챌린지"],
    likeCount: 5,
    scrapCount: 1,
  },
  {
    title: "P1Harmony — SAD SONG",
    videoUrl: "https://www.youtube.com/watch?v=5iSlCZat_YA",
    body: "슬로우 템포 안무 감정선 연습.",
    tags: ["k-pop", "남돌", "코레오"],
    likeCount: 6,
    scrapCount: 2,
  },
  {
    title: "fromis_9 — Supersonic",
    videoUrl: "https://www.youtube.com/watch?v=QxJjJNzC2XA",
    body: "빠른 비트에 맞춘 스텝 정리용.",
    tags: ["k-pop", "여돌"],
    likeCount: 10,
    scrapCount: 3,
  },
  {
    title: "VIVIZ — MANIAC",
    videoUrl: "https://www.youtube.com/watch?v=3qWKu3aZ1RY",
    body: "포인트 동작이 뚜렷해서 초보 팀에도 좋아요.",
    tags: ["k-pop", "여돌", "코레오"],
    likeCount: 12,
    scrapCount: 5,
  },
  {
    title: "CRAVITY — Groovy",
    videoUrl: "https://www.youtube.com/watch?v=6i9zHHDsyuE",
    body: "그루브 위주 힙합 스타일 참고.",
    tags: ["k-pop", "남돌", "힙합"],
    likeCount: 4,
    scrapCount: 1,
  },
  {
    title: "인스타 릴스 — 코레오 미러 모드",
    videoUrl: "https://www.instagram.com/reel/Cxample05/",
    body: "거울 모드로 따라 하기 좋게 편집된 릴스.",
    tags: ["코레오", "챌린지"],
    likeCount: 8,
    scrapCount: 4,
  },
  {
    title: "NMIXX — DASH",
    videoUrl: "https://www.youtube.com/watch?v=5cF6w8t6l8Y",
    body: "템포 변화가 많아 응용 연습용.",
    tags: ["k-pop", "여돌", "코레오"],
    likeCount: 14,
    scrapCount: 6,
  },
  {
    title: "THE BOYZ — MAVERICK",
    videoUrl: "https://www.youtube.com/watch?v=7aMOurgDB-o",
    body: "파워풀한 팀 안무 레퍼런스.",
    tags: ["k-pop", "남돌", "코레오"],
    likeCount: 16,
    scrapCount: 7,
  },
  {
    title: "MAMAMOO — HIP",
    videoUrl: "https://www.youtube.com/watch?v=KhTeiaCHzoA",
    body: "힙한 무드·카리스마 연습에 추천.",
    tags: ["k-pop", "여돌", "힙합"],
    likeCount: 23,
    scrapCount: 10,
  },
  {
    title: "WOODZ — Drowning",
    videoUrl: "https://www.youtube.com/watch?v=r7qovpFAGrQ",
    body: "솔로 안무 참고용 링크.",
    tags: ["코레오", "힙합"],
    likeCount: 9,
    scrapCount: 3,
  },
  {
    title: "Kep1er — Galileo",
    videoUrl: "https://www.youtube.com/watch?v=5rXPrfnU3G0",
    body: "밝은 에너지, 중간 템포 연습곡.",
    tags: ["k-pop", "여돌"],
    likeCount: 7,
    scrapCount: 2,
  },
  {
    title: "ZEROBASEONE — In Bloom",
    videoUrl: "https://www.youtube.com/watch?v=2wVquhJWSvY",
    body: "데뷔곡 안무 정리 참고.",
    tags: ["k-pop", "남돌", "코레오"],
    likeCount: 13,
    scrapCount: 5,
  },
  {
    title: "인스타 릴스 — 힙합 프리스타일 베이스",
    videoUrl: "https://www.instagram.com/reel/Cxample06/",
    body: "프리스타일 전 기본 스텝 익히기.",
    tags: ["힙합", "챌린지"],
    likeCount: 6,
    scrapCount: 2,
  },
  {
    title: "SUNMI — Gashina",
    videoUrl: "https://www.youtube.com/watch?v=urA0waG7aT4",
    body: "클래식 포인트 안무, 기본기 연습.",
    tags: ["k-pop", "여돌", "코레오"],
    likeCount: 27,
    scrapCount: 11,
  },
  {
    title: "EXO — Love Shot",
    videoUrl: "https://www.youtube.com/watch?v=pSudE0A0k9Y",
    body: "무대 매너·끝포즈 연습용.",
    tags: ["k-pop", "남돌", "코레오"],
    likeCount: 30,
    scrapCount: 15,
  },
  {
    title: "SHINee — View",
    videoUrl: "https://www.youtube.com/watch?v=UF53cptEE5k",
    body: "부드러운 동선 연습에 좋습니다.",
    tags: ["k-pop", "남돌"],
    likeCount: 18,
    scrapCount: 8,
  },
  {
    title: "Apink — 덤더럼",
    videoUrl: "https://www.youtube.com/watch?v=5rXPrfnU3G0",
    body: "귀여운 컨셉 공연 후보.",
    tags: ["k-pop", "여돌", "챌린지"],
    likeCount: 5,
    scrapCount: 1,
  },
  {
    title: "LOONA — Why Not?",
    videoUrl: "https://www.youtube.com/watch?v=6i9zHHDsyuE",
    body: "템포 빠른 안무 체력 테스트용.",
    tags: ["k-pop", "여돌", "코레오"],
    likeCount: 11,
    scrapCount: 4,
  },
  {
    title: "TREASURE — DARARI",
    videoUrl: "https://www.youtube.com/watch?v=5iSlCZat_YA",
    body: "가볍게 따라 하기 좋은 챌린지 곡.",
    tags: ["k-pop", "남돌", "챌린지"],
    likeCount: 19,
    scrapCount: 7,
  },
  {
    title: "인스타 릴스 — k-pop 포인트 30초",
    videoUrl: "https://www.instagram.com/reel/Cxample07/",
    body: "짧게 끊어서 연습하기 좋은 편집본.",
    tags: ["k-pop", "챌린지", "코레오"],
    likeCount: 4,
    scrapCount: 0,
  },
  {
    title: "Dreamcatcher — MAISON",
    videoUrl: "https://www.youtube.com/watch?v=3qWKu3aZ1RY",
    body: "강한 컨셉·퍼포먼스 연습용.",
    tags: ["k-pop", "여돌", "코레오"],
    likeCount: 8,
    scrapCount: 3,
  },
  {
    title: "MONSTA X — Rush Hour",
    videoUrl: "https://www.youtube.com/watch?v=7aMOurgDB-o",
    body: "힙합 그루브·스텝 조합 참고.",
    tags: ["k-pop", "남돌", "힙합"],
    likeCount: 12,
    scrapCount: 5,
  },
  {
    title: "OH MY GIRL — Dolphin",
    videoUrl: "https://www.youtube.com/watch?v=5rXPrfnU3G0",
    body: "밝은 분위기 워밍업 곡.",
    tags: ["k-pop", "여돌"],
    likeCount: 6,
    scrapCount: 2,
  },
  {
    title: "iKON — KILLING ME",
    videoUrl: "https://www.youtube.com/watch?v=5iSlCZat_YA",
    body: "힙합 바운스 기본기 연습.",
    tags: ["k-pop", "남돌", "힙합"],
    likeCount: 15,
    scrapCount: 6,
  },
  {
    title: "Weeekly — After School",
    videoUrl: "https://www.youtube.com/watch?v=5rXPrfnU3G0",
    body: "청량한 안무, 여름 공연용.",
    tags: ["k-pop", "여돌", "챌린지"],
    likeCount: 9,
    scrapCount: 3,
  },
  {
    title: "인스타 릴스 — 여돌 챌린지 모음",
    videoUrl: "https://www.instagram.com/reel/Cxample08/",
    body: "최근 여돌 챌린지만 모아둔 링크.",
    tags: ["여돌", "챌린지", "k-pop"],
    likeCount: 10,
    scrapCount: 4,
  },
  {
    title: "PENTAGON — Shine",
    videoUrl: "https://www.youtube.com/watch?v=6i9zHHDsyuE",
    body: "댄스 중독 포인트, 단체 연습용.",
    tags: ["k-pop", "남돌", "코레오"],
    likeCount: 22,
    scrapCount: 9,
  },
  {
    title: "MOMOLAND — BAAM",
    videoUrl: "https://www.youtube.com/watch?v=5rXPrfnU3G0",
    body: "쉬운 포인트로 분위기 띄우기 좋아요.",
    tags: ["k-pop", "여돌", "챌린지"],
    likeCount: 14,
    scrapCount: 5,
  },
  {
    title: "SF9 — Trauma",
    videoUrl: "https://www.youtube.com/watch?v=5iSlCZat_YA",
    body: "날카로운 동작·라인 연습.",
    tags: ["k-pop", "남돌", "코레오"],
    likeCount: 7,
    scrapCount: 2,
  },
  {
    title: "Cherry Bullet — Love So Sweet",
    videoUrl: "https://www.youtube.com/watch?v=5rXPrfnU3G0",
    body: "귀여운 안무 초보 팀 추천.",
    tags: ["k-pop", "여돌"],
    likeCount: 3,
    scrapCount: 0,
  },
  {
    title: "VERIVERY — Thunder",
    videoUrl: "https://www.youtube.com/watch?v=6i9zHHDsyuE",
    body: "파워·스피드 연습용.",
    tags: ["k-pop", "남돌", "힙합"],
    likeCount: 8,
    scrapCount: 3,
  },
  {
    title: "인스타 릴스 — 팀 안무 클린",
    videoUrl: "https://www.instagram.com/reel/Cxample09/",
    body: "5인 이상 팀 안무 클린 버전.",
    tags: ["코레오", "챌린지"],
    likeCount: 5,
    scrapCount: 2,
  },
];

async function main() {
  const reset = process.argv.includes("--reset");
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI가 설정되어 있지 않습니다.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("MongoDB 연결됨");

  if (reset) {
    const deleted = await SongRecommendation.deleteMany({});
    console.log(`기존 추천 ${deleted.deletedCount}건 삭제`);
  }

  const existing = await SongRecommendation.countDocuments();
  if (existing > 0 && !reset) {
    console.log(
      `이미 추천 ${existing}건이 있습니다. 덮어쓰려면 --reset 옵션을 사용하세요.`,
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  const author = await User.findOne().select("_id").lean();
  const authorId = author?._id ?? null;
  if (authorId) {
    console.log(`작성자: ${authorId}`);
  } else {
    console.log("작성자 없음 — authorId null로 삽입");
  }

  const baseDate = Date.now();
  const docs = MOCK_RECOMMENDATIONS.map((item, i) => ({
    ...item,
    authorId,
    thumbnailUrl: null,
    createdAt: new Date(baseDate - i * 3600_000 * 6),
    updatedAt: new Date(baseDate - i * 3600_000 * 6),
  }));

  const inserted = await SongRecommendation.insertMany(docs);
  console.log(`곡 추천 목 데이터 ${inserted.length}건 삽입 완료`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
