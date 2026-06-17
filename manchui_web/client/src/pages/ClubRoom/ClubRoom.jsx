import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiClient, { serverUrl } from "../../api/apiClient";
import {
  fetchMyScheduleRequests,
  fetchMySchedules,
} from "../../api/scheduleApi";
import { useAuth } from "../../context/AuthContext";
import Loading from "../../components/Loading/Loading";
import { parseMineResponse } from "./Reservation/reservationMine";
import { filterVisibleReservations } from "./Reservation/reservationRetention";
import {
  useReservationNow,
  useReservationRefreshOnFocus,
} from "./Reservation/useReservationLiveSync";
import { formatReservationTimeRange } from "./Reservation/reservationTimeFormat";
import {
  formatPracticeTimeDisplay,
  formatUpcomingPracticeDate,
  normalizeDateKey,
} from "./Team/teamCalendarUtils";
import ClubHomeCalendar from "./Home/ClubHomeCalendar";
import ClubHomeScheduleSheet from "./Home/ClubHomeScheduleSheet";
import {
  buildPracticeByDate,
  buildReservationByDate,
  buildUserScheduleMap,
  enrichPracticesWithTeam,
  flattenRequestDates,
  getHomeUpcomingPractices,
  getUpcomingReservations,
} from "./Home/clubHomeUtils";
import "./Home/ClubHome.css";

function formatPlace(place) {
  const value = String(place ?? "").trim();
  return value || "미확정";
}

