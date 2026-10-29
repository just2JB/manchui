import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { IoPersonAddOutline, IoSettingsOutline } from "react-icons/io5";
import apiClient from "../../../api/apiClient";
import { fetchMySchedules } from "../../../api/scheduleApi";
import { buildUserScheduleMap } from "../Home/clubHomeUtils";
import { useAuth } from "../../../context/AuthContext";
import Loading from "../../../components/Loading/Loading";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import TeamCalendar from "./TeamCalendar";
import TeamDashboard from "./TeamDashboard";
import TeamPracticeEditSheet from "./TeamPracticeEditSheet";
import TeamUpcomingPractice from "./TeamUpcomingPractice";
import { normalizeDateKey } from "./teamCalendarUtils";
import {
  isDefaultComment,
  isTeamLeader,
  isTeamMember,
  shareTeamInvite,
} from "./teamUtils";
import "./Team.css";

const TeamDetail = () => {
  const { teamId } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const { user } = useAuth();
  const modal = useManchuiModal();
  const [team, setTeam] = useState(null);
  const [practices, setPractices] = useState([]);
  const [memberSchedules, setMemberSchedules] = useState([]);
  const [userSchedules, setUserSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editingPractice, setEditingPractice] = useState(null);

  const loadTeam = useCallback(async () => {
    if (!teamId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    try {
      const res = await apiClient.get(`/api/team/${teamId}`, {
        withCredentials: true,
      });
      const nextTeam = res.data?.team ?? null;
      setTeam(nextTeam);
      setMemberSchedules(
        Array.isArray(res.data?.memberSchedules) ? res.data.memberSchedules : [],
      );
      if (!nextTeam) {
        setNotFound(true);
        setPractices([]);
        setMemberSchedules([]);
        return;
      }

      const [practiceResult, schedulesResult] = await Promise.allSettled([
        apiClient.get(`/api/practice/teamPractice/${teamId}`, {
          withCredentials: true,
        }),
        user?._id ? fetchMySchedules() : Promise.resolve([]),
      ]);

      if (practiceResult.status === "fulfilled") {
        setPractices(
          Array.isArray(practiceResult.value.data?.teamPractice)
            ? practiceResult.value.data.teamPractice
            : [],
        );
      } else {
        console.error(practiceResult.reason);
        setPractices([]);
      }

      if (schedulesResult.status === "fulfilled") {
        setUserSchedules(schedulesResult.value);
      } else {
        console.error(schedulesResult.reason);
        setUserSchedules([]);
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
        setNotFound(true);
      }
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [teamId, user?._id]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam, location.key]);

  const scheduleMap = useMemo(
    () => buildUserScheduleMap(userSchedules),
    [userSchedules],
  );

  const handleScheduleSaved = useCallback(
    (dateKey, schedule) => {
      setUserSchedules((prev) => {
        const next = prev.filter(
          (item) => normalizeDateKey(item.date) !== dateKey,
        );
        if (schedule && schedule.category !== "temp") {
          next.push(schedule);
        }
        return next;
      });

      if (!user?._id) return;
      const userKey = String(user._id);
      setMemberSchedules((prev) => {
        const next = prev.filter(
          (item) =>
            normalizeDateKey(item.date) !== dateKey ||
            String(item.userId) !== userKey,
        );
        if (schedule && schedule.category !== "temp") {
          next.push(schedule);
        }
        return next;
      });
    },
    [user?._id],
  );

  const handlePracticeClick = useCallback((practice) => {
    if (!practice) return;
    setEditingPractice(practice);
  }, []);

  const handlePracticeSaved = useCallback((updatedPractice) => {
    if (!updatedPractice?._id) return;
    setPractices((prev) =>
      prev.map((item) =>
        String(item._id) === String(updatedPractice._id)
          ? { ...item, ...updatedPractice }
          : item,
      ),
    );
  }, []);

  const handlePracticeDeleted = useCallback((practiceId) => {
    if (!practiceId) return;
    setPractices((prev) =>
      prev.filter((item) => String(item._id) !== String(practiceId)),
    );
  }, []);

  if (loading) {
    return (
      <div className="teamPage teamPage--detail">
        <Loading />
      </div>
    );
  }

  if (notFound || !team) {
    return (
      <div className="teamPage teamPage--detail">
        <button
          type="button"
          className="teamPage__back"
          onClick={() => nav("/club/team")}
        >
          ← 팀 목록
        </button>
        <p className="teamPage__intro">팀을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const members = Array.isArray(team.members) ? team.members : [];
  const isMember = isTeamMember(team, user?._id);
  const isLeader = isTeamLeader(team, user?._id);
  const accent = team.teamColor || "#E87070";
  const comment = isDefaultComment(team.comment)
    ? "아직 팀 소개가 없습니다."
    : team.comment;

  const calendarRequests = Array.isArray(team.requestSchedules)
    ? team.requestSchedules
    : [];

  return (
    <div
      className="teamPage teamPage--detail"
      style={{ "--team-accent": accent }}
    >
      <button
        type="button"
        className="teamPage__back"
        onClick={() => nav("/club/team")}
      >
        ← 팀 목록
      </button>

      <section
        className="teamDetailHero"
        aria-label="팀 정보"
        style={{ "--team-accent": accent }}
      >
        <span className="teamDetailHero__logoMark" aria-hidden />
        <div className="teamDetailHero__row">
          <div className="teamDetailHero__main">
            <h1 className="teamDetailHero__name">{team.name}</h1>
            <div className="teamDetailHero__metaRow">
              <p className="teamDetailHero__meta">멤버 {members.length}명</p>
              {isMember ? (
                <button
                  type="button"
                  className="teamDetailHero__invite"
                  onClick={() => void shareTeamInvite(team.name, teamId, modal)}
                >
                  <IoPersonAddOutline aria-hidden />
                  멤버 초대
                </button>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="teamDetailHero__settings"
            onClick={() => nav(`/club/team/${teamId}/settings`)}
            aria-label="팀 설정"
          >
            <IoSettingsOutline aria-hidden />
          </button>
        </div>
      </section>

      <TeamUpcomingPractice
        practices={practices}
        members={members}
        isLeader={isLeader}
        onPracticeClick={isLeader ? handlePracticeClick : undefined}
      />

      <TeamPracticeEditSheet
        open={Boolean(editingPractice)}
        practice={editingPractice}
        accentColor={accent}
        onClose={() => setEditingPractice(null)}
        onSaved={handlePracticeSaved}
        onDeleted={handlePracticeDeleted}
      />

      <section className="teamDetailBlock" aria-labelledby="team-cal-title">
        <h2 id="team-cal-title" className="teamDetailBlock__title">
          캘린더
        </h2>
        <TeamCalendar
          teamId={teamId}
          teamName={team.name}
          isLeader={isLeader}
          isMember={isMember}
          requestSchedules={calendarRequests}
          practices={practices}
          scheduleMap={scheduleMap}
          accentColor={accent}
          onScheduleSaved={handleScheduleSaved}
          onRequestSchedulesUpdated={(nextSchedules) => {
            if (Array.isArray(nextSchedules)) {
              setTeam((prev) =>
                prev ? { ...prev, requestSchedules: nextSchedules } : prev,
              );
            } else {
              void loadTeam();
            }
          }}
          onPracticeClick={isLeader ? handlePracticeClick : undefined}
        />
      </section>

      <section
        className="teamDetailBlock teamDetailBlock--dashboard"
        aria-labelledby="team-dash-title"
      >
        <h2 id="team-dash-title" className="teamDetailBlock__title">
          대시보드
        </h2>
        <TeamDashboard
          teamId={teamId}
          practiceCount={practices.length}
          members={members}
          requestSchedules={calendarRequests}
          memberSchedules={memberSchedules}
        />
      </section>

      <section className="teamDetailBlock" aria-labelledby="team-intro-title">
        <h2 id="team-intro-title" className="teamDetailBlock__title">
          팀 소개
        </h2>
        <p className="teamDetailBlock__body">{comment}</p>
      </section>
    </div>
  );
};

export default TeamDetail;
