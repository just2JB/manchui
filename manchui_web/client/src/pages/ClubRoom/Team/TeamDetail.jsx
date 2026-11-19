import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { IoSettingsOutline, IoShareOutline } from "react-icons/io5";
import apiClient from "../../../api/apiClient";
import { fetchTeamPolls } from "../../../api/pollApi";
import { useAuth } from "../../../context/AuthContext";
import Loading from "../../../components/Loading/Loading";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import TeamPracticeEditSheet from "./TeamPracticeEditSheet";
import TeamUpcomingPractice from "./TeamUpcomingPractice";
import TeamPollSection from "../Poll/TeamPollSection";
import PollPracticeSheet from "../Poll/PollPracticeSheet";
import { getPendingTeamMembers, isPollActive } from "../Poll/pollUtils";
import {
  getMemberDisplayName,
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
  const [polls, setPolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editingPractice, setEditingPractice] = useState(null);
  const [practiceSheetOpen, setPracticeSheetOpen] = useState(false);

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
      if (!nextTeam) {
        setNotFound(true);
        setPractices([]);
        setPolls([]);
        return;
      }

      setPollsLoading(true);
      const [practiceResult, pollsResult] = await Promise.allSettled([
        apiClient.get(`/api/practice/teamPractice/${teamId}`, {
          withCredentials: true,
        }),
        fetchTeamPolls(teamId),
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

      if (pollsResult.status === "fulfilled") {
        setPolls(pollsResult.value);
      } else {
        console.error(pollsResult.reason);
        setPolls([]);
      }
      setPollsLoading(false);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
        setNotFound(true);
      }
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam, location.key]);



  const handlePollChanged = useCallback((nextPoll) => {
    setPolls((prev) =>
      prev.map((item) => (item._id === nextPoll._id ? nextPoll : item)),
    );
  }, []);

  const handlePollDeleted = useCallback((pollId) => {
    setPolls((prev) => prev.filter((item) => item._id !== pollId));
  }, []);

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
  // 연습 추가 시트에 쓸 일정 종합: 진행 중인 것 우선, 없으면 가장 최근 것
  const practicePoll = polls.find(isPollActive) ?? polls[0] ?? null;
  const pendingForSheet =
    practicePoll && isPollActive(practicePoll)
      ? getPendingTeamMembers(
          practicePoll,
          members.map((member) => ({
            _id: String(member?._id ?? member),
            username: getMemberDisplayName(member),
          })),
        )
      : [];
  const comment = isDefaultComment(team.comment)
    ? "아직 팀 소개가 없습니다."
    : team.comment;

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

      {/* 상단: 박스 없이 팀 이름 · 설정, 아래 한 줄에 멤버 수 · 링크 공유 */}
      <header className="teamHead">
        <div className="teamHead__row">
          <h1 className="teamHead__name">
            <span className="teamHead__dot" aria-hidden="true" />
            {team.name}
          </h1>
          <button
            type="button"
            className="teamHead__settings"
            onClick={() => nav(`/club/team/${teamId}/settings`)}
            aria-label="팀 설정"
          >
            <IoSettingsOutline aria-hidden />
          </button>
        </div>
        <p className="teamHead__meta">
          멤버 {members.length}명
          {isMember ? (
            <>
              <span aria-hidden="true"> · </span>
              <button
                type="button"
                className="teamHead__share"
                onClick={() => void shareTeamInvite(team.name, teamId, modal)}
              >
                <IoShareOutline aria-hidden />
                링크 공유
              </button>
            </>
          ) : null}
        </p>
      </header>

      <TeamUpcomingPractice
        practices={practices}
        members={members}
        isLeader={isLeader}
        onPracticeClick={isLeader ? handlePracticeClick : undefined}
        onAddPractice={isLeader && practicePoll ? () => setPracticeSheetOpen(true) : undefined}
      />

      <PollPracticeSheet
        open={practiceSheetOpen}
        poll={practicePoll}
        teamId={teamId}
        pendingMembers={pendingForSheet}
        onClose={() => setPracticeSheetOpen(false)}
      />

      <TeamPracticeEditSheet
        open={Boolean(editingPractice)}
        practice={editingPractice}
        accentColor={accent}
        onClose={() => setEditingPractice(null)}
        onSaved={handlePracticeSaved}
        onDeleted={handlePracticeDeleted}
      />

      <TeamPollSection
        team={team}
        teamId={teamId}
        polls={polls}
        loading={pollsLoading}
        isLeader={isLeader}
        currentUserId={user?._id}
        onPollChanged={handlePollChanged}
        onPollDeleted={handlePollDeleted}
      />

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
