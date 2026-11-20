/**
 * 카카오톡 대화 내보내기(.txt)에서 공지 메시지를 원문 그대로 골라 아카이브 행사에 넣는 공용 로직.
 *  - 메시지는 [날짜 MM-DD + 시각 '오전/오후 H:MM' + 보낸 사람]으로 고른다.
 *  - '사진', '사진 N장', '동영상' 첨부 표시와 톡게시판 투표 알림은 뺀다. '파일: ...' 줄은 남긴다.
 *  - 동방 비밀번호와 계좌번호는 가린다.
 */
const fs = require("fs");
const mongoose = require("mongoose");
const ArchiveEvent = require("../../models/ArchiveEvent");
const { titleFromBody } = require("../../utils/archiveNoticeTitle");
const { parseSections, serializeSections, hasSectionTitled } = require("../../utils/archiveSections");

const DATE_RE = /^-+ (\d{4})년 (\d{1,2})월 (\d{1,2})일 .+ -+$/;
const MSG_RE = /^\[([^\]]+)\] \[(오전|오후) (\d{1,2}:\d{2})\] ?(.*)$/;
const SYSTEM_RE = [
  /님(?:이|을) .*(?:초대했습니다|내보냈습니다)\.$/,
  /님이 나갔습니다\.$/,
  /님이 부방장이 되었습니다\.$/,
  /님이 방장이 되어/,
  /^메시지가 삭제되었습니다\.$/,
  /^관리자가 메시지를 가렸습니다\.$/,
  /^미디어 백업이/,
  /^팀 이름이 변경되었습니다\.$/,
];
const ATTACHMENT_RE = /^(?:사진(?: \d+장)?|동영상)$/;

function parseChat(text) {
  const messages = [];
  let day = "";
  let current = null;
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
    const d = line.match(DATE_RE);
    if (d) {
      day = `${d[2].padStart(2, "0")}-${d[3].padStart(2, "0")}`;
      current = null;
      continue;
    }
    const m = line.match(MSG_RE);
    if (m) {
      current = { day, sender: m[1], time: `${m[2]} ${m[3]}`, lines: [m[4]] };
      messages.push(current);
      continue;
    }
    if (SYSTEM_RE.some((re) => re.test(line))) {
      current = null;
      continue;
    }
    if (current) current.lines.push(line);
  }
  return messages.map((msg) => ({
    ...msg,
    text: msg.lines.join("\n").replace(/^톡게시판 '공지': /, "").replace(/\s+$/, ""),
  }));
}

const redact = (text) =>
  text
    .replace(/\(비밀번호: [^)]*\)/g, "(비밀번호: 생략)")
    .replace(/(계좌: )(?:[^\d\n]*?)\d[\d-]{9,}\d/g, "$1(생략)")
    .replace(/\b\d{4}-\d{4}-\d{4}\b/g, "(계좌번호 생략)")
    .replace(/\b01\d-\d{3,4}-\d{4}\b/g, "(연락처 생략)")
    // 구글 시트·드라이브 링크는 명단 같은 개인정보로 이어져서 뺀다
    .replace(/https:\/\/(?:docs|drive)\.google\.com\/\S+/g, "(링크 생략)");

/**
 * 맞춤법·띄어쓰기 교정 (본문과 제목에 순서대로 적용). 말투·줄임말·이모지는 건드리지 않는다.
 * [틀린 표기, 고친 표기]
 */
