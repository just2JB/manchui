import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IoChevronForward, IoNotificationsOutline } from "react-icons/io5";
import { useAuth } from "../../context/AuthContext";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import ClubPageSkeleton from "./ClubPageSkeleton";
import { filterVisibleReservations } from "./Reservation/reservationRetention";
import { useReservationNow } from "./Reservation/useReservationLiveSync";
import { formatReservationTimeRange } from "./Reservation/reservationTimeFormat";
import {
  WEEK_LABELS,
  formatDateKey,
  formatPracticeTimeDisplay,
  formatUpcomingPracticeDate,
} from "./Team/teamCalendarUtils";
import {
  formatPollDatesSummary,
  getPollDisplayTitle,
} from "./Poll/pollUtils";
import ClubHomeCalendar from "./Home/ClubHomeCalendar";
import ClubHomePracticeCarousel from "./Home/ClubHomePracticeCarousel";
import "./Home/ClubHomeLayout.css";
import "./Home/ClubHomeDark.css";
import {
  buildPracticeByDate,
  buildReservationByDate,
  getHomeUpcomingPractices,
  getUpcomingReservations,
} from "./Home/clubHomeUtils";
import {
  emptyReservationsMine,
  isClubInitialLoading,
  useInvalidateClubHome,
  useMyOpenPollsQuery,
  useMyReservationsQuery,
  usePracticesQuery,
  useUserTeamsQuery,
} from "../../queries/useClubQueries";
import { toVisibleTeamColor } from "./Team/teamColorPresets";
import "./Home/ClubHome.css";
import "./Poll/Poll.css";

const EMPTY_LIST = [];


function dDay(fromKey, toKey) {
  const [a, b] = [fromKey, toKey].map(key => new Date(key + "T00:00"));
  return Math.round((b - a) / 86400000);
}

function formatDDay(fromKey, toKey) {
  const diff = dDay(fromKey, toKey);
  return diff === 0 ? "D-DAY" : `D-${diff}`;
}

function formatRelativeDay(fromKey, toKey) {
  const diff = dDay(fromKey, toKey);
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  if (diff === 2) return "모레";
  return formatUpcomingPracticeDate(toKey);
}

