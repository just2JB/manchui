import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import Loading from "../../../components/Loading/Loading";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import TeamPracticeAvailabilityGrid from "./TeamPracticeAvailabilityGrid";
import {
  formatPracticeDatesSummary,
  parsePracticeDateKeys,
} from "./teamCalendarUtils";
import { isTeamLeader, getTeamLeaderIds } from "./teamUtils";
import "./Team.css";

const TeamPracticeCreate = () => {
  const { teamId } = useParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const modal = useManchuiModal();

  const dateKeys = useMemo(
    () => parsePracticeDateKeys(searchParams),
    [searchParams.toString()],
  );

  const [team, setTeam] = useState(null);
  const [memberSchedules, setMemberSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadTeam = useCallback(async () => {
    if (!teamId) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/team/${teamId}`, {
        withCredentials: true,
      });
      const nextTeam = res.data?.team ?? null;
      if (!nextTeam || !isTeamLeader(nextTeam, user?._id)) {
        setForbidden(true);
        setTeam(null);
        setMemberSchedules([]);
        return;
      }
      setTeam(nextTeam);
      setMemberSchedules(
        Array.isArray(res.data?.memberSchedules) ? res.data.memberSchedules : [],
      );
      setForbidden(false);
    } catch (error) {
      console.error(error);
      setForbidden(true);
      setTeam(null);
      setMemberSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [teamId, user?._id]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const memberIds = useMemo(
    () =>
      (Array.isArray(team?.members) ? team.members : []).map(
        (member) => member?._id ?? member,
      ),
    [team?.members],
  );

  const handleSelectionChange = useCallback((entries) => {
    setSelectedEntries(Array.isArray(entries) ? entries : []);
  }, []);

  const handleCreate = async () => {
    if (!team || selectedEntries.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      for (const entry of selectedEntries) {
        await apiClient.post(
          "/api/practice/create",
          {
            teamId,
            date: entry.dateKey,
            time: entry.time,
            members: entry.members,
            memberByHour: entry.memberByHour,
            place: "미확정",
          },
          { withCredentials: true },
        );
      }
      await modal(
        selectedEntries.length === 1
          ? "연습이 생성되었습니다."
          : `연습 ${selectedEntries.length}개를 생성했습니다.`,
      );
      nav(`/club/team/${teamId}`, { replace: true });
    } catch (error) {
      await modal(error.response?.data?.message ?? "연습 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="teamPage teamPage--practiceCreate">
        <Loading />
      </div>
    );
  }

  if (forbidden || !team || dateKeys.length === 0) {
    return (
      <div className="teamPage teamPage--practiceCreate">
        <button
          type="button"
          className="teamPage__back"
          onClick={() => nav(teamId ? `/club/team/${teamId}` : "/club/team")}
        >
          ← 팀으로
        </button>
        <p className="teamPage__intro">
          {dateKeys.length === 0
            ? "연습 날짜가 올바르지 않습니다."
            : "연습을 생성할 권한이 없습니다."}
        </p>
      </div>
    );
  }

  const accent = team.teamColor || "#E87070";

  return (
    <div
      className="teamPage teamPage--practiceCreate"
      style={{ "--team-accent": accent }}
    >
      <button
        type="button"
        className="teamPage__back"
        onClick={() => nav(`/club/team/${teamId}`)}
      >
        ← {team.name}
      </button>

      <div className="teamPage__top">
        <h1 className="teamPage__title">연습 생성</h1>
        <p className="teamPage__intro">
          {formatPracticeDatesSummary(dateKeys)} · 표에서 연습 시간을 선택하세요.
        </p>
      </div>

      <TeamPracticeAvailabilityGrid
        dateKeys={dateKeys}
        memberIds={memberIds}
        members={Array.isArray(team.members) ? team.members : []}
        memberSchedules={memberSchedules}
        leaderIds={getTeamLeaderIds(team)}
        onSelectionChange={handleSelectionChange}
      />

      <div className="teamForm">
        <button
          type="button"
          className="teamForm__submit"
          onClick={() => void handleCreate()}
          disabled={selectedEntries.length === 0 || submitting}
        >
          {submitting ? "생성 중…" : "연습 생성"}
        </button>
      </div>
    </div>
  );
};

export default TeamPracticeCreate;
