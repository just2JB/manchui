import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { IoSettingsOutline, IoShareOutline } from "react-icons/io5";
import apiClient from "../../../api/apiClient";
import { fetchTeamPolls } from "../../../api/pollApi";
import { useAuth } from "../../../context/AuthContext";
import ClubPageSkeleton from "../ClubPageSkeleton";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import TeamPracticeEditSheet from "./TeamPracticeEditSheet";
import TeamUpcomingPractice from "./TeamUpcomingPractice";
import TeamPollSection from "../Poll/TeamPollSection";
import {
  getMemberDisplayName,
  isDefaultComment,
  isTeamLeader,
  isTeamMember,
  shareTeamInvite,
} from "./teamUtils";
import { toVisibleTeamColor } from "./teamColorPresets";
import "./Team.css";

const MEMBER_AVATAR_COUNT = 6;

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
  /** 이미 불러온 팀이면 다시 들어와도 자리표시 없이 조용히 새로고침 */
  const loadedTeamIdRef = useRef(null);

  const loadTeam = useCallback(async () => {
    if (!teamId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const silent = loadedTeamIdRef.current === teamId;
    if (!silent) setLoading(true);
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

      if (!silent) setPollsLoading(true);
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
      loadedTeamIdRef.current = teamId;
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
        setNotFound(true);
        loadedTeamIdRef.current = null;
        setTeam(null);
      } else if (!silent) {
        setTeam(null);
      }
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
        <button type="button" className="teamPage__back" onClick={() => nav("/club/team")}>
          ← 팀 목록
        </button>
        <ClubPageSkeleton variant="detail" />
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
  const accent = toVisibleTeamColor(team.teamColor);
  // 편집 시트의 장소 빠른 선택: 최근에 쓴 장소 최대 4개
  const placeSuggestions = [
    ...new Set(
      [...practices]
        .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")))
        .map((practice) => String(practice.place ?? "").trim())
        .filter((place) => place && place !== "미확정"),
    ),
  ].slice(0, 4);
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

      {/* 상단: 팀 이름 · 공유/설정 아이콘, 아래에 멤버 얼굴(이니셜) */}
      <header className="teamHead">
        <div className="teamHead__row">
          <h1 className="teamHead__name">
            <span className="teamHead__dot" aria-hidden="true" />
            {team.name}
          </h1>
          <div className="teamHead__actions">
            {isMember ? (
              <button
                type="button"
                className="teamHead__settings"
                onClick={() => void shareTeamInvite(team.name, teamId, modal)}
                aria-label="팀 초대 링크 공유"
                title="초대 링크 공유"
              >
                <IoShareOutline aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              className="teamHead__settings"
              onClick={() => nav(`/club/team/${teamId}/settings`)}
              aria-label="팀 설정"
              title="팀 설정"
            >
              <IoSettingsOutline aria-hidden />
            </button>
          </div>
        </div>
        <button
          type="button"
          className="teamHead__members"
          onClick={() => nav(`/club/team/${teamId}/settings`)}
          aria-label={`멤버 ${members.length}명 보기`}
        >
          <span className="teamHead__avatars" aria-hidden="true">
            {members.slice(0, MEMBER_AVATAR_COUNT).map((member) => (
              <span key={String(member?._id ?? member)} className="teamHead__avatar">
                {getMemberDisplayName(member).trim().charAt(0) || "?"}
              </span>
            ))}
            {members.length > MEMBER_AVATAR_COUNT ? (
              <span className="teamHead__avatar teamHead__avatar--more">
                +{members.length - MEMBER_AVATAR_COUNT}
              </span>
            ) : null}
          </span>
        </button>
      </header>

      <TeamUpcomingPractice
        teamId={teamId}
        teamName={team.name}
        practices={practices}
        members={members}
        isLeader={isLeader}
        onPracticeClick={isLeader ? handlePracticeClick : undefined}
        onAddPractice={
          isLeader
            ? () => nav(`/club/team/${teamId}/practice/new`)
            : undefined
        }
      />

      <TeamPracticeEditSheet
        open={Boolean(editingPractice)}
        practice={editingPractice}
        accentColor={accent}
        teamMembers={members}
        placeSuggestions={placeSuggestions}
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