const CORRECTIONS = [
  // 맞춤법
  ["현제 주최측", "현재 주최 측"], ["깉아요", "같아요"], ["되요", "돼요"], ["갯수", "개수"], ["공연를", "공연을"],
  ["뒷풀이", "뒤풀이"], ["종강종회", "종강총회"], ["공대패스티벌", "공대 페스티벌"], ["패스티벌", "페스티벌"],
  ["컨텐츠", "콘텐츠"], ["트렌지션", "트랜지션"], ["무알콜", "무알코올"], ["choero", "choreo"],
  ["갑작스래 바뀌게된", "갑작스레 바뀌게 된"], ["올라거서", "올라가서"], ["들어가명", "들어가면"],
  ["다른층 거지말기", "다른 층 가지 말기"], ["보내주시는 공은", "보내주시는 곡은"], ["걸리시는", "걸리쉬는"],
  ["장르하고 생각하여", "장르라고 생각하여"], ["3회을", "3회를"], ["재가입을 늦으신", "재가입이 늦으신"],
  ["입력해주세여", "입력해 주세요"], ["오후 18시까지", "18시까지"], ["19:00시 이후", "19:00 이후"],
  ["16:50분 식사", "16:50 식사"], ["5월/26(화)", "5월 26일(화)"], ["5월29일", "5월 29일"], ["11월13일", "11월 13일"],
  // 띄어쓰기
  ["주최측", "주최 측"], ["인원이갈", "인원이 갈"], ["링크를보내주시면", "링크를 보내주시면"],
  ["맡아주시는게 좋을 거 같아", "맡아주시는 게 좋을 것 같아"], ["마음같아선", "마음 같아선"], ["이해부탁드리며", "이해 부탁드리며"],
  ["꿈터공연에", "꿈터 공연에"], ["봄축제공연에", "봄축제 공연에"], ["만가지를 취하는 만취인만큼", "만 가지를 취하는 만취인 만큼"],
  ["꿈터와같은", "꿈터와 같은"], ["임원진 입니다", "임원진입니다"], ["연락 해주세요", "연락해 주세요"],
  ["23일 에서", "23일에서"], ["진행할예정이니", "진행할 예정이니"], ["가능하신분들", "가능하신 분들"], ["안된다 했는데", "안 된다고 했는데"],
  ["오후중", "오후 중"], ["진행예정입니다", "진행 예정입니다"], ["연습등", "연습 등"], ["시간내서", "시간 내서"],
  ["보신분들", "보신 분들"], ["가져올수 있으면", "가져올 수 있으면"], ["무대할때만", "무대 할 때만"],
  ["오는거도", "오는 것도"], ["다른사람에게", "다른 사람에게"], ["모여야할 시간 늦지않게", "모여야 할 시간 늦지 않게"],
  ["인솔 해드릴예정이니", "인솔해 드릴 예정이니"], ["업로드 하는데", "업로드하는 데"], ["못 볼수도 있을거 같아서", "못 볼 수도 있을 것 같아서"],
  ["1층 7층외에", "1층, 7층 외에"], ["20시 30분 부터", "20시 30분부터"], ["늦을거 같은", "늦을 것 같은"],
  ["가능여부를", "가능 여부를"], ["신입생오티", "신입생 오티"], ["공연가는 사람중", "공연 가는 사람 중"], ["수고많았어요", "수고 많았어요"],
  ["새학기", "새 학기"], ["참여인원  성비", "참여 인원 성비"], ["오디션  희망", "오디션 희망"],
  ["안무영상", "안무 영상"], ["곡구성", "곡 구성"], ["힙합요소", "힙합 요소"], ["센터파트", "센터 파트"], ["연습시간", "연습 시간"],
  ["그시절", "그 시절"], ["되어보실분", "되어 보실 분"], ["한스푼", "한 스푼"], ["정확도 뿐만", "정확도뿐만"], ["글쓰는", "글 쓰는"],
  ["떠오를텐데요", "떠오를 텐데요"], ["찢어보려합니다", "찢어 보려 합니다"], ["참고 해주시고", "참고해 주시고"],
  ["위 곡중 오디션 지원하고싶은", "위 곡 중 오디션 지원하고 싶은"], ["기한내에 지원하지 못 했을경우", "기한 내에 지원하지 못했을 경우"],
  ["참여하시는게", "참여하시는 게"], ["있으신분은 참여가 힘들수", "있으신 분은 참여가 힘들 수"], ["참고바랍니다", "참고 바랍니다"],
  ["않으신분", "않으신 분"], ["관심있", "관심 있"], ["추 후", "추후"], ["잘추고", "잘 추고"], ["넘어가야할", "넘어가야 할"],
  ["기본기클래스", "기본기 클래스"], ["이번주", "이번 주"], ["신청바랍니다", "신청 바랍니다"], ["접해보고싶다고", "접해 보고 싶다고"],
  ["놓치지말고", "놓치지 말고"], ["다함께", "다 함께"], ["첫곡", "첫 곡"], ["시험치느라 고생많으셨습니다", "시험 치느라 고생 많으셨습니다"],
  ["재미있는곡을", "재미있는 곡을"], ["배우고싶으신", "배우고 싶으신"], ["절도있는 올드스쿨힙합에 ,", "절도 있는 올드스쿨 힙합에,"],
  ["좋아할만한", "좋아할 만한"], ["통통튀는", "통통 튀는"], ["맞을거라고", "맞을 거라고"], ["않을거라고", "않을 거라고"],
  ["퀄리티등의 사유로 지원한팀과", "퀄리티 등의 사유로 지원한 팀과"], ["두개를", "두 개를"], ["비트음원 입니다", "비트 음원입니다"],
  ["하기도하고", "하기도 하고"], ["MT신청인원 중 취소인원이", "MT 신청 인원 중 취소 인원이"], ["준비해야하는", "준비해야 하는"],
  ["참여가능한", "참여 가능한"], ["만들어 졌습니다", "만들어졌습니다"], ["재가입 못하신", "재가입 못 하신"], ["정해져있기", "정해져 있기"],
  ["기간동안", "기간 동안"], ["시간동안", "시간 동안"], ["14.5기 에서", "14.5기에서"], ["10/01 에", "10/01에"],
  ["오시는분들은", "오시는 분들은"], ["까지 입니다", "까지입니다"], ["늦지않게", "늦지 않게"], ["가리지않고", "가리지 않고"],
  ["영화같은", "영화 같은"], ["클래스 처럼", "클래스처럼"], ["우선시 되어서는", "우선시되어서는"], ["남아있는", "남아 있는"],
  ["방치되어있는", "방치되어 있는"], ["우려 뿐만", "우려뿐만"], ["챙겨가주시길", "챙겨 가주시길"],
  ["곡연진부담", "공연진부담"], ["했습ㅁ니다", "했습니다"], ["왠만하면", "웬만하면"], ["시간내주시면", "시간 내주시면"],
  ["필수참여가", "필수 참여가"], ["올라오ㅓㅏㅆ어요", "올라왔어요"],
  ["곡연진부담", "공연진부담"], ["했습ㅁ니다", "했습니다"], ["왠만하면", "웬만하면"], ["시간내주시면", "시간 내주시면"],
  ["필수참여가", "필수 참여가"], ["올라오ㅓㅏㅆ어요", "올라왔어요"],
];

