import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoArchiveOutline,
  IoCalendarOutline,
  IoChevronForward,
  IoClipboardOutline,
  IoGiftOutline,
  IoPin,
  IoMusicalNotesOutline,
  IoPeopleOutline,
  IoPeopleCircleOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import apiClient, { serverUrl } from "../../api/apiClient";
import { authRequestConfig } from "../../api/tokenStorage";
import { useAuth } from "../../context/AuthContext";
import { fetchAllReservations } from "../../queries/clubFetchers";
import { formatPracticeTimeShort, normalizeDateKey } from "../ClubRoom/Team/teamCalendarUtils";
import { toVisibleTeamColor } from "../ClubRoom/Team/teamColorPresets";
import "./AdminHome.css";

const MENU = [
  { to: "/admin/team", label: "팀 관리", desc: "팀 · 연습실 예약 · 결산", Icon: IoPeopleCircleOutline },
  { to: "/admin/join", label: "가입 신청", desc: "신청 확인 · 상태 · 모집 기수", Icon: IoClipboardOutline },
  { to: "/admin/reservation", label: "동방 예약", desc: "동아리방 예약 · 건수 제한", Icon: IoCalendarOutline },
  { to: "/admin/member", label: "부원", desc: "직책 · 탈퇴 처리", Icon: IoPeopleOutline },
  { to: "/admin/recommendation", label: "곡 추천", desc: "추천곡 관리", Icon: IoMusicalNotesOutline },
  { to: "/admin/lottery", label: "상품 추첨", desc: "상품 · 참여자 · 추첨", Icon: IoGiftOutline },
  { to: "/admin/setting", label: "웹 설정", desc: "사이트 · 어시스턴트 설정", Icon: IoSettingsOutline },
  { to: "/admin/archive", label: "아카이브", desc: "행사별 공지 보관 · 검색", Icon: IoArchiveOutline },
];

const pad = (n) => String(n).padStart(2, "0");
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const isUnsetPlace = (place) => {
  const value = String(place ?? "").trim();
  return !value || value === "미확정";
};
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 홈 요약: 각 요청은 따로 실패해도 나머지는 보이게 */
const useHomeSummary = (userId) => {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    if (!serverUrl) return undefined;
    let alive = true;
    const pick = (r, fn) => (r.status === "fulfilled" ? fn(r.value) : null);
    Promise.allSettled([
      apiClient.get("/api/join/config"),
      userId ? apiClient.get(`/api/join/${userId}`, { withCredentials: true }) : Promise.reject(),
      fetchAllReservations(),
      apiClient.get("/api/team/admin/practices", authRequestConfig()),
      apiClient.get("/api/auth/admin/members", authRequestConfig()),
    ]).then(([config, join, reservations, practicesRes, members]) => {
      if (!alive) return;
      const cfg = pick(config, (r) => r.data);
      const gen = Number(cfg?.currentGeneration) || 1;
      const joinList = pick(join, (r) => (Array.isArray(r.data?.joinData) ? r.data.joinData : []));
      const thisGen = joinList?.filter(
        (d) => d.generation === gen || (d.generation == null && gen === 1),
      );
      const today = dateKey(new Date());
      const resList = pick(reservations, (r) => r);
      const memberList = pick(members, (r) => (Array.isArray(r.data?.members) ? r.data.members : []));
      // 앞으로의 연습: 장소 미정 개수, 고정한 팀별 요약
      const practiceData = pick(practicesRes, (r) => r.data);
      const upcoming = (Array.isArray(practiceData?.practices) ? practiceData.practices : [])
        .map((p) => ({ ...p, dateKey: normalizeDateKey(p.date) }))
        .filter((p) => p.dateKey && p.dateKey >= today)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || String(a.time).localeCompare(String(b.time)));
      const pinnedIds = Array.isArray(practiceData?.pinnedTeamIds) ? practiceData.pinnedTeamIds : [];
      const pinnedTeams = pinnedIds
        .filter((id) => !practiceData?.teams || practiceData.teams.some((t) => t._id === id))
        .map((id) => {
        const list = upcoming.filter((p) => p.teamId === id);
        const team = (practiceData?.teams ?? []).find((t) => t._id === id);
        return {
          id,
          name: team?.name ?? list[0]?.teamName ?? "팀",
          color: toVisibleTeamColor(team?.teamColor ?? list[0]?.teamColor),
          unset: list.filter((p) => isUnsetPlace(p.place)).length,
          total: list.length,
          next: list[0] ?? null,
        };
      });
      setSummary({
        formOpen: cfg ? Boolean(cfg.formOpen) : null,
        generation: gen,
        joinTotal: thisGen?.length ?? null,
        joinNew: thisGen?.filter((d) => (d.status || "신청") === "신청").length ?? null,
        todayRes: resList?.filter((r) => r.date === today) ?? null,
        upcomingRes: resList?.filter((r) => r.date >= today).length ?? null,
        unsetPractices: practiceData ? upcoming.filter((p) => isUnsetPlace(p.place)).length : null,
        upcomingPractices: practiceData ? upcoming.length : null,
        pinnedTeams: practiceData ? pinnedTeams : null,
        members: memberList?.length ?? null,
        execs: memberList?.filter((m) => m.position === "임원진").length ?? null,
      });
    });
    return () => {
      alive = false;
    };
  }, [userId]);
  return summary;
};

