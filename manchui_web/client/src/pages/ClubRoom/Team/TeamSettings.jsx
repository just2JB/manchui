import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import Loading from "../../../components/Loading/Loading";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import {
  getMemberDisplayName,
  isCoTeamLeader,
  isDefaultComment,
  isMainTeamLeader,
  isTeamLeader,
  isTeamMember,
} from "./teamUtils";
import "./Team.css";

const TeamSettings = () => {
  const { teamId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const modal = useManchuiModal();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
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
  const accent = team?.teamColor || "#E87070";
  const members = Array.isArray(team?.members) ? team.members : [];

  const handleSaveName = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || savingName || !leader) return;
    setSavingName(true);
    try {
      await apiClient.post(
        "/api/team/edit",
        { teamId, name: trimmed },
        { withCredentials: true },
      );
      await modal("팀 이름이 수정되었습니다.");
      await loadTeam();
    } catch (error) {
      await modal(error.response?.data?.message ?? "이름 수정에 실패했습니다.");
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveComment = async (e) => {
    e.preventDefault();
    if (savingComment || !leader) return;
    setSavingComment(true);
    try {
      await apiClient.post(
        "/api/team/edit",
        {
          teamId,
          comment: comment.trim() || "작성해 주세요.",
        },
        { withCredentials: true },
      );
      await modal("팀 소개가 수정되었습니다.");
      await loadTeam();
    } catch (error) {
      await modal(error.response?.data?.message ?? "소개 수정에 실패했습니다.");
    } finally {
      setSavingComment(false);
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
        "팀을 삭제하면 연습 일정 등 모든 데이터가 사라지며 복구할 수 없습니다. 정말 삭제하시겠습니까?",
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
        <Loading />
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

  return (
    <div
      className="teamPage teamPage--settings"
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
        <h1 className="teamPage__title">팀 설정</h1>
        <p className="teamPage__intro">
          {mainLeader
            ? "곡장으로 팀을 관리할 수 있습니다."
            : leader
              ? "부곡장 권한으로 팀을 관리할 수 있습니다."
              : "팀 탈퇴만 이용할 수 있습니다."}
        </p>
      </div>

      {leader ? (
        <div className="teamSettings">
          <section
            className="teamSettings__section"
            aria-labelledby="team-settings-members"
          >
            <h2
              id="team-settings-members"
              className="teamSettings__sectionTitle"
            >
              멤버 관리
            </h2>
            <ul className="teamSettings__memberList">
              {members.map((member) => {
                const memberId = String(member?._id ?? member);
                const isLeaderMember = String(team.leaderId) === memberId;
                const isCoLeaderMember = isCoTeamLeader(team, memberId);
                const isRemoving = removingMemberId === memberId;
                const isTransferring = transferringMemberId === memberId;
                const isCoLeaderBusy = coLeaderMemberId === memberId;
                const memberBusy = Boolean(
                  removingMemberId || transferringMemberId || coLeaderMemberId,
                );
                const canManageCoLeader = mainLeader && !isLeaderMember;
                const canTransfer = mainLeader && !isLeaderMember;
                const canRemove =
                  !isLeaderMember &&
                  (mainLeader || !isCoLeaderMember);

                return (
                  <li key={memberId} className="teamSettings__memberRow">
                    <div className="teamSettings__memberMain">
                      <span className="teamSettings__memberName">
                        {getMemberDisplayName(member)}
                      </span>
                      {isLeaderMember ? (
                        <span className="teamSettings__memberBadge">곡장</span>
                      ) : null}
                      {isCoLeaderMember ? (
                        <span className="teamSettings__memberBadge teamSettings__memberBadge--coLeader">
                          부곡장
                        </span>
                      ) : null}
                    </div>
                    {canManageCoLeader || canTransfer || canRemove ? (
                      <div className="teamSettings__memberActions">
                        {canManageCoLeader ? (
                          <button
                            type="button"
                            className="teamSettings__memberCoLeader"
                            onClick={() =>
                              void handleSetCoLeader(member, !isCoLeaderMember)
                            }
                            disabled={memberBusy}
                          >
                            {isCoLeaderBusy
                              ? "처리 중…"
                              : isCoLeaderMember
                                ? "부곡장 해임"
                                : "부곡장 임명"}
                          </button>
                        ) : null}
                        {canTransfer ? (
                          <button
                            type="button"
                            className="teamSettings__memberTransfer"
                            onClick={() => void handleTransferLeader(member)}
                            disabled={memberBusy}
                          >
                            {isTransferring ? "처리 중…" : "곡장 위임"}
                          </button>
                        ) : null}
                        {canRemove ? (
                          <button
                            type="button"
                            className="teamSettings__memberRemove"
                            onClick={() => void handleRemoveMember(member)}
                            disabled={memberBusy}
                          >
                            {isRemoving ? "처리 중…" : "내보내기"}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            className="teamSettings__section"
            aria-labelledby="team-settings-name"
          >
            <h2 id="team-settings-name" className="teamSettings__sectionTitle">
              이름 수정
            </h2>
            <form className="teamSettings__form" onSubmit={handleSaveName}>
              <input
                className="teamForm__input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                required
              />
              <button
                type="submit"
                className="teamSettings__saveBtn"
                disabled={!name.trim() || savingName}
              >
                {savingName ? "저장 중…" : "저장"}
              </button>
            </form>
          </section>

          <section
            className="teamSettings__section"
            aria-labelledby="team-settings-intro"
          >
            <h2 id="team-settings-intro" className="teamSettings__sectionTitle">
              소개 수정
            </h2>
            <form className="teamSettings__form" onSubmit={handleSaveComment}>
              <textarea
                className="teamForm__textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="팀에 대해 간단히 적어 주세요."
                maxLength={200}
              />
              <button
                type="submit"
                className="teamSettings__saveBtn"
                disabled={savingComment}
              >
                {savingComment ? "저장 중…" : "저장"}
              </button>
            </form>
          </section>

          {mainLeader ? (
            <section
              className="teamSettings__section teamSettings__section--danger"
              aria-labelledby="team-settings-delete"
            >
              <h2
                id="team-settings-delete"
                className="teamSettings__sectionTitle"
              >
                팀 삭제
              </h2>
              <p className="teamSettings__dangerHint">
                팀과 연습 일정이 모두 삭제되며 되돌릴 수 없습니다.
              </p>
              <button
                type="button"
                className="teamSettings__dangerBtn"
                onClick={() => void handleDeleteTeam()}
                disabled={deletingTeam}
              >
                {deletingTeam ? "삭제 중…" : "팀 삭제"}
              </button>
            </section>
          ) : null}
        </div>
      ) : (
        <section
          className="teamSettings__section teamSettings__section--danger teamSettings__section--solo"
          aria-labelledby="team-settings-quit"
        >
          <h2 id="team-settings-quit" className="teamSettings__sectionTitle">
            팀 탈퇴
          </h2>
          <p className="teamSettings__dangerHint">
            탈퇴하면 이 팀의 일정·캘린더에 더 이상 접근할 수 없습니다.
          </p>
          <button
            type="button"
            className="teamSettings__dangerBtn"
            onClick={() => void handleQuit()}
            disabled={quitting}
          >
            {quitting ? "처리 중…" : "팀 탈퇴"}
          </button>
        </section>
      )}
    </div>
  );
};

export default TeamSettings;
