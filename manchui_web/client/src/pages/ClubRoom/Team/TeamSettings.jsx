import React, { useCallback, useEffect, useState } from "react";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import ClubPageSkeleton from "../ClubPageSkeleton";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { useInvalidateClubTeams } from "../../../queries/useClubQueries";
import {
  getMemberDisplayName,
  isCoTeamLeader,
  isDefaultComment,
  isMainTeamLeader,
  isTeamLeader,
  isTeamMember,
} from "./teamUtils";
import {
  TEAM_COLOR_PRESETS,
  isTeamColorPreset,
  isTeamColorTooDark,
  isTeamColorTooLight,
  toVisibleTeamColor,
} from "./teamColorPresets";
import "./Team.css";

const TeamSettings = () => {
  const { teamId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const modal = useManchuiModal();
  const invalidateTeams = useInvalidateClubTeams(user?._id);

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [teamColor, setTeamColor] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [openMemberId, setOpenMemberId] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [transferringMemberId, setTransferringMemberId] = useState(null);
  const [coLeaderMemberId, setCoLeaderMemberId] = useState(null);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [quitting, setQuitting] = useState(false);

  const loadTeam = useCallback(async () => {
    if (!teamId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    setForbidden(false);
    try {
      const res = await apiClient.get(`/api/team/${teamId}`, {
        withCredentials: true,
      });
      const nextTeam = res.data?.team ?? null;
      if (!nextTeam) {
        setNotFound(true);
        setTeam(null);
        return;
      }
      if (!isTeamMember(nextTeam, user?._id)) {
        setForbidden(true);
        setTeam(null);
        return;
      }
      setTeam(nextTeam);
      setName(nextTeam.name ?? "");
      setTeamColor(nextTeam.teamColor || "#E87070");
      setComment(
        isDefaultComment(nextTeam.comment) ? "" : String(nextTeam.comment),
      );
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) setNotFound(true);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [teamId, user?._id]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const leader = isTeamLeader(team, user?._id);
  const mainLeader = isMainTeamLeader(team, user?._id);
  const accent = toVisibleTeamColor(team?.teamColor);
  const members = Array.isArray(team?.members) ? team.members : [];

  const savedComment = isDefaultComment(team?.comment)
    ? ""
    : String(team?.comment ?? "");
  const infoChanged =
    Boolean(team) &&
    (name.trim() !== (team.name ?? "") ||
      comment.trim() !== savedComment.trim() ||
      teamColor !== (team.teamColor || "#E87070"));

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || savingInfo || !leader || !infoChanged) return;
    setSavingInfo(true);
    try {
      await apiClient.post(
        "/api/team/edit",
        {
          teamId,
          name: trimmed,
          comment: comment.trim() || "작성해 주세요.",
          teamColor,
        },
        { withCredentials: true },
      );
      await modal("팀 정보를 저장했습니다.");
      invalidateTeams();
      await loadTeam();
    } catch (error) {
      await modal(error.response?.data?.message ?? "팀 정보 저장에 실패했습니다.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSetCoLeader = async (member, appoint) => {
    const memberId = member?._id ?? member;
    const label = getMemberDisplayName(member);
    const message = appoint
      ? `${label}님을 부곡장으로 임명할까요? 곡장과 동일한 팀 관리 권한이 부여됩니다.`
      : `${label}님의 부곡장 권한을 해임할까요?`;

    if (!(await modal(message, "confirm"))) return;

    setCoLeaderMemberId(String(memberId));
    try {
      await apiClient.post(
        "/api/team/set-co-leader",
        { teamId, actorId: user._id, memberId, appoint },
        { withCredentials: true },
      );
      await modal(appoint ? "부곡장으로 임명했습니다." : "부곡장을 해임했습니다.");
      await loadTeam();
    } catch (error) {
      await modal(
        error.response?.data?.message ?? "부곡장 설정에 실패했습니다.",
      );
    } finally {
      setCoLeaderMemberId(null);
    }
  };

  const handleTransferLeader = async (member) => {
    const memberId = member?._id ?? member;
    const label = getMemberDisplayName(member);
    if (
      !(await modal(
        `${label}님에게 곡장을 위임할까요? 위임 후에는 곡장 권한이 사라집니다.`,
        "confirm",
      ))
    ) {
      return;
    }
    setTransferringMemberId(String(memberId));
    try {
      await apiClient.post(
        "/api/team/change-leader",
        { teamId, leaderId: user._id, userId: memberId },
        { withCredentials: true },
      );
      await modal("곡장이 위임되었습니다.");
      await loadTeam();
    } catch (error) {
      await modal(error.response?.data?.message ?? "곡장 위임에 실패했습니다.");
    } finally {
      setTransferringMemberId(null);
    }
  };

  const handleRemoveMember = async (member) => {
    const memberId = member?._id ?? member;
    const label = getMemberDisplayName(member);
    if (!(await modal(`${label}님을 팀에서 내보낼까요?`, "confirm"))) {
      return;
    }
    setRemovingMemberId(String(memberId));
    try {
      await apiClient.post(
        "/api/team/remove-member",
        { teamId, leaderId: user._id, memberId },
        { withCredentials: true },
      );
      await modal("멤버를 내보냈습니다.");
      await loadTeam();
    } catch (error) {
      await modal(
        error.response?.data?.message ?? "멤버 내보내기에 실패했습니다.",
      );
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleDeleteTeam = async () => {
    if (
      !(await modal(
        "팀을 삭제하면 팀과 연습 일정이 사라지고 복구할 수 없어요. (연습실 사용 기록만 동아리 결산용으로 남아요) 정말 삭제할까요?",
        "confirm",
      ))
    ) {
      return;
    }
    setDeletingTeam(true);
    try {
      await apiClient.delete(`/api/team/${teamId}`, { withCredentials: true });
      await modal("팀이 삭제되었습니다.");
      nav("/club/team", { replace: true });
    } catch (error) {
      await modal(error.response?.data?.message ?? "팀 삭제에 실패했습니다.");
    } finally {
      setDeletingTeam(false);
    }
  };

  const handleQuit = async () => {
    if (!(await modal("팀에서 탈퇴하시겠습니까?", "confirm"))) return;
    setQuitting(true);
    try {
      await apiClient.post(
        "/api/team/quit",
        { teamId, userId: user._id },
        { withCredentials: true },
      );
      await modal("탈퇴되었습니다.");
      nav("/club/team", { replace: true });
    } catch (error) {
      await modal(error.response?.data?.message ?? "탈퇴에 실패했습니다.");
    } finally {
      setQuitting(false);
    }
  };

  if (loading) {
    return (
      <div className="teamPage teamPage--settings">
        <button type="button" className="teamPage__back" onClick={() => nav(`/club/team/${teamId}`)}>
          ← 팀으로
        </button>
        <ClubPageSkeleton variant="form" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="teamPage teamPage--settings">
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

  if (forbidden || !team) {
    return (
      <div className="teamPage teamPage--settings">
        <button
          type="button"
          className="teamPage__back"
          onClick={() => nav("/club/team")}
        >
          ← 팀 목록
        </button>
        <p className="teamPage__intro">이 팀의 설정에 접근할 수 없습니다.</p>
      </div>
    );
  }

  const roleLabel = mainLeader ? "곡장" : leader ? "부곡장" : "멤버";
  const memberBusy = Boolean(
    removingMemberId || transferringMemberId || coLeaderMemberId,
  );
  // 저장 전에도 고른 팀 색을 미리 보여준다
  const previewAccent = leader ? toVisibleTeamColor(teamColor) : accent;

  return (
    <div
      className="teamPage teamPage--settings"
      style={{ "--team-accent": previewAccent }}
    >
      <button
        type="button"
        className="teamPage__back"
        onClick={() => nav(`/club/team/${teamId}`)}
      >
        ← {team.name}
      </button>

      <header className="teamSettings__head">
        <h1 className="teamPage__title">팀 설정</h1>
        <p className="teamSettings__role">
          <span className="teamSettings__roleDot" aria-hidden />
          {roleLabel}
          {leader ? " · 팀을 관리할 수 있어요" : ""}
        </p>
      </header>

      <div className="teamSettings">
        {leader ? (
          <section className="teamSettings__section" aria-labelledby="team-settings-info">
            <h2 id="team-settings-info" className="teamSettings__sectionTitle">
              기본 정보
            </h2>
            <form className="teamSettings__form" onSubmit={handleSaveInfo}>
              <label className="teamSettings__field">
                <span className="teamSettings__label">이름</span>
                <input
                  className="teamForm__input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  required
                />
              </label>
              <label className="teamSettings__field">
                <span className="teamSettings__label">소개</span>
                <textarea
                  className="teamForm__textarea"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="팀에 대해 간단히 적어 주세요."
                  maxLength={200}
                />
              </label>
              <div className="teamSettings__field">
                <span className="teamSettings__label">팀 색상</span>
                <div className="teamForm__colors" role="group" aria-label="추천 색상">
                  {TEAM_COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`teamForm__colorBtn${teamColor === color ? " teamForm__colorBtn--selected" : ""}`}
                      style={{ backgroundColor: color }}
                      aria-label={`색상 ${color}`}
                      aria-pressed={teamColor === color}
                      onClick={() => setTeamColor(color)}
                    />
                  ))}
                </div>
                <div className="teamForm__customColor">
                  <label
                    className="teamForm__customColorLabel"
                    htmlFor="team-settings-color"
                  >
                    <span
                      className={`teamForm__colorBtn teamForm__colorBtn--custom${!isTeamColorPreset(teamColor) ? " teamForm__colorBtn--selected" : ""}`}
                      style={{ backgroundColor: teamColor }}
                      aria-hidden
                    />
                    <span className="teamForm__customColorText">직접 선택</span>
                  </label>
                  <input
                    id="team-settings-color"
                    className="teamForm__colorInput"
                    type="color"
                    value={teamColor}
                    onChange={(e) => setTeamColor(e.target.value.toUpperCase())}
                    aria-label="팀 색상 직접 선택"
                  />
                </div>
                {isTeamColorTooDark(teamColor) || isTeamColorTooLight(teamColor) ? (
                  <p className="teamSettings__colorHint">
                    <span
                      className="teamSettings__colorHintSwatch"
                      style={{ background: toVisibleTeamColor(teamColor) }}
                      aria-hidden
                    />
                    {isTeamColorTooDark(teamColor) ? "어두운" : "밝은"} 색은 화면에서 잘 보이도록
                    이렇게 조금 {isTeamColorTooDark(teamColor) ? "밝혀서" : "어둡게"} 보여줘요.
                  </p>
                ) : null}
              </div>
              <div className="teamSettings__formFoot">
                {infoChanged ? (
                  <span className="teamSettings__dirty">저장하지 않은 변경이 있어요</span>
                ) : null}
                <button
                  type="submit"
                  className="teamSettings__saveBtn"
                  disabled={!name.trim() || savingInfo || !infoChanged}
                >
                  {savingInfo ? "저장 중…" : "저장"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="teamSettings__section" aria-labelledby="team-settings-members">
          <h2 id="team-settings-members" className="teamSettings__sectionTitle">
            멤버 <span className="teamSettings__count">{members.length}</span>
          </h2>
          <ul className="teamSettings__memberList">
            {members.map((member) => {
              const memberId = String(member?._id ?? member);
              const displayName = getMemberDisplayName(member);
              const isLeaderMember = String(team.leaderId) === memberId;
              const isCoLeaderMember = isCoTeamLeader(team, memberId);
              const isMe = String(user?._id) === memberId;
              const canManageCoLeader = mainLeader && !isLeaderMember;
              const canTransfer = mainLeader && !isLeaderMember;
              const canRemove =
                leader && !isLeaderMember && (mainLeader || !isCoLeaderMember);
              const hasActions = canManageCoLeader || canTransfer || canRemove;
              const isOpen = openMemberId === memberId;
              const isBusy =
                removingMemberId === memberId ||
                transferringMemberId === memberId ||
                coLeaderMemberId === memberId;

              const runAction = (action) => {
                setOpenMemberId(null);
                void action();
              };

              return (
                <li key={memberId} className="teamSettings__member">
                  <div className="teamSettings__memberRow">
                    <span className="teamSettings__memberName">{displayName}</span>
                    {isMe ? <span className="teamSettings__me">나</span> : null}
                    {isLeaderMember ? (
                      <span className="teamSettings__memberBadge">곡장</span>
                    ) : null}
                    {isCoLeaderMember ? (
                      <span className="teamSettings__memberBadge teamSettings__memberBadge--coLeader">
                        부곡장
                      </span>
                    ) : null}
                    {hasActions ? (
                      <button
                        type="button"
                        className={`teamSettings__memberMore${isOpen ? " teamSettings__memberMore--open" : ""}`}
                        onClick={() =>
                          setOpenMemberId((prev) => (prev === memberId ? null : memberId))
                        }
                        aria-expanded={isOpen}
                        aria-label={`${displayName} 관리`}
                        disabled={memberBusy}
                      >
                        {isBusy ? "…" : <IoEllipsisHorizontal aria-hidden />}
                      </button>
                    ) : null}
                  </div>
                  {hasActions && isOpen ? (
                    <div className="teamSettings__memberActions">
                      {canManageCoLeader ? (
                        <button
                          type="button"
                          className="teamSettings__memberAction"
                          onClick={() =>
                            runAction(() => handleSetCoLeader(member, !isCoLeaderMember))
                          }
                          disabled={memberBusy}
                        >
                          {isCoLeaderMember ? "부곡장 해임" : "부곡장 임명"}
                        </button>
                      ) : null}
                      {canTransfer ? (
                        <button
                          type="button"
                          className="teamSettings__memberAction"
                          onClick={() => runAction(() => handleTransferLeader(member))}
                          disabled={memberBusy}
                        >
                          곡장 위임
                        </button>
                      ) : null}
                      {canRemove ? (
                        <button
                          type="button"
                          className="teamSettings__memberAction teamSettings__memberAction--danger"
                          onClick={() => runAction(() => handleRemoveMember(member))}
                          disabled={memberBusy}
                        >
                          내보내기
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        {mainLeader ? (
          <section
            className="teamSettings__section teamSettings__section--danger"
            aria-labelledby="team-settings-delete"
          >
            <div className="teamSettings__dangerText">
              <h2 id="team-settings-delete" className="teamSettings__sectionTitle">
                팀 삭제
              </h2>
              <p className="teamSettings__dangerHint">
                팀과 연습 일정이 삭제되며 되돌릴 수 없어요. 연습실 사용 기록만 동아리 결산용으로 남아요.
              </p>
            </div>
            <button
              type="button"
              className="teamSettings__dangerBtn"
              onClick={() => void handleDeleteTeam()}
              disabled={deletingTeam}
            >
              {deletingTeam ? "삭제 중…" : "팀 삭제"}
            </button>
          </section>
        ) : !leader ? (
          <section
            className="teamSettings__section teamSettings__section--danger"
            aria-labelledby="team-settings-quit"
          >
            <div className="teamSettings__dangerText">
              <h2 id="team-settings-quit" className="teamSettings__sectionTitle">
                팀 탈퇴
              </h2>
              <p className="teamSettings__dangerHint">
                탈퇴하면 이 팀의 일정·캘린더를 더 볼 수 없어요.
              </p>
            </div>
            <button
              type="button"
              className="teamSettings__dangerBtn"
              onClick={() => void handleQuit()}
              disabled={quitting}
            >
              {quitting ? "처리 중…" : "팀 탈퇴"}
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default TeamSettings;