function formatLongDate(key) {
  const date = new Date(key + "T00:00");
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEK_LABELS[date.getDay()]}요일`;
}

function formatPlace(place) {
  const value = String(place ?? "").trim();
  return value || "미확정";
}

const ClubRoom = () => {
  const { user } = useAuth();
  const modal = useManchuiModal();
  const userId = user?._id;
  const [selected, setSelected] = useState(() => formatDateKey(new Date()));

  const teamsQuery = useUserTeamsQuery(userId);
  const teams = teamsQuery.data?.teams ?? [];
  const practicesQuery = usePracticesQuery(userId, teams);
  const openPollsQuery = useMyOpenPollsQuery(userId);
  const reservationsQuery = useMyReservationsQuery(userId);

  const invalidateHome = useInvalidateClubHome(userId);
  useRefreshOnFocus(invalidateHome);

  // 홈에 들어올 때마다 한 번 새로 불러온다.
  // 처음 열 때(아직 받은 데이터가 없을 때)는 이미 불러오는 중이라 건너뛴다.
  const hadCachedDataRef = useRef(teamsQuery.dataUpdatedAt > 0);
  useEffect(() => {
    if (!userId || !hadCachedDataRef.current) return;
    invalidateHome();
  }, [userId, invalidateHome]);

  const practices = practicesQuery.data ?? EMPTY_LIST;
  const openPolls = openPollsQuery.data ?? EMPTY_LIST;
  const reservations =
    reservationsQuery.data?.reservations ??
    emptyReservationsMine().reservations;

  const showLoading =
    !userId
      ? false
      : isClubInitialLoading(teamsQuery) ||
        isClubInitialLoading(practicesQuery) ||
        isClubInitialLoading(openPollsQuery) ||
        isClubInitialLoading(reservationsQuery);

  const now = useReservationNow();

  /** 날짜 → 그 날짜를 후보로 둔 진행 중 투표 */
  const pollsByDate = useMemo(() => {
    const map = new Map();
    for (const poll of openPolls) {
      for (const date of poll.dates ?? []) {
        if (!map.has(date)) map.set(date, []);
        map.get(date).push(poll);
      }
    }
    return map;
  }, [openPolls]);


  const practiceByDate = useMemo(
    () => buildPracticeByDate(practices),
    [practices],
  );

  const visibleReservations = useMemo(
    () => filterVisibleReservations(reservations, now),
    [reservations, now],
  );

  const reservationByDate = useMemo(
    () => buildReservationByDate(visibleReservations),
    [visibleReservations],
  );

  const upcomingPractices = useMemo(
    () => getHomeUpcomingPractices(practices, { limit: 0 }),
    [practices],
  );

  const upcomingReservations = useMemo(
    () => getUpcomingReservations(visibleReservations, now).slice(0, 5),
    [visibleReservations, now],
  );

  if (showLoading) {
    return (
      <div className="clubHome dHome">
        <ClubPageSkeleton variant="home" />
      </div>
    );
  }

  const todayKey = formatDateKey(now);
  const pendingPolls = openPolls.filter(poll => !poll.responded);
  const sortedPolls = [...pendingPolls, ...openPolls.filter(poll => poll.responded)];
  const dayEntries = [
    ...(practiceByDate.get(selected) ?? []).map(p => ({
      key: "practice-" + (p._id ?? p.time), kind: "연습", title: p.teamName ?? "팀",
      detail: formatPlace(p.place), time: formatPracticeTimeDisplay(p.time), color: p.teamColor,
    })),
    ...(reservationByDate.get(selected) ?? []).map(r => ({
      key: "reservation-" + r._id, kind: "예약", title: "동아리방 예약",
      detail: r.teamName ?? "동아리방", time: formatReservationTimeRange(r.time),
    })),
  ].sort((a, b) => a.time.localeCompare(b.time, "ko", { numeric: true }));
  const dayPolls = pollsByDate.get(selected) ?? EMPTY_LIST;

  return (
    <div className="clubHome dHome">
      <header className="dHome__head">
        {/* 머리말은 날짜 한 줄만 (화면 제목은 숨김 제목으로) */}
        <h1 className="dHome__srTitle">홈</h1>
        <p className="dHome__today">{formatLongDate(todayKey)}</p>
        {/* 알림: 푸시 알림 서비스를 붙이면 목록·안 읽음 표시(data-unread)를 연결 */}
        <button type="button" className="dHome__bell" aria-label="알림"
          onClick={() => void modal("알림 기능은 준비 중이에요.")}>
          <IoNotificationsOutline aria-hidden="true" />
        </button>
      </header>

      <div className="dHome__main">
<ClubHomePracticeCarousel
          practices={upcomingPractices}
          teamsCount={teams.length}
          formatWhen={(dateKey) => formatRelativeDay(todayKey, dateKey)}
          formatTime={formatPracticeTimeDisplay}
          formatPlace={formatPlace}
        />

        <section className="dCard dCard--calendar" aria-label="캘린더">
          <ClubHomeCalendar selected={selected} onSelect={setSelected} practiceByDate={practiceByDate}
            reservationByDate={reservationByDate} pollsByDate={pollsByDate} />
          <div className="dAgenda">
            <h2 className="dAgenda__title">{selected === todayKey ? "오늘" : formatUpcomingPracticeDate(selected)}</h2>
            {dayEntries.length + dayPolls.length === 0
              ? <p className="dAgenda__empty">일정이 없어요</p>
              : <ul className="dAgenda__list">
                {dayEntries.map(entry => <li key={entry.key} style={entry.color ? { "--team": entry.color } : undefined}
                  data-kind={entry.kind}>
                  <i aria-hidden="true" />
                  <div><strong>{entry.title}</strong><small>{entry.kind} · {entry.detail}</small></div>
                  <time>{entry.time}</time>
                </li>)}
                {dayPolls.map(poll => <li key={poll._id} data-kind="투표"
                  style={poll.team?.teamColor ? { "--team": toVisibleTeamColor(poll.team.teamColor) } : undefined}>
                  <i aria-hidden="true" />
                  <div>
                    <strong><Link to={`/club/poll/${poll._id}`}>{getPollDisplayTitle(poll)}</Link></strong>
                    <small>{poll.team?.name ?? "팀"} · 일정 종합 후보일</small>
                  </div>
                  <time>{poll.responded ? "응답함" : "미응답"}</time>
                </li>)}
              </ul>}
          </div>
        </section>
      </div>

      <aside className="dHome__side">
        <section className="dCard" aria-labelledby="dtodo-title">
          <h2 id="dtodo-title" className="dCard__title">
            할 일 {pendingPolls.length > 0 && <span className="dBadge">{pendingPolls.length}</span>}
          </h2>
          {sortedPolls.length === 0
            ? <p className="dCard__empty">응답할 일정 종합이 없어요</p>
            : <ul className="dList">
              {sortedPolls.map(poll => <li key={poll._id}>
                <Link to={`/club/poll/${poll._id}`} className="dList__row" data-done={poll.responded || undefined}
                  style={poll.team?.teamColor ? { "--team": toVisibleTeamColor(poll.team.teamColor) } : undefined}>
                  <span className="dList__mark" aria-hidden="true" />
                  <span className="dList__body">
                    <strong>{getPollDisplayTitle(poll)}</strong>
                    <small>{poll.team?.name ?? "팀"} · {formatPollDatesSummary(poll.dates)} · {poll.responseCount}명 응답</small>
                  </span>
                  <span className="dList__action">{poll.responded ? "수정" : "응답"}<IoChevronForward aria-hidden="true" /></span>
                </Link>
              </li>)}
            </ul>}
        </section>

        <section className="dCard" aria-labelledby="dres-title">
          <h2 id="dres-title" className="dCard__title">
            내 예약
            <Link className="dCard__more" to="/club/mypage/reservations">전체</Link>
          </h2>
          {upcomingReservations.length === 0
            ? <p className="dCard__empty">예약이 없어요 · <Link to="/club/reservation">예약하기</Link></p>
            : <ul className="dList">
              {upcomingReservations.map(reservation => <li key={reservation._id} className="dList__row dList__row--static">
                <span className="dList__date">
                  <b>{Number(reservation.dateKey.slice(8))}</b>
                  <small>{WEEK_LABELS[new Date(reservation.dateKey + "T00:00").getDay()]}</small>
                </span>
                <span className="dList__body">
                  <strong>{formatReservationTimeRange(reservation.time)}</strong>
                  <small>{reservation.teamName ?? "팀"}{reservation.headcount != null ? ` · ${reservation.headcount}명` : ""}</small>
                </span>
                <span className="dList__tag" data-today={dDay(todayKey, reservation.dateKey) === 0 || undefined}>
                  {dDay(todayKey, reservation.dateKey) <= 2 ? formatRelativeDay(todayKey, reservation.dateKey) : formatDDay(todayKey, reservation.dateKey)}
                </span>
              </li>)}
            </ul>}
        </section>
      </aside>
    </div>
  );
};

export default ClubRoom;
