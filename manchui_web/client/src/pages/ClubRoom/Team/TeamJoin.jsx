import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoMailOpenOutline } from "react-icons/io5";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import Loading from "../../../components/Loading/Loading";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { getMemberDisplayName, isDefaultComment, isTeamMember } from "./teamUtils";
import "./Team.css";

function getLeaderName(team) {
  if (!team?.leaderId) return null;
  const members = Array.isArray(team.members) ? team.members : [];
  const leader = members.find(
    (member) => String(member?._id ?? member) === String(team.leaderId),
  );
  return leader ? getMemberDisplayName(leader) : null;
}

const TeamJoin = () => {
  const { teamId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const modal = useManchuiModal();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining] = useState(false);

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
      if (!nextTeam) setNotFound(true);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) setNotFound(true);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const handleJoin = async () => {
    if (!user?._id || joining || !teamId) return;
    setJoining(true);
    try {
      const res = await apiClient.post(
        "/api/team/join",
        { teamId, userId: user._id },
        { withCredentials: true },
      );
      await modal(res.data?.message ?? "가입되었습니다.");
      nav(`/club/team/${teamId}`, { replace: true });
    } catch (error) {
      await modal(error.response?.data?.message ?? "가입에 실패했습니다.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="teamPage teamPage--join">
        <Loading />
      </div>
    );
  }

  if (notFound || !team) {
    return (
      <div className="teamPage teamPage--join">
        <article className="teamInvite teamInvite--empty">
          <div className="teamInvite__frame">
            <span className="teamDetailHero__logoMark" aria-hidden />
            <header className="teamInvite__header">
              <IoMailOpenOutline className="teamInvite__icon" aria-hidden />
              <p className="teamInvite__label">초대장을 찾을 수 없음</p>
            </header>
            <p className="teamInvite__status">
              초대 링크가 만료되었거나 팀을 찾을 수 없습니다.
            </p>
            <button
              type="button"
              className="teamInvite__plainBtn"
              onClick={() => nav("/club/team")}
            >
              팀 목록으로
            </button>
          </div>
        </article>
      </div>
    );
  }

  const members = Array.isArray(team.members) ? team.members : [];
  const accent = team.teamColor || "#E87070";
  const alreadyMember = isTeamMember(team, user?._id);
  const leaderName = getLeaderName(team);
  const comment = isDefaultComment(team.comment)
    ? "아직 팀 소개가 없습니다."
    : team.comment;

  return (
    <div className="teamPage teamPage--join">
      <article
        className="teamInvite"
        style={{ "--team-accent": accent }}
        aria-labelledby="team-invite-title"
      >
        <div className="teamInvite__frame">
          <span className="teamDetailHero__logoMark" aria-hidden />
          <span className="teamInvite__corner teamInvite__corner--tl" aria-hidden />
          <span className="teamInvite__corner teamInvite__corner--tr" aria-hidden />
          <span className="teamInvite__corner teamInvite__corner--bl" aria-hidden />
          <span className="teamInvite__corner teamInvite__corner--br" aria-hidden />

          <div className="teamInvite__stamp" aria-hidden>
            <span>INVITE</span>
          </div>

          <header className="teamInvite__header">
            <IoMailOpenOutline className="teamInvite__icon" aria-hidden />
            <p className="teamInvite__label">팀 초대장</p>
            <p className="teamInvite__from">MANCHUI · 동아리방</p>
          </header>

          <div className="teamInvite__divider" aria-hidden />

          <div className="teamInvite__teamBlock">
            <span
              className="teamInvite__swatch"
              style={{ background: accent }}
              aria-hidden
            />
            <div className="teamInvite__teamText">
              <p className="teamInvite__teamLead">아래 팀에 초대되었습니다</p>
              <h1 id="team-invite-title" className="teamInvite__teamName">
                {team.name}
              </h1>
            </div>
          </div>

          <ul className="teamInvite__metaList">
            <li>현재 멤버 {members.length}명</li>
            {leaderName ? <li>곡장 {leaderName}</li> : null}
          </ul>

          <div className="teamInvite__intro">
            <p className="teamInvite__introLabel">팀 소개</p>
            <blockquote className="teamInvite__message">
              <p>{comment}</p>
            </blockquote>
          </div>

          <footer className="teamInvite__footer">
            {alreadyMember ? (
              <>
                <p className="teamInvite__status teamInvite__status--member">
                  이미 이 팀의 멤버입니다.
                </p>
                <button
                  type="button"
                  className="teamInvite__plainBtn"
                  onClick={() => nav(`/club/team/${teamId}`, { replace: true })}
                >
                  팀으로 이동
                </button>
              </>
            ) : (
              <>
                <p className="teamInvite__status">
                  아래 버튼을 눌러 초대를 수락하고
                  <br />
                  팀에 합류할 수 있습니다.
                </p>
                <button
                  type="button"
                  className="teamInvite__acceptBtn"
                  onClick={() => void handleJoin()}
                  disabled={joining}
                >
                  {joining ? "가입 중…" : "초대 수락 · 팀 가입"}
                </button>
              </>
            )}
          </footer>

          <p className="teamInvite__sign">Manchui Band Club Room</p>
        </div>
      </article>
    </div>
  );
};

export default TeamJoin;