const ClubRoom = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [practices, setPractices] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [userSchedules, setUserSchedules] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [sheetDateKey, setSheetDateKey] = useState(null);

  const loadHome = useCallback(async () => {
    if (!user?._id) {
      setTeams([]);
      setPractices([]);
      setTeamRequests([]);
      setUserSchedules([]);
      setReservations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [teamsRes, schedules, teamRequests, reservationsRes] =
        await Promise.all([
          apiClient.get(`/api/team/user/${user._id}`, { withCredentials: true }),
          fetchMySchedules(),
          fetchMyScheduleRequests(),
          serverUrl
            ? apiClient.get("/api/reservation/mine", { withCredentials: true })
            : Promise.resolve({ data: { reservations: [] } }),
        ]);

      const nextTeams = Array.isArray(teamsRes.data?.myTeam)
        ? teamsRes.data.myTeam
        : [];

      const practiceResponses = await Promise.all(
        nextTeams.map((team) =>
          apiClient
            .get(`/api/practice/teamPractice/${team._id}`, {
              withCredentials: true,
            })
            .then((res) => ({
              team,
              list: Array.isArray(res.data?.teamPractice)
                ? res.data.teamPractice
                : [],
            }))
            .catch(() => ({ team, list: [] })),
        ),
      );

      let nextPractices = practiceResponses.flatMap(({ team, list }) =>
        list.map((practice) => ({
          ...practice,
          teamId: String(team._id),
          teamName: team.name,
          teamColor: team.teamColor,
        })),
      );
      nextPractices = enrichPracticesWithTeam(nextPractices, nextTeams);

      setTeams(nextTeams);
      setPractices(nextPractices);
      setTeamRequests(teamRequests);
      setUserSchedules(schedules);
      const { reservations: mine } = parseMineResponse(reservationsRes.data);
      setReservations(mine);
    } catch (error) {
      console.error(error);
      setTeams([]);
      setPractices([]);
      setTeamRequests([]);
      setUserSchedules([]);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  const now = useReservationNow();
  useReservationRefreshOnFocus(loadHome);

  const requestByDate = useMemo(
    () => flattenRequestDates(teamRequests),
    [teamRequests],
  );

  const scheduleMap = useMemo(
    () => buildUserScheduleMap(userSchedules),
    [userSchedules],
  );

  const scheduleDateSet = useMemo(
    () => new Set(scheduleMap.keys()),
    [scheduleMap],
  );

  const requestDateSet = useMemo(
    () => new Set(requestByDate.keys()),
    [requestByDate],
  );

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
    () => getHomeUpcomingPractices(practices, { limit: 8 }),
    [practices],
  );

  const upcomingReservations = useMemo(
    () => getUpcomingReservations(visibleReservations, now).slice(0, 5),
    [visibleReservations, now],
  );

  const refreshSchedules = useCallback(async () => {
    if (!user?._id) return;
    try {
      const [schedules, teamRequests] = await Promise.all([
        fetchMySchedules(),
        fetchMyScheduleRequests(),
      ]);
      setUserSchedules(schedules);
      setTeamRequests(teamRequests);
    } catch (error) {
      console.error(error);
    }
  }, [user?._id]);

  const handleScheduleSaved = (dateKey, schedule) => {
    setUserSchedules((prev) => {
      const next = prev.filter(
        (item) => normalizeDateKey(item.date) !== dateKey,
      );
      if (schedule && schedule.category !== "temp") {
        next.push(schedule);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="clubHome">
        <Loading />
      </div>
    );
  }

  const username = user?.username ?? "회원";

  return (
    <div className="clubHome">
      <header className="clubHome__hero">
        <h1 className="clubHome__greeting">안녕하세요, {username}님</h1>
        <p className="clubHome__sub">
          연습·일정 취합·동아리방 예약을 한곳에서 확인하세요.
        </p>
      </header>

      <section className="clubHome__block" aria-labelledby="club-home-upcoming">
        <h2 id="club-home-upcoming" className="clubHome__blockTitle">
          다가오는 연습
        </h2>
        {upcomingPractices.length === 0 ? (
          <p className="clubHome__empty">
            예정된 연습이 없습니다.
            {teams.length === 0 ? (
              <>
                {" "}
                <Link className="clubHome__linkBtn" to="/club/team">
                  팀 만들기
                </Link>
              </>
            ) : null}
          </p>
        ) : (
          <div className="clubHome__trackWrap">
            <ul className="clubHome__track" aria-label="다가오는 연습 목록">
              {upcomingPractices.map((practice, index) => {
                const key =
                  practice._id ??
                  `${practice.dateKey}-${practice.time}-${index}`;
                return (
                  <li
                    key={key}
                    className={`clubHome__practiceCard${index === 0 ? " clubHome__practiceCard--next" : ""}`}
                    style={{ "--item-accent": practice.teamColor }}
                  >
                    <span className="clubHome__practiceTeam">
                      {practice.teamName}
                    </span>
                    <span className="clubHome__practiceDate">
                      {formatUpcomingPracticeDate(practice.dateKey)}
                    </span>
                    <span className="clubHome__practiceTime">
                      {formatPracticeTimeDisplay(practice.time)}
                    </span>
                    <span className="clubHome__practicePlace">
                      {formatPlace(practice.place)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="clubHome__block" aria-labelledby="club-home-calendar">
        <h2 id="club-home-calendar" className="clubHome__blockTitle">
          캘린더
        </h2>
        <ClubHomeCalendar
          practiceByDate={practiceByDate}
          scheduleDateSet={scheduleDateSet}
          requestDateSet={requestDateSet}
          onDateSelect={setSheetDateKey}
        />
      </section>

      <section
        className="clubHome__block"
        aria-labelledby="club-home-reservations"
      >
        <h2 id="club-home-reservations" className="clubHome__blockTitle">
          내 예약 (동아리방)
        </h2>
        {upcomingReservations.length === 0 ? (
          <p className="clubHome__empty">
            예약 내역이 없습니다.{" "}
            <Link className="clubHome__linkBtn" to="/club/reservation">
              동아리방 예약하기
            </Link>
          </p>
        ) : (
          <>
            <ul className="clubHome__reservationList">
              {upcomingReservations.map((reservation) => (
                <li key={reservation._id} className="clubHome__reservationItem">
                  <span className="clubHome__reservationDate">
                    {formatUpcomingPracticeDate(reservation.dateKey)}
                  </span>
                  <span className="clubHome__reservationTime">
                    {formatReservationTimeRange(reservation.time)}
                  </span>
                  <span className="clubHome__reservationMeta">
                    연락처 {reservation.agentId ?? "—"}
                    {reservation.headcount != null
                      ? ` · ${reservation.headcount}명`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              className="clubHome__linkBtn"
              to="/club/mypage/reservations"
            >
              예약 전체 보기 →
            </Link>
          </>
        )}
      </section>

      <ClubHomeScheduleSheet
        open={Boolean(sheetDateKey)}
        dateKey={sheetDateKey}
        practices={sheetDateKey ? (practiceByDate.get(sheetDateKey) ?? []) : []}
        reservations={
          sheetDateKey ? (reservationByDate.get(sheetDateKey) ?? []) : []
        }
        requestTeams={sheetDateKey ? (requestByDate.get(sheetDateKey) ?? []) : []}
        scheduleMap={scheduleMap}
        initialSchedule={sheetDateKey ? scheduleMap.get(sheetDateKey) : null}
        onClose={() => setSheetDateKey(null)}
        onScheduleSaved={handleScheduleSaved}
        onSchedulesRefreshed={refreshSchedules}
      />
    </div>
  );
};

export default ClubRoom;