const correct = (text) => CORRECTIONS.reduce((s, [from, to]) => s.split(from).join(to), text);

/**
 * pick 하나: { day, time, sender, index?, room? }
 *  - index: 같은 시각 텍스트 메시지 중 몇 번째(0부터)
 *  - room: 여러 대화방 파일을 쓸 때 어느 방인지 (기본 "main")
 */
const P = (day, time, sender, index, room) => ({ day, time, sender, index, room });

function bodyOf(rooms, picks) {
  const parts = [];
  for (const p of picks) {
    const messages = rooms[p.room || "main"];
    if (!messages) throw new Error(`대화방 파일 없음: ${p.room}`);
    const hits = messages.filter(
      (m) =>
        m.day === p.day &&
        m.time === p.time &&
        m.sender === p.sender &&
        !ATTACHMENT_RE.test(m.text) &&
        !m.text.startsWith("톡게시판 '투표") &&
        !m.text.startsWith("톡게시판 '글 공유'"),
    );
    const chosen = p.index === undefined ? hits : [hits[p.index]].filter(Boolean);
    if (!chosen.length) throw new Error(`원문 메시지를 못 찾음: ${p.day} ${p.time} ${p.sender}`);
    parts.push(...chosen.map((m) => m.text));
  }
  return redact(correct(parts.join("\n\n")));
}

/**
 * 공지 하나를 보낸 시각(방·날짜·시각)별로 나눈다. 같은 시각에 연달아 보낸 메시지는 한 공지로 둔다.
 *  - 첫 부분: 지정한 title·date·match 사용
 *  - 나머지: n.titles["MM-DD 오후 H:MM"] (그 부분 첫 메시지 시각)이 있으면 그 제목,
 *    없으면 본문 첫 줄로 제목을 만들고 날짜는 그 메시지 날짜
 */
const SPLIT_GAP_MIN = 15; // 앞 메시지와 이만큼 넘게 떨어지면 다른 공지
const SHORT_TAIL = 40; // 이보다 짧은 덧붙임은 같은 날 앞 공지에 붙인다

const minutesOf = (time) => {
  const [, ampm, h, m] = time.match(/^(오전|오후) (\d{1,2}):(\d{2})$/);
  return ((Number(h) % 12) + (ampm === "오후" ? 12 : 0)) * 60 + Number(m);
};

function splitParts(rooms, n) {
  const groups = [];
  for (const p of n.picks) {
    const room = p.room || "main";
    const last = groups.at(-1);
    const lastPick = last?.picks.at(-1);
    const near =
      last &&
      last.room === room &&
      last.day === p.day &&
      Math.abs(minutesOf(p.time) - minutesOf(lastPick.time)) <= SPLIT_GAP_MIN;
    if (near) last.picks.push(p);
    else groups.push({ room, day: p.day, time: p.time, picks: [p] });
  }
  // 짧은 덧붙임(정정·마감 알림 등)은 같은 날 앞 공지에 붙인다.
  const merged = [];
  for (const g of groups) {
    g.body = bodyOf(rooms, g.picks);
    const prev = merged.at(-1);
    if (prev && prev.day === g.day && g.body.length < SHORT_TAIL) {
      prev.picks.push(...g.picks);
      prev.body = bodyOf(rooms, prev.picks);
    } else merged.push(g);
  }
  const year = n.date.slice(0, 4);
  return merged.map((g, i) => {
    if (i === 0) return { title: n.title, date: n.date, match: n.match, body: g.body };
    return {
      title: n.titles?.[`${g.day} ${g.time}`] || titleFromBody(g.body, `${n.title} (이어서)`),
      date: `${year}-${g.day}`,
      body: g.body,
    };
  });
}

