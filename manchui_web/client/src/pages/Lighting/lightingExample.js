/**
 * 예시 팀: public/lighting-presets/예시 데이터/ 의 음원으로 만든 완성된 예시.
 * DB 에 저장하지 않고 화면에만 있다. 예시에서 고친 내용은 새로고침하면 처음으로 돌아간다.
 * 곡 하나에 조명을 어떻게 정하는지 보여주는 용도. 설명칸에는 조명의 느낌이 아니라
 * "언제 바꾸는지"(동작, 대형, 무대 상황)를 적는다. 댄스 동아리 기준. 구간 시간은 음원의 소리 크기 변화를 보고 잡았다.
 */
export const EXAMPLE_ID = "example";

export const EXAMPLE_AUDIO = {
  url: encodeURI("/lighting-presets/예시 데이터/한양문화제 단체곡 베리굿 음원.mp3"),
  name: "한양문화제 단체곡 베리굿 음원.mp3",
};

const EXAMPLE_NAME = {
  ko: "예시 · 베리굿 단체곡",
  en: "Example · Berry Good group song",
  zh: "示例 · Berry Good 集体曲",
  ja: "例 · Berry Good 団体曲",
};

export const EXAMPLE_TEAM = {
  _id: EXAMPLE_ID,
  order: null,
  name: EXAMPLE_NAME.ko,
  channel: 28,
  length: "02:06",
  createdAt: "2000-01-01T00:00:00.000Z",
};

/** [시작, 조명 번호, 동작이나 상황 (조명의 느낌이 아니라 "언제 바꾸는지")] — 댄스 공연 기준 */
const ROWS = [
  ["00:00", 0, {
    ko: "무대 암전. 멤버들이 자리 잡을 때까지",
    en: "Blackout while the members get into position",
    zh: "舞台全暗，直到成员站好位",
    ja: "暗転。メンバーが位置につくまで",
  }],
  ["00:02", 1, {
    ko: "음악이 시작되면 전환",
    en: "Switch when the music starts",
    zh: "音乐响起时切换",
    ja: "音楽が始まったら切り替え",
  }],
  ["00:07", 3, {
    ko: "첫 동작. 다 같이 고개를 들 때",
    en: "First move. When everyone lifts their head",
    zh: "第一个动作。大家一起抬头时",
    ja: "最初の振り。全員が顔を上げるとき",
  }],
  ["00:20", 9, {
    ko: "후렴 첫 박. 다 같이 점프하면 전환",
    en: "First beat of the chorus. Switch when everyone jumps",
    zh: "副歌第一拍。大家一起跳起来时切换",
    ja: "サビの1拍目。全員がジャンプしたら切り替え",
  }],
  ["00:33", 8, {
    ko: "모두 멈추는 포즈 (브레이크)",
    en: "Everyone freezes in a pose (break)",
    zh: "所有人定格摆姿势（break）",
    ja: "全員が止まるポーズ（ブレイク）",
  }],
  ["00:35", 5, {
    ko: "대형이 V자로 바뀔 때",
    en: "When the formation changes into a V",
    zh: "队形变成 V 字时",
    ja: "フォーメーションがV字に変わるとき",
  }],
  ["01:03", 7, {
    ko: "센터가 앞으로 걸어 나오면 전환",
    en: "Switch when the center walks to the front",
    zh: "C 位走到前面时切换",
    ja: "センターが前に歩いて出てきたら切り替え",
  }],
  ["01:19", 6, {
    ko: "킬링 파트. 다 같이 웨이브를 시작할 때",
    en: "Highlight part. When everyone starts the wave",
    zh: "高光部分。大家一起开始做 wave 时",
    ja: "キリングパート。全員がウェーブを始めるとき",
  }],
  ["01:33", 8, {
    ko: "다 같이 멈추는 포즈",
    en: "Everyone freezes in a pose",
    zh: "大家一起定格",
    ja: "全員で止まるポーズ",
  }],
  ["01:36", 10, {
    ko: "솔로 파트. 한 명씩 앞으로 나와서 출 때",
    en: "Solo part. When members come forward one by one",
    zh: "solo 部分。成员一个一个走到前面跳时",
    ja: "ソロパート。一人ずつ前に出て踊るとき",
  }],
  ["02:04", 2, {
    ko: "엔딩 포즈를 잡고 인사할 때",
    en: "When everyone hits the ending pose and bows",
    zh: "摆好结尾姿势、鞠躬时",
    ja: "エンディングポーズを決めてお辞儀するとき",
  }],
];
/** 예시 팀 이름 / 구간 (고른 언어로) */
export function exampleTeamFor(lang) {
  return { ...EXAMPLE_TEAM, name: EXAMPLE_NAME[lang] || EXAMPLE_NAME.ko };
}

export function makeExampleRows(lang = "ko") {
  return ROWS.map(([start, preset, note], i) => ({
    _id: `example-${i}`,
    teamId: EXAMPLE_ID,
    start,
    end: "",
    preset,
    note: note[lang] || note.ko,
    createdAt: `2000-01-01T00:00:${String(i).padStart(2, "0")}.000Z`,
  }));
}