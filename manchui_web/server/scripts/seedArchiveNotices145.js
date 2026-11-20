/**
 * 1회용: 14.5기 임원진 공지글(2026-07 ~ 2026-11 공지방)을 아카이브 행사에 공지 항목으로 붙이기.
 * 출처: 만취_임원진_공지_정리.txt (2026-11-20 정리본). 동방 비밀번호·입금 계좌는 넣지 않음.
 *
 *  - 행사는 [기수 + 이름]으로 찾는다. 없는 행사는 create 정보가 있을 때만 새로 만든다.
 *  - replaces: 같은 행사 안 같은 제목의 기존 항목(계획용 '공지')을 이 공지로 바꾼다(제목·날짜·본문).
 *  - 같은 행사에 같은 제목·날짜 항목이 이미 있으면 건너뛴다 → 여러 번 돌려도 중복 없음.
 *
 * 사용법 (server 폴더에서, .env 의 MONGO_URI 사용)
 *   node scripts/seedArchiveNotices145.js        → 확인만
 *   node scripts/seedArchiveNotices145.js --yes  → 저장
 */
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const ArchiveEvent = require("../models/ArchiveEvent");

const confirmed = process.argv.includes("--yes");
const GEN = 14.5;

const lines = (...rows) => rows.join("\n");

/** 문과인의 밤 · 공대 페스티벌은 한 공지로 같이 모집해서 두 행사에 똑같이 넣는다. */
const NIGHT_FEST_RECRUIT = {
  date: "2026-08-26",
  title: "문과인의 밤 · 공대 페스티벌 공연진 모집",
  author: "최지범",
  body: lines(
    "■ 문과인의 밤: 9/7(월) 18:00, 학생복지관 앞 민주광장",
    "■ 공대 페스티벌: 9/17(목) 19:00 이후, 1공학관 주차장",
    "",
    "- 한 행사만 또는 두 행사 모두 참여 가능",
    "- 모집 후 참여 인원·개인 파트를 고려해 곡 선정 및 팀 구성",
    "- 기존에 준비된 팀도 셋리스트에 포함 예정",
    "- 신청: 투표",
  ),
};
const NIGHT_FEST_EXTRA = {
  date: "2026-08-30",
  title: "문과인의 밤 · 공대 페스티벌 추가 모집",
  author: "최지범",
  body: lines("인원 부족으로 공연진 추가 모집.", "- 신청: 투표 (9/1 23:40 종료)"),
};

