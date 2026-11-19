import {
  RiHomeLine,
  RiHomeFill,
  RiGroupLine,
  RiGroupFill,
  RiCalendarLine,
  RiCalendarFill,
  RiAlbumLine,
  RiAlbumFill,
  RiUserLine,
  RiUserFill,
} from "react-icons/ri";

/**
 * 클럽룸 내비게이션 아이콘 (Remix Icon).
 * 모서리가 덜 둥근 기하적인 세트. active 는 채움, idle 은 선.
 * 크기는 font-size(1em)를 따른다.
 */
const ICONS = {
  home: [RiHomeLine, RiHomeFill],
  team: [RiGroupLine, RiGroupFill],
  reservation: [RiCalendarLine, RiCalendarFill],
  recommend: [RiAlbumLine, RiAlbumFill], // 레코드판
  mypage: [RiUserLine, RiUserFill],
};

export function ClubNavIcon({ name, active = false, ...rest }) {
  const pair = ICONS[name];
  if (!pair) return null;
  const Icon = active ? pair[1] : pair[0];
  return <Icon aria-hidden="true" focusable="false" {...rest} />;
}