const Stat = ({ to, label, value, sub, accent }) => (
  <Link to={to} className={`adminHome__stat${accent ? " adminHome__stat--accent" : ""}`}>
    <span className="adminHome__statLabel">{label}</span>
    <span className="adminHome__statValue">{value ?? "—"}</span>
    {sub ? <span className="adminHome__statSub">{sub}</span> : null}
  </Link>
);

const AdminHome = () => {
  const { user } = useAuth();
  const s = useHomeSummary(user?._id);
  const now = new Date();
  const todayLabel = now.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const todayRes = s?.todayRes ?? null;

  return (
    <div className="adminHome">
      <header className="adminHome__head">
        <p className="adminHome__date">{todayLabel}</p>
        <h1 className="admin-page-heading adminHome__title">
          {user?.username ? `${user.username}님, 안녕하세요` : "관리자 홈"}
        </h1>
      </header>

      {/* 한눈에: 숫자 카드 (누르면 해당 화면) */}
      <section className="adminHome__stats" aria-label="요약">
        <Stat
          to="/admin/join"
          label="가입 신청"
          value={s?.joinNew != null ? `${s.joinNew}건` : null}
          sub={
            s
              ? `${s.formOpen ? `${s.generation}기 모집 중` : "모집 닫힘"}${s.joinTotal != null ? ` · 전체 ${s.joinTotal}명` : ""}`
              : "불러오는 중…"
          }
          accent={Boolean(s?.joinNew)}
        />
        <Stat
          to="/admin/reservation"
          label="오늘 동방 예약"
          value={todayRes ? `${todayRes.length}건` : null}
          sub={s?.upcomingRes != null ? `오늘 포함 예정 ${s.upcomingRes}건` : s ? null : "불러오는 중…"}
        />
        <Stat
          to="/admin/team?view=places"
          label="연습실 미정"
          value={s?.unsetPractices != null ? `${s.unsetPractices}개` : null}
          sub={s?.upcomingPractices != null ? `다가오는 연습 ${s.upcomingPractices}개` : s ? null : "불러오는 중…"}
          accent={Boolean(s?.unsetPractices)}
        />
        <Stat
          to="/admin/member"
          label="부원"
          value={s?.members != null ? `${s.members}명` : null}
          sub={s?.execs != null ? `임원진 ${s.execs}명` : s ? null : "불러오는 중…"}
        />
      </section>

      <div className="adminHome__grid">
        {/* 왼쪽: 메뉴 / 오른쪽: 고정한 팀 · 오늘 동방 예약 */}
        <div className="adminHome__col">
        {/* 메뉴 */}
        <nav className="adminHome__menu" aria-label="관리 메뉴">
          {MENU.map(({ to, label, desc, Icon }) => (
            <Link key={to} to={to} className="adminHome__menuItem">
              <Icon className="adminHome__menuIcon" aria-hidden />
              <span className="adminHome__menuText">
                <span className="adminHome__menuLabel">{label}</span>
                <span className="adminHome__menuDesc">{desc}</span>
              </span>
              <IoChevronForward className="adminHome__menuArrow" aria-hidden />
            </Link>
          ))}
        </nav>
        </div>

        <div className="adminHome__col">
        {/* 고정한 팀: 장소 미정 연습 개수 · 다음 연습 */}
        <section className="adminHome__panel" aria-labelledby="admin-home-pinned">
          <div className="adminHome__panelHead">
            <h2 id="admin-home-pinned" className="adminHome__panelTitle">
              고정한 팀
            </h2>
            <Link to="/admin/team?view=places" className="adminHome__more">
              연습실 예약 <IoChevronForward aria-hidden />
            </Link>
          </div>
          {!s ? (
            <p className="adminHome__empty">불러오는 중…</p>
          ) : !s.pinnedTeams || s.pinnedTeams.length === 0 ? (
            <p className="adminHome__empty">
              팀 관리에서 <IoPin aria-hidden /> 를 눌러 자주 보는 팀을 고정해 보세요.
            </p>
          ) : (
            <ul className="adminHome__pinList">
              {s.pinnedTeams.map((team) => {
                const next = team.next;
                const nextLabel = next
                  ? (() => {
                      const [, m, d] = next.dateKey.split("-").map(Number);
                      const week = WEEK[new Date(next.dateKey + "T00:00").getDay()];
                      return `${m}/${d}(${week}) ${formatPracticeTimeShort(next.time)}`;
                    })()
                  : "잡힌 연습 없음";
                return (
                  <li key={team.id}>
                    <Link to="/admin/team?view=places" className="adminHome__pinItem" style={{ "--team": team.color }}>
                      <i aria-hidden />
                      <span className="adminHome__pinText">
                        <strong>{team.name}</strong>
                        <small>다음 {nextLabel}</small>
                      </span>
                      <span className="adminHome__pinCount" data-zero={team.unset === 0 || undefined}>
                        {team.unset > 0 ? `미정 ${team.unset}` : "모두 배정"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 오늘 동방 예약 */}
        <section className="adminHome__panel" aria-labelledby="admin-home-today">
          <div className="adminHome__panelHead">
            <h2 id="admin-home-today" className="adminHome__panelTitle">
              오늘 동방 예약
            </h2>
            <Link to="/admin/reservation" className="adminHome__more">
              동방 예약 <IoChevronForward aria-hidden />
            </Link>
          </div>
          {!s ? (
            <p className="adminHome__empty">불러오는 중…</p>
          ) : !todayRes || todayRes.length === 0 ? (
            <p className="adminHome__empty">오늘 예약이 없어요.</p>
          ) : (
            <ul className="adminHome__resList">
              {[...todayRes]
                .sort((a, b) => Math.min(...a.time) - Math.min(...b.time))
                .map((r) => {
                  const hours = [...(r.time ?? [])].sort((a, b) => a - b);
                  const start = hours[0];
                  const end = hours[hours.length - 1] + 1;
                  return (
                    <li key={r._id} className="adminHome__resItem">
                      <span className="adminHome__resTime">
                        {pad(start)}:00 – {pad(end)}:00
                      </span>
                      <span className="adminHome__resTeam">{r.teamName || "—"}</span>
                      {r.headcount ? (
                        <span className="adminHome__resCount">{r.headcount}명</span>
                      ) : null}
                    </li>
                  );
                })}
            </ul>
          )}
        </section>

        </div>
      </div>
    </div>
  );
};

export default AdminHome;