const PLAN = [
  {
    event: "바람막이(단체복) 수요조사",
    notices: [
      {
        replaces: "바람막이 수요조사",
        date: "2026-07-24",
        title: "바람막이 수요조사",
        author: "최지범",
        body: lines(
          "만취 바람막이 제작 수요조사를 진행합니다.",
          "",
          "- 예상 가격: 5~6만 원대",
          "- 투표 결과와 최소 수량 충족 여부에 따라 제작 결정",
          "- 제작이 확정되면 디자인·사이즈·입금 방법은 따로 안내",
          "- 신청: 투표 (7/27 23:55 종료)",
          "",
          "※ 공지방에는 제작 확정 공지가 없음.",
        ),
      },
    ],
  },
  {
    event: "한양 문화제 (한양제 · 가을 축제)",
    notices: [
      {
        date: "2026-07-27",
        title: "한양문화제(가을축제) 공연진 모집",
        author: "최지범",
        body: lines(
          "■ 공연 예정: 9/29 ~ 10/1",
          "■ 모집 마감: 7/29 23:59",
          "",
          "모집 대상",
          "- 방학 중 학교 근처에서 연습할 수 있는 사람",
          "- 연습에 성실하고 책임감 있게 참여할 사람",
          "",
          "- 곡별 인원 제한이 있어 오디션 진행. 신청해도 최종 선발되지 않을 수 있음",
          "- 참여자는 별도 톡방에 초대해 곡 추천과 이후 일정을 안내",
        ),
      },
      {
        date: "2026-07-30",
        title: "한양문화제 공연곡 선정 · 오디션 신청 안내",
        author: "최지범",
        body: lines(
          "공연곡 선정을 마치고 오디션 신청을 받습니다.",
          "- 신청을 놓친 사람은 개별 연락 가능",
        ),
      },
    ],
  },
  {
    event: "2학기 가두모집",
    notices: [
      {
        date: "2026-07-31",
        title: "2학기 가두모집 공연진 모집",
        author: "최지범",
        body: lines(
          "■ 공연일: 9/9, 민주광장 (전체 공연 18:30 ~ 21:00)",
          "■ 만취 순서: 8타임 20:28 ~ 20:40 예정 (최종 순서는 확정 후 안내)",
          "",
          "- 모집 마감 후 참여 인원에 맞춰 곡 선정·팀 구성",
        ),
      },
      {
        date: "2026-08-02",
        title: "2학기 가두모집 공연진 추가 모집",
        author: "최지범",
        body: lines(
          "- 공연 전까지 자유롭게 연습",
          "- 마감: 원문 '8월 4일(금) 23:59' (8/4는 화요일, 요일 표기 오류). 투표는 8/5 00:00 종료",
        ),
      },
    ],
  },
  { event: "문과인의 밤", notices: [NIGHT_FEST_RECRUIT, NIGHT_FEST_EXTRA] },
  { event: "공대 페스티벌", notices: [NIGHT_FEST_RECRUIT, NIGHT_FEST_EXTRA] },
  {
    event: "팝업 클래스",
    create: {
      title: "팝업 클래스",
      category: "동아리 활동",
      startDate: "2026-08-29",
      endDate: "2026-10-02",
      tags: ["클래스"],
      summary: "곡장이 춤이나 기본기를 알려주는 수시 클래스. 공지 시간에 선착순 투표로 신청. 9/18 유경식 & 임하경, 10/2 모상준 클래스.",
    },
    notices: [
      {
        date: "2026-08-29",
        title: "팝업클래스 운영 안내",
        author: "김은우",
        body: lines(
          "곡장이 춤 또는 기본기를 알려주는 수시 클래스입니다.",
          "",
          "신청 방법: 공지된 시간에 선착순 투표 신청 → 결과 확인 → 수업 참여",
          "",
          "※ 정당한 사유 없이 노쇼하면 이후 클래스에서 후순위로 밀릴 수 있습니다.",
        ),
      },
      {
        date: "2026-08-29",
        title: "팝업클래스: 유경식 & 임하경",
        author: "김은우",
        body: lines(
          "■ 곡: 4batz & Drake - act ii date @ 8 (remix)",
          "■ 장르: R&B choreo collabo class / 난이도 중~중상",
          "■ 일시: 9/18 20:00 ~ 22:00 / 장소 추후 공지",
          "■ 신청: 8/31 20:00 선착순 투표",
          "",
          "버즈온 3회 프로모션으로 NOID 디렉터 2인의 창작 안무 클래스.",
        ),
      },
      { kind: "일정", date: "2026-09-18", title: "팝업클래스: 유경식 & 임하경 (20:00~22:00)" },
      {
        date: "2026-09-23",
        title: "팝업클래스: 모상준",
        author: "최지범",
        body: lines(
          "■ 곡: 태용(NCT) - Storm / 구간 2:07 ~ 끝",
          "■ 장르: K-POP Choreo (Hiphop & Krump) / 난이도 중~중상",
          "■ 일시: 10/2 20:00 ~ 22:00 / 장소 추후 공지",
          "■ 신청: 9/24 20:00 선착순 투표",
          "■ 안무: https://youtu.be/3LpMbz0LB9g?si=iJ0SgSMLWvD1ZONh",
        ),
      },
      { kind: "일정", date: "2026-10-02", title: "팝업클래스: 모상준 (20:00~22:00)" },
    ],
  },
  {
    event: "동아리방 이용 · 회비 안내",
    create: {
      title: "동아리방 이용 · 회비 안내",
      category: "동아리 운영",
      startDate: "2026-09-01",
      endDate: "2026-10-30",
      tags: ["동아리방", "회비"],
      summary: "2학기 동방 이용 규칙(9/1), 회비 환불 기준(9/17), 반입 금지 물품·개인 물품 수거(10/23).",
    },
    notices: [
      {
        date: "2026-09-01",
        title: "동아리방 예약 · 이용 안내",
        author: "최지범",
        body: lines(
          "■ 위치: 학생복지관 4층 422호 (출입 비밀번호는 공지방 원문 참고)",
          "■ 사용 전 예약 필수: https://www.maaaaaaanchui.com/club/reservation",
          "",
          "- 연습·회의 일정이 바뀌거나 취소되면 예약도 바로 수정·취소",
          "- 춤 연습·활동이 우선인 공간. 수면·공부가 우선되면 안 됨",
          "- 사용 후 쓰레기 정리, 창문 열어 환기, 개인 짐 장기 방치 금지",
          "- 거울은 주의해서 사용 (세부 안전 방침은 별도 안내문)",
          "- 공지방에서 대화하지 말고 잡담방 이용",
        ),
      },
      {
        date: "2026-09-17",
        title: "회비 환불 안내",
        author: "최지범",
        body: lines(
          "공식 첫 활동인 만취 챌린지 시작 직후부터 공식 두 번째 활동 시작 직전까지: 50% 환불",
          "",
          "※ 공지에 다른 기간의 환불 규정과 두 번째 활동의 정확한 기준일은 없음.",
        ),
      },
      {
        date: "2026-10-23",
        title: "동아리방 반입 금지 물품 · 개인 물품 수거",
        author: "공지민",
        body: lines(
          "반입 금지",
          "- 인화성 물질: 라이터·성냥·부탄가스 등",
          "- 전열기구: 전기장판·고데기·다리미 등",
          "- 조리도구: 가스버너·커피포트·전자레인지 등",
          "- 침구류: 이불·베개·침낭 등",
          "- 주류: 빈 병·캔·무알콜 포함",
          "",
          "허용: 헤어드라이기, 에프킬라",
          "활동에 꼭 필요한 물품은 먼저 임원진에 문의. 점검 때 금지 물품이 나오면 동아리 전체가 경고받을 수 있음.",
          "",
          "■ 개인 물품 수거 기한: 10/30 23:59",
          "- 기한 후 남은 물품은 임원진이 임의 처리",
          "- 기한 내 수거가 어려우면 임원진에게 미리 연락",
        ),
      },
    ],
  },
  {
    event: "2학기 개강총회",
    notices: [
      {
        date: "2026-09-09",
        title: "2학기 개강총회 안내 · 참여 수요조사",
        author: "최지범",
        body: lines(
          "■ 일시: 9/15 18:00",
          "■ 장소: 제1학술관 101호",
          "■ 뒤풀이: 18:30 예정, '만취', 15,000원 (입금 계좌는 공지방 원문 참고)",
          "",
          "- 참여 수요조사: 9/11까지 투표 (23:55 종료)",
        ),
      },
      {
        date: "2026-09-15",
        title: "개강총회 당일 안내",
        author: "최지범",
        body: lines("- 18:05 시작", "- 20:59 달달포차로 2차 이동. 합류할 사람은 연락"),
      },
      {
        date: "2026-09-16",
        title: "개강총회 자료 공유",
        author: "최지범",
        body: "'26-2 만취 개강총회 자료.pdf' 공지방에 공유.",
      },
    ],
  },
  {
    event: "2학기 만취 챌린지",
    create: {
      title: "2학기 만취 챌린지",
      category: "동아리 활동",
      startDate: "2026-09-21",
      endDate: "2026-11-19",
      tags: ["챌린지", "부원 활동"],
      summary: "9/21 시작(10/31까지) → 10/26 11/15까지 연장 → 11/19 추첨 영상·당첨자 발표. 영상·게시글은 여부회장 김은우에게 전달.",
    },
    notices: [
      {
        date: "2026-09-21",
        title: "만취 챌린지 안내",
        author: "최지범",
        body: lines(
          "부원끼리 춤 영상을 찍어 만취 인스타그램(@maaaaaaanchui)에 올리는 챌린지입니다.",
          "",
          "■ 기간: 9/21 ~ 10/31",
          "",
          "- 인원 제한 없음. 같이 출 사람은 잡담방에서 구하기",
          "- 원하는 곡으로 찍은 영상과 게시글을 여부회장 김은우에게 전송 (원하는 썸네일도 같이)",
          "- 중복 참여 가능, 추첨 반영은 최대 3회. 같은 멤버 구성은 1곡만",
          "- 상품은 1인 1개만 수령",
        ),
      },
      {
        date: "2026-10-26",
        title: "만취 챌린지 기간 연장",
        author: "최지범",
        body: "기간을 11/15 23:59까지 연장합니다. 참여 방법은 같습니다.",
      },
      {
        date: "2026-11-18",
        title: "만취 챌린지 추첨 안내",
        author: "최지범",
        body: "11/19 18:00에 추첨 녹화 영상을 올릴 예정입니다.",
      },
      {
        date: "2026-11-19",
        title: "만취 챌린지 당첨자 발표",
        author: "최지범",
        body: lines(
          "추첨 영상과 함께 당첨자를 발표했습니다.",
          "",
          "- 배달의민족 2만 원 쿠폰: 공지민, 나은",
          "- 메가커피 1만 원 쿠폰: 강서현, 이소율, 임하경",
          "- 투썸플레이스 1만 원 쿠폰: 이가은, 이윤지, 정예주",
        ),
      },
    ],
  },
  {
    event: "BUZZ ON: FACE OFF",
    notices: [
      {
        replaces: "버즈온 모집",
        date: "2026-10-11",
        title: "BUZZ ON : FACE OFF 안내 · 2라운드 모집",
        author: "최지범",
        body: lines(
          "만취 × 필소굿 콜라보 행사입니다.",
          "",
          "■ 날짜: 11/13",
          "■ 장소: 컨퍼런스홀 4층 중강당 / 약 2시간",
          "",
          "- 1라운드: 팀장단 오프닝 무대",
          "- 2라운드: 프리스타일 싸이퍼·배틀. 두 그룹으로 나눠 주최 측 비트에 맞춰 인원을 배분하고 상대 그룹과 배틀",
          "- 3라운드: 자체 음원 제작 후 라이브·댄스 퍼포먼스",
          "",
          "2라운드 참여자를 모집합니다 (투표).",
        ),
      },
      {
        date: "2026-10-13",
        title: "BUZZ ON 2라운드 추가 모집 · 3라운드 모집",
        author: "최지범",
        body: lines(
          "- 2라운드와 3라운드 참여는 별개",
          "- 3라운드는 인원 배분·퀄리티 등의 이유로 희망 팀과 다르게 배정될 수 있음",
          "- 신청: 투표 (10/15 00:00 종료)",
          "",
          "■ 3라운드 팀",
          "SHUTTER",
          "- 만취 디렉터: 공지민, 강서현 / 필소굿 디렉터: 송정하, 강규민, 장용석, 최민규",
          "- 영화 같은 장면 전환과 퍼포먼스, 힙합을 포함한 다양한 장르 구성",
          "",
          "한국산",
          "- 만취 디렉터: 최지범, 나은 / 필소굿 디렉터: 남석현, 김도현, 권용진",
          "- 서태지와 아이들 '컴백홈', 드렁큰 타이거 'Good Life' 비트의 올드스쿨 감성과 힙합 그루브",
        ),
      },
      {
        date: "2026-11-10",
        title: "BUZZ ON 행사 시간 · 뒤풀이 수요조사",
        author: "최지범",
        body: lines(
          "■ 행사 시간: 11/13 18:30 ~ 20:30",
          "■ 뒤풀이: 11/13 21:00, 장소 미정",
          "- 뒤풀이 수요조사: 투표 (11/11 23:55 종료)",
        ),
      },
    ],
  },
  {
    event: "정기공연",
    notices: [
      {
        replaces: "정기공연 곡장 모집",
        date: "2026-10-15",
        title: "정기공연 공연진 · 곡장 모집",
        author: "최지범",
        body: lines(
          "■ 공연 예정일: 12/3(목)",
          "■ 장소: 콘홀·소극장·컨퍼홀 중 추후 확정",
          "",
          "진행 계획",
          "① ~10/18: 공연진 및 곡장 모집 (투표는 10/18 00:00 종료)",
          "② ~10/23: 공지 톡방 생성 후 희망 안무 영상 링크 제출",
          "③ ~10/24: 곡장이 영상 확인 후 맡을 곡 선정",
          "④ ~10/25: 후보곡·영상 링크·곡장·모집 인원 공유",
          "⑤ 10/26 20:00~: 선착순 곡 참가 투표 (전날 상세 방법 안내)",
          "⑥ 최종 모집 후 곡장 지도하에 연습",
          "",
          "곡장 조건: 안무 카피 가능, 연습 주도 가능, 공연을 꾸밀 의지가 있는 사람",
          "곡장 혜택: 희망 곡 직접 선곡, 일반 부원보다 더 많은 곡 참여 가능",
        ),
      },
    ],
  },
];

