/**
 * 1회용: 14.5기 아카이브 공지 본문을 카카오톡 공지방 내보내기 원문 그대로로 바꾸기.
 * (seedArchiveNotices145.js 로 넣은 요약 본문 → 원문)
 *
 *  - 원문 파일에서 [날짜 + 시각 + 보낸 사람]으로 메시지를 골라 이어 붙인다. 문구·이모지·오타는 그대로.
 *  - '사진', '사진 N장', '동영상' 같은 첨부 표시는 뺀다. '파일: ...' 줄은 남긴다.
 *  - 동방 비밀번호와 입금 계좌번호만 가린다.
 *
 * 사용법 (server 폴더에서)
 *   node scripts/archiveNoticesVerbatim145.js "<공지방 채팅 데이터.txt 경로>"          → 확인만
 *   node scripts/archiveNoticesVerbatim145.js "<경로>" --print                         → 본문까지 출력
 *   node scripts/archiveNoticesVerbatim145.js "<경로>" --yes                           → 저장
 */
require("dotenv").config({ quiet: true });
const { applyPlan, cliOptions } = require("./lib/kakaoNotices");

const GEN = 14.5;

// ───────── 공지 ↔ 원문 메시지 ─────────
// pick: [날짜, 시각, 보낸 사람?, 같은 시각 텍스트 메시지 중 몇 번째(0부터)?]
const JB = "최지범";
const P = (day, time, sender = JB, index) => ({ day, time, sender, index });

const NIGHT_FEST_EXTRA = {
  match: "문과인의 밤 · 공대 페스티벌 추가 모집",
  date: "2026-08-30",
  title: "2026년 2학기 행사 공연진 추가 모집",
  author: JB,
  picks: [P("08-30", "오후 11:37")],
};

