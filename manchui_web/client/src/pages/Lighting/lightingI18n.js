import { useSyncExternalStore } from "react";

/**
 * 조명 큐시트 번역 (한국어 · English · 中文 · 日本語).
 * 고른 언어는 이 기기에 저장되고, 처음 들어오면 휴대폰/브라우저 언어로 정한다.
 * 문구 추가: DICT 에 키를 만들고 네 언어를 모두 적는다. {n} 같은 자리는 t(key, { n }) 로 채운다.
 */
export const LANGS = [
  { code: "ko", label: "한국어", short: "KO" },
  { code: "en", label: "English", short: "EN" },
  { code: "zh", label: "中文", short: "中" },
  { code: "ja", label: "日本語", short: "日" },
];

const STORAGE_KEY = "lighting-lang";
const CODES = LANGS.map((l) => l.code);

function detect() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (CODES.includes(saved)) return saved;
  } catch {
    /* 저장소 못 쓰면 감지만 */
  }
  const nav = (typeof navigator !== "undefined" && navigator.language) || "ko";
  const code = nav.toLowerCase().slice(0, 2);
  if (CODES.includes(code)) return code;
  return "en";
}

let current = detect();
const listeners = new Set();

export function getLang() {
  return current;
}

export function setLang(code) {
  if (!CODES.includes(code) || code === current) return;
  current = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* 무시 */
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const DICT = {
  /* ── 공통 ── */
  title: { ko: "정기공연 조명", en: "Concert Lighting", zh: "定期演出灯光", ja: "定期公演 照明" },
  loading: { ko: "불러오는 중…", en: "Loading…", zh: "加载中…", ja: "読み込み中…" },
  loadFail: {
    ko: "불러오지 못했어요. 새로고침해 주세요.",
    en: "Couldn't load. Please refresh the page.",
    zh: "加载失败，请刷新页面。",
    ja: "読み込めませんでした。ページを再読み込みしてください。",
  },
  cancel: { ko: "취소", en: "Cancel", zh: "取消", ja: "キャンセル" },
  close: { ko: "닫기", en: "Close", zh: "关闭", ja: "閉じる" },
  language: { ko: "언어", en: "Language", zh: "语言", ja: "言語" },

  /* ── 팀 목록 ── */
  listHintEditing: {
    ko: "지울 팀의 ✕ 를 누르세요.",
    en: "Tap ✕ on a team to delete it.",
    zh: "点击要删除的队伍上的 ✕。",
    ja: "削除するチームの ✕ を押してください。",
  },
  listHintCount: {
    ko: "{n}팀, 공연 순서대로",
    en: "Teams: {n}, in performance order",
    zh: "{n} 支队伍，按演出顺序",
    ja: "{n}チーム、公演順",
  },
  listHintEmpty: {
    ko: "팀별로 구간마다 켤 조명을 정해요.",
    en: "Each team picks which light to use for each part of their song.",
    zh: "每支队伍为歌曲的每个段落选择灯光。",
    ja: "チームごとに、曲の区間ごとの照明を決めます。",
  },
  edit: { ko: "편집", en: "Edit", zh: "编辑", ja: "編集" },
  done: { ko: "완료", en: "Done", zh: "完成", ja: "完了" },
  exampleTile: { ko: "예시 보기", en: "See example", zh: "查看示例", ja: "例を見る" },
  exampleTileMeta: {
    ko: "이렇게 쓰면 돼요 · 음원 포함",
    en: "How to use it · with music",
    zh: "使用方法示范 · 含音乐",
    ja: "使い方の例 · 音源つき",
  },
  exampleTileAria: { ko: "완성된 예시 열기", en: "Open the finished example", zh: "打开完整示例", ja: "完成した例を開く" },
  metaOrder: { ko: "{n}번째", en: "#{n}", zh: "第{n}个", ja: "{n}番目" },
  metaChannel: { ko: "채널 {n}", en: "Ch {n}", zh: "通道 {n}", ja: "チャンネル {n}" },
  metaCues: { ko: "{n}구간", en: "{n} parts", zh: "{n} 段", ja: "{n}区間" },
  metaNoCues: { ko: "구간 없음", en: "No parts yet", zh: "暂无段落", ja: "区間なし" },
  openTeamAria: { ko: "{name} 조명 열기", en: "Open {name}", zh: "打开 {name}", ja: "{name} を開く" },
  deleteTeamAria: { ko: "{name} 삭제", en: "Delete {name}", zh: "删除 {name}", ja: "{name} を削除" },
  teamNamePh: { ko: "팀 이름", en: "Team name", zh: "队伍名称", ja: "チーム名" },
  create: { ko: "만들기", en: "Create", zh: "创建", ja: "作成" },
  addTeam: { ko: "+ 팀 추가", en: "+ Add team", zh: "+ 添加队伍", ja: "+ チーム追加" },
  thisTeam: { ko: "이 팀", en: "this team", zh: "这支队伍", ja: "このチーム" },
  confirmDeleteTeam: {
    ko: "{name}을(를) 삭제할까요? 구간도 모두 지워져요.",
    en: "Delete {name}? All of its parts will be deleted too.",
    zh: "要删除 {name} 吗？所有段落也会被删除。",
    ja: "{name} を削除しますか？区間もすべて消えます。",
  },
  addFail: { ko: "추가하지 못했어요.", en: "Couldn't add it.", zh: "添加失败。", ja: "追加できませんでした。" },
  deleteFail: { ko: "삭제하지 못했어요.", en: "Couldn't delete it.", zh: "删除失败。", ja: "削除できませんでした。" },

  /* ── 팀 화면 ── */
  back: { ko: "← 팀 목록", en: "← Teams", zh: "← 队伍列表", ja: "← チーム一覧" },
  help: { ko: "사용법 보기", en: "How to use", zh: "使用说明", ja: "使い方" },
  noticeStrong: { ko: "예시예요.", en: "This is an example.", zh: "这是示例。", ja: "これは例です。" },
  noticeRest: {
    ko: "곡 하나에 이런 식으로 구간을 나눠 조명을 정하면 돼요. ▶ 를 눌러 음악과 함께 보세요. 여기서 고친 내용은 저장되지 않고, 새로고침하면 처음으로 돌아가요.",
    en: "Split one song into parts like this and pick a light for each. Press ▶ to watch it with the music. Changes here aren't saved and reset when you refresh.",
    zh: "像这样把一首歌分成几段，为每段选择灯光即可。按 ▶ 跟着音乐看看。这里的修改不会保存，刷新后会恢复原样。",
    ja: "このように1曲を区間に分けて、区間ごとに照明を決めます。▶ を押して音楽と一緒に見てください。ここでの変更は保存されず、再読み込みすると元に戻ります。",
  },
  orderAria: { ko: "공연 순서", en: "Performance order", zh: "演出顺序", ja: "公演順" },
  teamNameAria: { ko: "팀 이름", en: "Team name", zh: "队伍名称", ja: "チーム名" },
  teamFallback: { ko: "팀", en: "Team", zh: "队伍", ja: "チーム" },
  docTitleTeam: { ko: "{name} · 조명", en: "{name} · Lighting", zh: "{name} · 灯光", ja: "{name} · 照明" },
  channelChip: { ko: "채널 {n}", en: "Channel {n}", zh: "通道 {n}", ja: "チャンネル {n}" },
  change: { ko: "바꾸기", en: "Change", zh: "更改", ja: "変更" },
  songLength: { ko: "곡 길이", en: "Length", zh: "歌曲时长", ja: "曲の長さ" },
  testAudio: { ko: "음원으로 테스트", en: "Test with music", zh: "用音乐测试", ja: "音源でテスト" },
  testAudioTitle: {
    ko: "내 기기의 음원 파일로 맞춰 보기 (서버에 올라가지 않아요)",
    en: "Try it with a music file on your device (it isn't uploaded)",
    zh: "用本机的音乐文件对一对（不会上传）",
    ja: "端末の音源ファイルで合わせてみる（アップロードされません）",
  },
  removeAudio: { ko: "테스트 음원 빼기", en: "Remove test music", zh: "移除测试音乐", ja: "テスト音源を外す" },
  stageNoLength: {
    ko: "곡 길이를 적거나 음원으로 테스트하면 미리 돌려볼 수 있어요.",
    en: "Enter the song length or test with music to preview it.",
    zh: "填写歌曲时长或用音乐测试，即可预览。",
    ja: "曲の長さを入力するか音源でテストすると、プレビューできます。",
  },
  stageNoLight: {
    ko: "이 시간에는 정해진 조명이 없어요.",
    en: "No light is set for this moment.",
    zh: "这个时间没有设定灯光。",
    ja: "この時間には照明が決まっていません。",
  },
  addFirst: {
    ko: "+ 첫 조명 정하기 (00:00부터)",
    en: "+ Set the first light (from 00:00)",
    zh: "+ 设定第一个灯光（从 00:00 开始）",
    ja: "+ 最初の照明を決める（00:00から）",
  },
  addAt: { ko: "+ {t}부터 새 조명", en: "+ New light from {t}", zh: "+ 从 {t} 开始换灯光", ja: "+ {t}から新しい照明" },
  emptyCues: {
    ko: "재생 바 아래 버튼으로 첫 조명을 정해 주세요.",
    en: "Use the button under the play bar to set the first light.",
    zh: "请用播放条下方的按钮设定第一个灯光。",
    ja: "再生バーの下のボタンで最初の照明を決めてください。",
  },
  startAria: { ko: "시작 시간", en: "Start time", zh: "开始时间", ja: "開始時間" },
  changeLightAria: {
    ko: "조명 바꾸기 (지금 {name})",
    en: "Change light (now {name})",
    zh: "更换灯光（当前 {name}）",
    ja: "照明を変える（現在 {name}）",
  },
  notePh: {
    ko: "동작이나 상황 (예: 센터가 앞으로 나오면 전환)",
    en: "Move or cue (e.g. switch when the center steps forward)",
    zh: "动作或现场提示（例：C 位走到前面时切换）",
    ja: "振りや状況（例：センターが前に出たら切り替え）",
  },
  deleteCue: { ko: "구간 삭제", en: "Delete part", zh: "删除段落", ja: "区間を削除" },
  print: { ko: "인쇄하기", en: "Print", zh: "打印", ja: "印刷" },
  deleteTeam: { ko: "팀 삭제", en: "Delete team", zh: "删除队伍", ja: "チーム削除" },
  confirmDeleteWholeTeam: {
    ko: "{name}을(를) 통째로 삭제할까요?",
    en: "Delete {name} entirely?",
    zh: "要整个删除 {name} 吗？",
    ja: "{name} をまるごと削除しますか？",
  },
  confirmDeleteCue: {
    ko: "이 구간을 삭제할까요?",
    en: "Delete this part?",
    zh: "要删除这个段落吗？",
    ja: "この区間を削除しますか？",
  },
  saving: { ko: "저장 중…", en: "Saving…", zh: "保存中…", ja: "保存中…" },
  saved: { ko: "저장됨", en: "Saved", zh: "已保存", ja: "保存しました" },
  saveFail: {
    ko: "저장 실패 — 다시 시도해 주세요.",
    en: "Couldn't save. Please try again.",
    zh: "保存失败，请重试。",
    ja: "保存できませんでした。もう一度お試しください。",
  },
  alreadyAt: {
    ko: "{t}에 이미 구간이 있어요. 조명만 바꿔 주세요.",
    en: "There's already a part at {t}. Just change its light.",
    zh: "{t} 已经有段落了，只需更换灯光。",
    ja: "{t} にはすでに区間があります。照明だけ変えてください。",
  },
  newLightFrom: { ko: "{t}부터 새 조명", en: "New light from {t}", zh: "从 {t} 开始换灯光", ja: "{t}から新しい照明" },
  notFound: { ko: "없는 팀이에요.", en: "This team doesn't exist.", zh: "找不到这支队伍。", ja: "このチームは存在しません。" },
  end: { ko: "끝", en: "end", zh: "结束", ja: "終わり" },
  play: { ko: "재생", en: "Play", zh: "播放", ja: "再生" },
  pause: { ko: "일시정지", en: "Pause", zh: "暂停", ja: "一時停止" },
  timeline: { ko: "재생 위치", en: "Playback position", zh: "播放位置", ja: "再生位置" },

  /* ── 곡 길이 먼저 ── */
  gateTitle: {
    ko: "먼저 곡 길이를 적어 주세요",
    en: "First, enter the song length",
    zh: "请先填写歌曲时长",
    ja: "まず曲の長さを入力してください",
  },
  gateBody: {
    ko: "곡 길이를 정해야 재생 바와 조명 구간을 만들 수 있어요. 분:초로 적어 주세요. 숫자만 쳐도 돼요 (345 → 03:45).",
    en: "The play bar and light parts need the song length. Enter it as min:sec. Digits are fine (345 → 03:45).",
    zh: "需要先确定歌曲时长，才能使用播放条和设定灯光段落。请按 分:秒 填写，只输入数字也可以（345 → 03:45）。",
    ja: "曲の長さを決めると、再生バーと照明の区間を作れます。分:秒で入力してください。数字だけでもOKです（345 → 03:45）。",
  },
  gateStart: { ko: "시작하기", en: "Start", zh: "开始", ja: "はじめる" },
  gateInvalid: {
    ko: "시간을 03:45 처럼 적어 주세요.",
    en: "Please enter the time like 03:45.",
    zh: "请按 03:45 这样的格式填写。",
    ja: "03:45 のように入力してください。",
  },
  gateAudioHint: {
    ko: "음원 파일이 있으면 위의 ♪ 음원으로 테스트 를 눌러도 길이가 자동으로 채워져요.",
    en: "If you have the music file, tap ♪ Test with music above and the length fills in automatically.",
    zh: "如果有音乐文件，点上面的 ♪ 用音乐测试，时长会自动填好。",
    ja: "音源ファイルがあれば、上の ♪ 音源でテスト を押しても長さが自動で入ります。",
  },

  /* ── 조명/채널 고르기 ── */
  pickLight: {
    ko: "채널 {n} 조명 고르기",
    en: "Pick a light · Channel {n}",
    zh: "选择灯光 · 通道 {n}",
    ja: "照明を選ぶ · チャンネル {n}",
  },
  pickChannel: { ko: "채널 고르기", en: "Pick a channel", zh: "选择通道", ja: "チャンネルを選ぶ" },
  selected: { ko: "선택됨", en: "Selected", zh: "已选择", ja: "選択中" },
  useChannel: { ko: "이 채널로", en: "Use this", zh: "用这个", ja: "これにする" },
  empty: { ko: "비어 있음", en: "Empty", zh: "空", ja: "空き" },
  presetN: { ko: "{n}번", en: "No. {n}", zh: "{n}号", ja: "{n}番" },
  presetEmpty: { ko: "{n}번 · 비어 있음", en: "No. {n} · Empty", zh: "{n}号 · 空", ja: "{n}番 · 空き" },
  presetAlt: { ko: "채널 {c} {name}", en: "Channel {c} {name}", zh: "通道 {c} {name}", ja: "チャンネル {c} {name}" },
  psyche: { ko: "사이키", en: "Strobe", zh: "频闪", ja: "ストロボ" },

  /* ── 사용법 안내 ── */
  tourSkip: { ko: "건너뛰기", en: "Skip", zh: "跳过", ja: "スキップ" },
  tourPrev: { ko: "이전", en: "Back", zh: "上一步", ja: "戻る" },
  tourNext: { ko: "다음", en: "Next", zh: "下一步", ja: "次へ" },
  tourStart: { ko: "시작하기", en: "Start", zh: "开始", ja: "はじめる" },
  tour0Title: { ko: "조명 큐시트 사용법", en: "How the lighting sheet works", zh: "灯光表使用方法", ja: "照明シートの使い方" },
  tour0Body: {
    ko: "우리 팀 곡에서 언제 어떤 조명을 켤지 정하는 화면이에요. 1분이면 끝나요.",
    en: "Here you decide which light goes on at each moment of your team's song. It takes about a minute.",
    zh: "在这里决定你们队伍的歌曲在什么时候开什么灯。1 分钟就能完成。",
    ja: "チームの曲で、いつどの照明をつけるかを決める画面です。1分で終わります。",
  },
  tour1Title: { ko: "1. 채널 고르기", en: "1. Pick a channel", zh: "1. 选择通道", ja: "1. チャンネルを選ぶ" },
  tour1Body: {
    ko: "우리 팀이 쓸 조명 채널을 골라요. 누르면 채널마다 조명이 어떻게 생겼는지 모두 볼 수 있어요.",
    en: "Choose the lighting channel your team will use. Tap it to see what every light in each channel looks like.",
    zh: "选择你们队伍使用的灯光通道。点开就能看到每个通道里所有灯光的样子。",
    ja: "チームで使う照明チャンネルを選びます。押すと、チャンネルごとの照明をすべて見られます。",
  },
  tour2Title: { ko: "2. 곡 길이 또는 음원", en: "2. Song length or music", zh: "2. 歌曲时长或音乐", ja: "2. 曲の長さまたは音源" },
  tour2Body: {
    ko: "곡 길이를 적으면 그 길이만큼 재생해 볼 수 있어요. 음원 파일로 테스트하면 실제 음악에 맞춰 볼 수 있어요. 음원은 내 기기에서만 재생돼요.",
    en: "Enter the song length to play through it as a timer, or test with a music file to follow the real song. The music only plays on your device.",
    zh: "填写歌曲时长就能按时长播放；用音乐文件测试就能对着真实音乐看。音乐只在你的设备上播放。",
    ja: "曲の長さを入れるとその長さで再生できます。音源ファイルでテストすると実際の音楽に合わせて見られます。音源は自分の端末でだけ再生されます。",
  },
  tour3Title: { ko: "3. 재생하고 위치 옮기기", en: "3. Play and move around", zh: "3. 播放和移动位置", ja: "3. 再生と位置の移動" },
  tour3Body: {
    ko: "▶ 로 재생하고, 아래 조명 바를 누르거나 끌어서 원하는 시간으로 옮겨요. 조명이 바뀌는 구간이 사진 블록으로 보여요.",
    en: "Press ▶ to play, and tap or drag the light bar below to jump to any time. Each part shows up as a photo block.",
    zh: "按 ▶ 播放，点击或拖动下面的灯光条移动到想要的时间。每个段落会显示为照片块。",
    ja: "▶ で再生し、下の照明バーを押すかドラッグして好きな時間に移動します。区間は写真のブロックで表示されます。",
  },
  tour4Title: { ko: "4. 조명 추가", en: "4. Add a light", zh: "4. 添加灯光", ja: "4. 照明を追加" },
  tour4Body: {
    ko: "조명이 바뀌어야 하는 순간에 이 버튼을 누르세요. 그 시간부터 곡 끝까지 새 조명으로 바뀌고, 바로 조명을 고르는 창이 떠요. 처음 누르면 00:00부터 시작해요.",
    en: "Press this at the moment the light should change. From that time to the end becomes the new light, and the light picker opens right away. The first press starts at 00:00.",
    zh: "在需要换灯的那一刻按这个按钮。从那个时间到歌曲结束都会换成新灯光，并马上弹出选灯窗口。第一次按会从 00:00 开始。",
    ja: "照明を変えたい瞬間にこのボタンを押してください。その時間から曲の終わりまで新しい照明になり、すぐに照明を選ぶ画面が開きます。最初に押すと00:00から始まります。",
  },
  tour5Title: { ko: "5. 구간 다듬기", en: "5. Fine-tune parts", zh: "5. 调整段落", ja: "5. 区間を整える" },
  tour5Body: {
    ko: "사진을 누르면 조명을 바꿀 수 있고, 옆 칸에는 동작이나 상황을 적어요 (예: 센터가 앞으로 나오면 전환). 시작 시간은 숫자만 쳐도 돼요 (130 → 01:30).",
    en: "Tap a photo to change its light, and write the move or cue next to it (e.g. switch when the center steps forward). For the start time you can just type digits (130 → 01:30).",
    zh: "点照片可以换灯光，旁边写上动作或现场提示（例：C 位走到前面时切换）。开始时间只输入数字也可以（130 → 01:30）。",
    ja: "写真を押すと照明を変えられ、横の欄には振りや状況を書きます（例：センターが前に出たら切り替え）。開始時間は数字だけでもOKです（130 → 01:30）。",
  },
  tour6Title: { ko: "끝!", en: "That's it!", zh: "完成！", ja: "おわり！" },
  tour6Body: {
    ko: "입력은 모두 자동 저장돼요. 오른쪽 위 ? 를 누르면 이 안내를 다시 볼 수 있어요.",
    en: "Everything saves automatically. Tap ? at the top right to see this guide again.",
    zh: "所有输入都会自动保存。点右上角的 ? 可以再看一遍这个说明。",
    ja: "入力はすべて自動で保存されます。右上の ? を押すと、この案内をもう一度見られます。",
  },
};

/** 문구 꺼내기. 없으면 한국어, 그것도 없으면 키 그대로 */
export function translate(lang, key, vars) {
  const entry = DICT[key];
  let text = entry ? entry[lang] ?? entry.ko : key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.split(`{${k}}`).join(String(v));
    });
  }
  return text;
}

/** 지금 언어로 바로 꺼내기 (컴포넌트 밖에서 쓸 때) */
export function tr(key, vars) {
  return translate(current, key, vars);
}

/** 컴포넌트에서: const { t, lang, setLang } = useLighting18n() — 언어를 바꾸면 다시 그려진다 */
export function useLightingI18n() {
  const lang = useSyncExternalStore(subscribe, getLang, getLang);
  return { lang, setLang, t: (key, vars) => translate(lang, key, vars) };
}