const sameNotice = (a, b) => a.title === b.title && (a.date || "") === (b.date || "");

async function main() {
  if (confirmed && !process.env.MONGO_URI) throw new Error("MONGO_URI 가 설정되지 않았습니다 (.env 확인).");
  if (process.env.MONGO_URI) await mongoose.connect(process.env.MONGO_URI);
  const online = mongoose.connection.readyState === 1;

  let added = 0;
  let replaced = 0;
  let createdEvents = 0;

  for (const step of PLAN) {
    let doc = online ? await ArchiveEvent.findOne({ title: step.event, generation: GEN }) : null;
    if (!doc) {
      if (!step.create) {
        console.log(`! 행사 없음, 건너뜀: [${GEN}기] ${step.event}`);
        continue;
      }
      console.log(`+ 새 행사: [${GEN}기] ${step.event}`);
      createdEvents += 1;
      doc = new ArchiveEvent({ ...step.create, generation: GEN, notices: [] });
    } else {
      console.log(`= 행사: [${GEN}기] ${step.event}`);
    }

    for (const n of step.notices) {
      const notice = {
        title: n.title,
        date: n.date,
        kind: n.kind || "공지",
        body: n.body || "",
        authorName: n.author || "",
      };
      if (doc.notices.some((x) => sameNotice(x, notice))) {
        console.log(`    · 이미 있음: ${notice.date} ${notice.title}`);
        continue;
      }
      const target = n.replaces && doc.notices.find((x) => x.title === n.replaces);
      if (target) {
        console.log(`    ~ 바꿈: ${target.date} ${target.title} → ${notice.date} ${notice.title}`);
        Object.assign(target, notice);
        replaced += 1;
      } else {
        console.log(`    + ${notice.date} [${notice.kind}] ${notice.title}`);
        doc.notices.push(notice);
        added += 1;
      }
    }
    if (confirmed) await doc.save();
  }

  console.log(`\n새 행사 ${createdEvents} · 공지 추가 ${added} · 기존 항목 교체 ${replaced}`);
  if (!confirmed) console.log("확인만 했습니다. 실제로 넣으려면: node scripts/seedArchiveNotices145.js --yes");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