/**
 * plan: [{ generation, event, create?, remove?, notices: [{ match?, date, title, titles?, author, picks }] }]
 *  - create: 행사가 없을 때 새로 만들 정보. 없으면 오류.
 *  - match: 바꿀 기존 항목 제목(같은 날짜). 없으면 같은 제목·날짜 항목을 갱신, 그것도 없으면 추가.
 */
async function applyPlan(plan, { file, files, confirmed, printBodies }) {
  const paths = files || (file ? { main: file } : null);
  if (!paths) throw new Error("원문 파일 경로를 넘겨 주세요.");
  const messages = Object.fromEntries(
    Object.entries(paths).map(([room, path]) => [room, parseChat(fs.readFileSync(path, "utf8"))]),
  );
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI 가 설정되지 않았습니다 (.env 확인).");
  await mongoose.connect(process.env.MONGO_URI);

  const count = { updated: 0, added: 0, removed: 0, created: 0 };
  try {
    for (const step of plan) {
      let doc = await ArchiveEvent.findOne({ title: step.event, generation: step.generation });
      if (!doc) {
        if (!step.create) throw new Error(`행사 없음: [${step.generation}기] ${step.event}`);
        doc = new ArchiveEvent({ ...step.create, title: step.event, generation: step.generation, notices: [] });
        count.created += 1;
        console.log(`+ 새 행사 [${step.generation}기] ${step.event}`);
      } else {
        console.log(`= [${step.generation}기] ${step.event}`);
      }

      for (const title of step.remove || []) {
        const before = doc.notices.length;
        doc.notices = doc.notices.filter((n) => n.title !== title);
        if (doc.notices.length < before) {
          count.removed += 1;
          console.log(`    - 뺌: ${title}`);
        }
      }

      const used = new Set();
      for (const n of step.notices) {
        for (const part of splitParts(messages, n)) {
          const base = correct(part.title);
          let title = base;
          for (let k = 2; used.has(`${part.date}|${title}`); k += 1) title = `${base} (${k})`;
          used.add(`${part.date}|${title}`);
          const fields = { title, date: part.date, kind: "공지", body: part.body, authorName: n.author };
          // 교정 전 제목·바꿀 기존 제목으로 저장된 항목도 같은 항목으로 본다 (중복 추가 방지).
          const names = [title, part.title !== base ? part.title : null, part.match].filter(Boolean);
          const target = names
            .map((name) => doc.notices.find((x) => x.title === name && x.date === part.date))
            .find(Boolean);
          // 같은 날 항목을 섹션으로 합친 뒤(archiveMergeSameDay.js)면 그 섹션 내용만 갱신한다.
          const merged = target ? null : doc.notices.find(
            (x) => x.date === part.date && names.some((name) => hasSectionTitled(x.body, name)),
          );
          if (target) {
            Object.assign(target, fields);
            count.updated += 1;
            console.log(`    ~ ${part.date} ${title}  (${part.body.length}자)`);
          } else if (merged) {
            const sections = parseSections(merged.body);
            const s = sections.find((x) => x.icon !== null && names.includes(x.title));
            s.text = part.body;
            s.title = title;
            merged.body = serializeSections(sections);
            count.updated += 1;
            console.log(`    ~ ${part.date} ${title}  (섹션, ${part.body.length}자)`);
          } else {
            doc.notices.push(fields);
            count.added += 1;
            console.log(`    + ${part.date} ${title}  (${part.body.length}자)`);
          }
          if (printBodies) console.log(`\n${part.body}\n${"-".repeat(40)}`);
        }
      }
      if (confirmed) await doc.save();
    }
  } finally {
    await mongoose.disconnect();
  }

  console.log(`\n새 행사 ${count.created} · 본문 갱신 ${count.updated} · 추가 ${count.added} · 제거 ${count.removed}`);
  if (!confirmed) console.log("확인만 했습니다. 저장하려면 --yes 를 붙이세요.");
}

function cliOptions() {
  const args = process.argv.slice(2);
  return {
    file: args.find((a) => !a.startsWith("--")),
    confirmed: args.includes("--yes"),
    printBodies: args.includes("--print"),
  };
}

module.exports = { parseChat, bodyOf, applyPlan, cliOptions, P };
