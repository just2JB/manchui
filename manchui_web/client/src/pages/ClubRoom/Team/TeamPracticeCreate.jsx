import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import Loading from "../../../components/Loading/Loading";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { useInvalidateClubTeams } from "../../../queries/useClubQueries";
import { fetchPoll } from "../../../api/pollApi";
import TeamPracticeAvailabilityGrid from "./TeamPracticeAvailabilityGrid";
import {
  buildPollRecommendations,
  getPollDisplayTitle,
  isGuestMemberId,
  pollToPracticeGridData,
} from "../Poll/pollUtils";
import { formatHourRangeLabel } from "./practiceAvailabilityUtils";
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
  const invalidateTeams = useInvalidateClubTeams(user?._id);

  const pollId = searchParams.get("poll");
  const pick = searchParams.get("pick");
  const [poll, setPoll] = useState(null);

  const queryDateKeys = useMemo(
    () => parsePracticeDateKeys(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString()],
  );

  const pollGrid = useMemo(
    () => (poll ? pollToPracticeGridData(poll) : null),
    [poll],
  );
  const dateKeys = pollGrid ? pollGrid.dateKeys : queryDateKeys;

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
      if (pollId) {
        const data = await fetchPoll(pollId);
        setPoll(
          data.poll && String(data.poll.teamId) === String(teamId)
            ? data.poll
            : null,
        );
      }
      setForbidden(false);
    } catch (error) {
      console.error(error);
      setForbidden(true);
      setTeam(null);
      setMemberSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [teamId, user?._id, pollId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const teamMemberIds = useMemo(
    () =>
      (Array.isArray(team?.members) ? team.members : []).map(
        (member) => member?._id ?? member,
      ),
    [team?.members],
  );

  const memberIds = pollGrid ? pollGrid.memberIds : teamMemberIds;
  const gridMembers = pollGrid
    ? pollGrid.members
    : Array.isArray(team?.members)
      ? team.members
      : [];
  const gridSchedules = pollGrid ? pollGrid.memberSchedules : memberSchedules;

  const guestNameById = useMemo(
    () =>
      new Map(
        (pollGrid?.members ?? [])
          .filter((member) => member.guestName)
          .map((member) => [member._id, member.guestName]),
      ),
    [pollGrid],
  );

  /** 투표 추천 → 그리드 추천 목록 형태 */
  const pollRecommendations = useMemo(() => {
    if (!poll) return null;
    return buildPollRecommendations(poll, { limit: 8 }).map((item) => ({
      id: item.id,
      dateKey: item.dateKey,
      startHour: item.startHour,
      endHour: item.endHour - 1,
      duration: item.duration,
      minAvailable: item.available.length,
      totalMembers: item.total,
      time: formatHourRangeLabel(item.startHour, item.endHour - 1),
      isAfternoon: item.startHour >= 12,
    }));
  }, [poll]);

  /** ?pick=YYYY-MM-DD:14-17 → 14,15,16시 선택 */
  const initialSelection = useMemo(() => {
    const match = /^(\d{4}-\d{2}-\d{2}):(\d{1,2})-(\d{1,2})$/.exec(pick ?? "");
    if (!match || !dateKeys.includes(match[1])) return null;
    const start = Number(match[2]);
    const end = Number(match[3]);
    const hours = [];
    for (let hour = start; hour < end && hour < 24; hour += 1) hours.push(hour);
    return hours.length > 0 ? { [match[1]]: hours } : null;
  }, [pick, dateKeys]);

  const handleSelectionChange = useCallback((entries) => {
    setSelectedEntries(Array.isArray(entries) ? entries : []);
  }, []);

  const handleCreate = async () => {
    if (!team || selectedEntries.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      for (const entry of selectedEntries) {
        // 게스트(계정 없는 응답자)는 멤버 id 대신 이름으로 따로 저장
        const guestNames = [
          ...new Set(
            (entry.members ?? [])
              .filter(isGuestMemberId)
              .map((id) => guestNameById.get(id))
              .filter(Boolean),
          ),
        ];
        await apiClient.post(
          "/api/practice/create",
          {
            teamId,
            date: entry.dateKey,
            time: entry.time,
            members: (entry.members ?? []).filter((id) => !isGuestMemberId(id)),
            memberByHour: (entry.memberByHour ?? []).map((slot) => ({
              ...slot,
              members: (slot.members ?? []).filter((id) => !isGuestMemberId(id)),
            })),
            place: "미확정",
            guestNames,
            pollId: poll?._id ?? null,
          },
          { withCredentials: true },
        );
      }
      await modal(
        selectedEntries.length === 1
          ? "연습이 생성되었습니다."
          : `연습 ${selectedEntries.length}개를 생성했습니다.`,
      );
      invalidateTeams();
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
          {poll ? `${getPollDisplayTitle(poll)} 응답 기준 · ` : ""}
          {formatPracticeDatesSummary(dateKeys)} · 표에서 연습 시간을 선택하세요.
        </p>
      </div>

      <TeamPracticeAvailabilityGrid
        dateKeys={dateKeys}
        memberIds={memberIds}
        members={gridMembers}
        memberSchedules={gridSchedules}
        leaderIds={getTeamLeaderIds(team)}
        onSelectionChange={handleSelectionChange}
        hours={pollGrid ? pollGrid.hours : null}
        initialSelection={initialSelection}
        recommendations={pollRecommendations}
        defaultShowRecommendations={Boolean(poll)}
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