const PLAN = [
  {
    event: "바람막이(단체복) 수요조사",
    notices: [{ match: "바람막이 수요조사", date: "2026-07-24", title: "만취 바람막이 수요조사", author: JB, picks: [P("07-24", "오후 12:54")] }],
  },
  {
    event: "한양 문화제 (한양제 · 가을 축제)",
    notices: [
      {
        match: "한양문화제(가을축제) 공연진 모집",
        date: "2026-07-27",
        title: "2026 한양문화제 공연진 모집",
        author: JB,
        picks: [P("07-27", "오후 12:45"), P("07-27", "오후 2:45")],
      },
      {
        match: "한양문화제 공연곡 선정 · 오디션 신청 안내",
        date: "2026-07-30",
        title: "한양문화제(가을축제) 공연곡 선정 완료",
        author: JB,
        picks: [P("07-30", "오후 6:36")],
      },
    ],
  },
  {
    event: "2학기 가두모집",
    notices: [
      { match: "2학기 가두모집 공연진 모집", date: "2026-07-31", title: "2026 2학기 가두모집 공연진 모집", author: JB, picks: [P("07-31", "오후 5:54")] },
      { match: "2학기 가두모집 공연진 추가 모집", date: "2026-08-02", title: "2026 2학기 가두모집 공연진 추가 모집", author: JB, picks: [P("08-02", "오후 7:36")] },
    ],
  },
  {
    event: "문과인의 밤",
    // 8/26 공지는 원문상 공대 패스티벌만 모집한 공지라 문과인의 밤에서는 뺀다.
    remove: ["문과인의 밤 · 공대 페스티벌 공연진 모집"],
    notices: [NIGHT_FEST_EXTRA],
  },
  {
    event: "공대 페스티벌",
    notices: [
      {
        match: "문과인의 밤 · 공대 페스티벌 공연진 모집",
        date: "2026-08-26",
        title: "2026 2학기 공대 패스티벌 공연진 모집",
        author: JB,
        picks: [P("08-26", "오후 12:02")],
      },
      NIGHT_FEST_EXTRA,
    ],
  },
  {
    event: "팝업 클래스",
    notices: [
      { match: "팝업클래스 운영 안내", date: "2026-08-29", title: "팝업클래스 오픈", author: "김은우", picks: [P("08-29", "오후 1:58", "14th 김은우", 0)] },
      {
        match: "팝업클래스: 유경식 & 임하경",
        date: "2026-08-29",
        title: "팝업클래스: 유경식 & 임하경",
        author: "김은우",
        picks: [P("08-29", "오후 1:58", "14th 김은우", 1), P("08-29", "오후 2:00", "14th 김은우")],
      },
      {
        match: "팝업클래스: 모상준",
        date: "2026-09-23",
        title: "팝업클래스: 모상준",
        author: JB,
        picks: [P("09-23", "오전 11:23"), P("09-23", "오전 11:24")],
      },
    ],
  },
  {
    event: "동아리방 이용 · 회비 안내",
    notices: [
      { match: "동아리방 예약 · 이용 안내", date: "2026-09-01", title: "동아리방 사용 예약 안내", author: JB, picks: [P("09-01", "오전 10:38")] },
      {
        match: "회비 환불 안내",
        date: "2026-09-17",
        title: "만취 14.5기 공지방 공지 (동아리방 이용 · 회비 환불)",
        author: JB,
        picks: [P("09-17", "오후 1:28")],
      },
      {
        match: "동아리방 반입 금지 물품 · 개인 물품 수거",
        date: "2026-10-23",
        title: "[필독] 동아리방 반입 금지 물품 안내",
        author: "공지민",
        picks: [P("10-23", "오후 5:56", "14th 공지민")],
      },
      { date: "2026-10-23", title: "동아리방 개인 물품 수거 안내", author: "공지민", picks: [P("10-23", "오후 5:57", "14th 공지민")] },
    ],
  },
  {
    event: "2학기 개강총회",
    notices: [
      { match: "2학기 개강총회 안내 · 참여 수요조사", date: "2026-09-09", title: "만취 14기 개강총회 수요조사", author: JB, picks: [P("09-09", "오후 5:01")] },
      { date: "2026-09-11", title: "개강총회 투표 마감 안내", author: JB, picks: [P("09-11", "오후 1:19")] },
      {
        match: "개강총회 당일 안내",
        date: "2026-09-15",
        title: "개강총회 및 뒤풀이 안내",
        titles: { "09-15 오후 8:59": "2차 이동 안내" },
        author: JB,
        picks: [P("09-15", "오후 6:03"), P("09-15", "오후 6:15"), P("09-15", "오후 8:59")],
      },
      { match: "개강총회 자료 공유", date: "2026-09-16", title: "개강총회 자료 공유", author: JB, picks: [P("09-16", "오전 9:37"), P("09-16", "오전 9:38")] },
    ],
  },
  {
    event: "2학기 만취 챌린지",
    notices: [
      { match: "만취 챌린지 안내", date: "2026-09-21", title: "2026-2 만취 14.5기 챌린지 공지", author: JB, picks: [P("09-21", "오후 12:18")] },
      { match: "만취 챌린지 기간 연장", date: "2026-10-26", title: "만취 챌린지 기간 연장 공지", author: JB, picks: [P("10-26", "오전 11:59")] },
      { match: "만취 챌린지 추첨 안내", date: "2026-11-18", title: "만취 챌린지 당첨자 발표 안내", author: JB, picks: [P("11-18", "오전 10:51")] },
      { match: "만취 챌린지 당첨자 발표", date: "2026-11-19", title: "만취 챌린지 상품 당첨자 정리", author: JB, picks: [P("11-19", "오후 6:06")] },
    ],
  },
  {
    event: "BUZZ ON: FACE OFF",
    notices: [
      {
        match: "BUZZ ON : FACE OFF 안내 · 2라운드 모집",
        date: "2026-10-11",
        title: "BUZZ ON : FACE OFF 참가자, 공연진 모집",
        author: JB,
        picks: [P("10-11", "오후 8:10"), P("10-11", "오후 8:11")],
      },
      {
        match: "BUZZ ON 2라운드 추가 모집 · 3라운드 모집",
        date: "2026-10-13",
        title: "BUZZ ON : FACE OFF 3라운드 팀 소개 · 2라운드 추가 모집",
        titles: { "10-13 오후 12:16": "BUZZ ON 2·3라운드 참여 안내" },
        author: JB,
        picks: [P("10-13", "오전 11:31"), P("10-13", "오전 11:32"), P("10-13", "오전 11:33"), P("10-13", "오후 12:16")],
      },
      { match: "BUZZ ON 행사 시간 · 뒤풀이 수요조사", date: "2026-11-10", title: "버즈온 뒷풀이 수요조사", author: JB, picks: [P("11-10", "오후 3:33")] },
    ],
  },
  {
    event: "정기공연",
    notices: [
      { match: "정기공연 공연진 · 곡장 모집", date: "2026-10-15", title: "2026 만취 정기 공연 · 곡장 모집", author: JB, picks: [P("10-15", "오후 2:16")] },
    ],
  },
];

applyPlan(
  PLAN.map((step) => ({ ...step, generation: GEN })),
  cliOptions(),
).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
