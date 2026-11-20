/**
 * 1회용: 14기 공지방(2026-01 ~ 2026-07) 카톡 내보내기에서 임원진이 쓴 만취 행사 공지만 원문 그대로 아카이브에 넣기.
 * 총학생회·총동아리연합회 등 외부 전달 공지, '14기 공지방입니다!' 같은 안내, 투표 알림은 넣지 않는다.
 * 7월 초 14.5기 관련 공지(외부공연 모집·올랭말랭·재가입·한양문화제 안내)는 14.5기 행사에 넣는다.
 *
 * 사용법 (server 폴더에서)
 *   node scripts/archiveNoticesVerbatim14.js "<14기 공지방 채팅 데이터.txt 경로>"          → 확인만
 *   node scripts/archiveNoticesVerbatim14.js "<경로>" --print                              → 본문까지 출력
 *   node scripts/archiveNoticesVerbatim14.js "<경로>" --yes                                → 저장
 */
require("dotenv").config({ quiet: true });
const { applyPlan, cliOptions, P } = require("./lib/kakaoNotices");

const JB = "최지범";
const YKS = "14 유경식 형";
const PSH = "14 박수현";
const LYJ = "14 이영준";
const KMS = "14 김민서";

const PLAN = [
  {
    generation: 14,
    event: "동아리방 이용 · 회비 안내",
    create: {
      category: "동아리 운영",
      startDate: "2026-01-05",
      endDate: "2026-05-07",
      tags: ["동아리방", "회비"],
      summary: "14기 공지방 대표 공지(동방 이용·회비 환불), 동방 개인 물품 정리(3/14, 5/4), 축제 준비 동방 사용(4/29).",
    },
    notices: [
      {
        date: "2026-01-05",
        title: "만취 14기 공지방 공지 (동아리방 이용 · 회비 환불)",
        author: "최지범",
        // 원본 내보내기에서도 '공식적인 두 ' 에서 잘려 있음.
        picks: [P("01-05", "오후 6:36", JB)],
      },
      { date: "2026-03-14", title: "동아리방 개인 물품 정리 안내", author: "최지범", picks: [P("03-14", "오후 6:22", JB)] },
      { date: "2026-04-29", title: "동아리방 연습 공지", author: "최지범", picks: [P("04-29", "오후 1:04", JB)] },
      {
        date: "2026-05-04",
        title: "동아리 방 개인 물품 안내",
        titles: { "05-07 오후 4:25": "개인 물품 · 공결신청서 수거 마감 안내" },
        author: "유경식",
        picks: [P("05-04", "오후 11:13", YKS), P("05-07", "오후 4:25", YKS)],
      },
    ],
  },
  {
    generation: 14,
    event: "꿈꾸는 배움터 동아리 공연",
    notices: [{ date: "2026-01-05", title: "2026 꿈터 공연진 모집", author: "최지범", picks: [P("01-05", "오후 6:59", JB)] }],
  },
  {
    generation: 14,
    event: "1학기 가두모집",
    notices: [
      {
        match: "가두모집 공연진 모집",
        date: "2026-02-19",
        title: "가두모집 버스킹 공연진 모집",
        author: "유경식",
        picks: [P("02-19", "오후 8:36", YKS)],
      },
    ],
  },
  {
    generation: 14,
    event: "1학기 개강총회",
    notices: [{ date: "2026-03-11", title: "만취 14기 개강총회 수요조사", author: "최지범", picks: [P("03-11", "오후 5:06", JB)] }],
  },
  {
    generation: 14,
    event: "봄 축제",
    notices: [
      {
        match: "곡 선정 공지 / 오디션 일정 공지",
        date: "2026-03-18",
        title: "봄 축제 공연진 모집 및 오디션 안내",
        author: "최지범",
        picks: [P("03-18", "오전 7:01", JB)],
      },
      {
        date: "2026-03-18",
        title: "2026 봄축제 공연진 모집 (곡장 · 곡 소개 · 오디션 지원 방법)",
        author: "최지범",
        picks: [P("03-18", "오전 10:00", JB), P("03-18", "오전 10:46", JB)],
      },
      {
        date: "2026-03-18",
        title: "봄축제 오디션 지원 추가 공지",
        author: "이영준",
        picks: [P("03-18", "오후 4:19", LYJ), P("03-18", "오후 10:26", KMS)],
      },
      {
        match: "오디션 결과 발표 / 연습 시작",
        date: "2026-03-25",
        title: "2026 봄축제 오디션 결과 발표",
        author: "최지범",
        picks: [P("03-25", "오전 9:12", JB)],
      },
      { date: "2026-03-25", title: "공연진 결원 및 추가 합격 공지", author: "최지범", picks: [P("03-25", "오전 11:34", JB)] },
    ],
  },
  {
    generation: 14,
    event: "만취 챌린지",
    notices: [
      {
        date: "2026-03-20",
        title: "2026-1 만취 챌린지",
        author: "박수현",
        picks: [P("03-20", "오후 7:12", PSH), P("03-20", "오후 7:13", PSH)],
      },
      {
        date: "2026-05-20",
        title: "만취 챌린지 추첨 공지",
        titles: { "05-20 오후 5:47": "추첨 방식 변경 안내" },
        author: "최지범",
        picks: [P("05-20", "오후 3:03", JB), P("05-20", "오후 5:47", JB)],
      },
      { date: "2026-05-20", title: "만취 챌린지 상품 당첨자 정리", author: "최지범", picks: [P("05-20", "오후 6:03", JB)] },
    ],
  },
  {
    generation: 14,
    event: "친해지길 바라",
    notices: [{ date: "2026-03-20", title: "친해지길 바라만챌", author: "박수현", picks: [P("03-20", "오후 7:17", PSH)] }],
  },
  {
    generation: 14,
    event: "팝업 클래스",
    notices: [
      { date: "2026-03-23", title: "팝업클래스 오픈", author: "유경식", picks: [P("03-23", "오후 6:30", YKS, 0)] },
      {
        date: "2026-03-23",
        title: "기본기 팝업 클래스 (임하경)",
        author: "유경식",
        picks: [P("03-23", "오후 6:30", YKS, 1), P("03-23", "오후 6:32", YKS)],
      },
      {
        date: "2026-03-30",
        title: "락킹 베이직 팝업 클래스 (이영준)",
        author: "최지범",
        picks: [P("03-30", "오후 3:43", JB), P("03-30", "오후 3:44", JB)],
      },
      {
        date: "2026-04-20",
        title: "Chops (제베팝) 팝업 클래스 (공지민)",
        author: "유경식",
        picks: [P("04-20", "오전 10:55", YKS), P("04-20", "오전 10:56", YKS)],
      },
      { date: "2026-04-27", title: "패션 팝업클래스 (최지범)", author: "최지범", picks: [P("04-27", "오후 2:15", JB)] },
      {
        date: "2026-05-12",
        title: "힙합 팝업 클래스 (김화랑)",
        author: "최지범",
        picks: [P("05-12", "오후 8:58", JB), P("05-12", "오후 8:59", JB)],
      },
    ],
  },
  {
    generation: 14,
    event: "BUZZ ON: sophomore",
    notices: [
      {
        date: "2026-04-01",
        title: "버즈온(만취 X 필소굿) 콜라보 공연 수요조사",
        author: "최지범",
        picks: [P("04-01", "오후 7:42", JB)],
      },
      {
        match: "버즈온 라운드 참여자 조사",
        date: "2026-04-20",
        title: "BUZZ ON : SOPHOMORE 참가자, 공연진 모집",
        author: "최지범",
        picks: [
          P("04-20", "오후 9:04", JB),
          P("04-20", "오후 9:05", JB),
          P("04-20", "오후 9:11", JB),
          P("04-20", "오후 9:12", JB),
        ],
      },
    ],
  },
  {
    generation: 14,
    event: "MT",
    notices: [
      {
        date: "2026-04-11",
        title: "2026-1 만취 MT 수요조사",
        author: "유경식",
        picks: [P("04-11", "오후 3:39", YKS), P("04-11", "오후 3:48", YKS)],
      },
      { date: "2026-04-18", title: "MT 추가 신청 안내", author: "유경식", picks: [P("04-18", "오후 3:34", YKS, 0)] },
    ],
  },
  {
    generation: 14,
    event: "바람막이 · 반팔 가수요조사",
    create: {
      category: "기타",
      startDate: "2026-04-16",
      endDate: "2026-04-19",
      tags: ["단체복"],
      summary: "14기 디자인팀이 바람막이·반팔 디자인 전에 받은 가수요조사.",
    },
    notices: [{ date: "2026-04-16", title: "만취 바람막이 반팔 가수요조사", author: "이영준", picks: [P("04-16", "오후 4:46", LYJ)] }],
  },
  {
    generation: 14,
    event: "소융 라칼 행사 공연",
    notices: [
      {
        match: "6/18 소융 라칼 행사 공연진 모집",
        date: "2026-05-25",
        title: "라칼×소융 행사 공연진 모집",
        author: "최지범",
        picks: [P("05-25", "오후 4:02", JB)],
      },
    ],
  },
  {
    generation: 14,
    event: "1학기 종강총회",
    create: {
      category: "동아리 활동",
      startDate: "2026-06-22",
      endDate: "2026-06-22",
      tags: ["총회"],
      summary: "6/3 수요조사(6/4 마감) → 6/22 17:30 제1학술관 201호 종강총회, 18:00 달달포차 뒤풀이.",
    },
    notices: [
      { date: "2026-06-03", title: "만취 14기 종강총회 공지", author: "최지범", picks: [P("06-03", "오후 6:18", JB)] },
      { date: "2026-06-22", title: "종강총회 시작 안내", author: "최지범", picks: [P("06-22", "오후 5:31", JB)] },
    ],
  },

  // ── 14기 공지방에 올라온 14.5기 관련 공지 ──
  {
    generation: 14.5,
    event: "국제교육원 여름학기 말하기 대회 공연",
    notices: [
      {
        date: "2026-07-01",
        title: "외부공연 공연진 모집 안내",
        author: "최지범",
        picks: [P("07-01", "오전 10:02", JB)],
      },
    ],
  },
  {
    generation: 14.5,
    event: "올랭말랭 촬영",
    notices: [{ date: "2026-07-05", title: "올랭말랭 웹예능 촬영 안내", author: "최지범", picks: [P("07-05", "오전 11:21", JB)] }],
  },
  {
    generation: 14.5,
    event: "14.5기 임원진 시작 · 인수인계",
    notices: [
      { match: "재가입", date: "2026-07-07", title: "14.5기 재가입 공지", author: "최지범", picks: [P("07-07", "오후 7:35", JB, 0)] },
      { date: "2026-07-10", title: "14.5기 톡방 안내", author: "최지범", picks: [P("07-10", "오전 11:29", JB)] },
    ],
  },
  {
    generation: 14.5,
    event: "한양 문화제 (한양제 · 가을 축제)",
    notices: [
      {
        date: "2026-07-27",
        title: "14.5기 한양문화제 공연진 모집 시작 안내 (14기 공지방)",
        author: "최지범",
        picks: [P("07-27", "오후 12:50", JB)],
      },
    ],
  },
];

applyPlan(PLAN, cliOptions()).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
