import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { useInvalidateClubTeams } from "../../../queries/useClubQueries";
import {
  DEFAULT_TEAM_COLOR,
  isTeamColorPreset,
  TEAM_COLOR_PRESETS,
  toVisibleTeamColor,
} from "./teamColorPresets";
import "./Team.css";

const TeamCreate = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const modal = useManchuiModal();
  const invalidateTeams = useInvalidateClubTeams(user?._id);

  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [teamColor, setTeamColor] = useState(DEFAULT_TEAM_COLOR);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || !user?._id) return;

    setSubmitting(true);
    try {
      const res = await apiClient.post(
        "/api/team/create",
        {
          name: name.trim(),
          comment: comment.trim() || "작성해 주세요.",
          userId: user._id,
          teamColor,
        },
        { withCredentials: true },
      );
      await modal(res.data?.message ?? "팀 생성이 완료되었습니다.");
      invalidateTeams();
      const teamId = res.data?.team?._id;
      if (teamId) {
        nav(`/club/team/${teamId}`, { replace: true });
      } else {
        nav("/club/team", { replace: true });
      }
    } catch (error) {
      await modal(
        error.response?.data?.message ?? "팀 생성에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const previewName = name.trim() || "팀 이름";
  const previewComment = comment.trim() || "팀 소개가 여기에 보여요";
  const visibleColor = toVisibleTeamColor(teamColor);

  return (
    <div className="teamPage teamPage--create" style={{ "--team-accent": visibleColor }}>
      <button
        type="button"
        className="teamPage__back"
        onClick={() => nav("/club/team")}
      >
        ← 팀 목록
      </button>

      <header className="teamCreate__head">
        <h1 className="teamPage__title">팀 만들기</h1>
        <p className="teamCreate__sub">만든 사람이 곡장이 돼요</p>
      </header>

      {/* 입력하는 대로 바뀌는 미리보기 */}
      <div className="teamCreate__preview" aria-hidden="true">
        <span className="teamCreate__previewMark" />
        <div className="teamCreate__previewText">
          <strong className={name.trim() ? "" : "teamCreate__previewPlaceholder"}>
            {previewName}
          </strong>
          <small className={comment.trim() ? "" : "teamCreate__previewPlaceholder"}>
            {previewComment}
          </small>
        </div>
        <span className="teamCreate__previewMeta">멤버 1명</span>
      </div>

      <form className="teamCreate__form" onSubmit={handleSubmit}>
        <div className="teamSettings__field">
          <label className="teamSettings__label" htmlFor="team-name">
            팀 이름
          </label>
          <input
            id="team-name"
            className="teamForm__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 만취 A팀"
            maxLength={40}
            autoComplete="off"
            required
          />
        </div>

        <div className="teamSettings__field">
          <label className="teamSettings__label" htmlFor="team-comment">
            팀 소개 <span className="teamCreate__optional">선택</span>
          </label>
          <textarea
            id="team-comment"
            className="teamForm__textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="어떤 곡을 하는 팀인지 간단히 적어 주세요."
            maxLength={200}
          />
          <span className="teamCreate__counter">{comment.length}/200</span>
        </div>

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
            <label className="teamForm__customColorLabel" htmlFor="team-color-custom">
              <span
                className={`teamForm__colorBtn teamForm__colorBtn--custom${!isTeamColorPreset(teamColor) ? " teamForm__colorBtn--selected" : ""}`}
                style={{ backgroundColor: teamColor }}
                aria-hidden
              />
              <span className="teamForm__customColorText">직접 선택</span>
            </label>
            <input
              id="team-color-custom"
              className="teamForm__colorInput"
              type="color"
              value={teamColor}
              onChange={(e) => setTeamColor(e.target.value.toUpperCase())}
              aria-label="팀 색상 직접 선택"
            />
          </div>
        </div>

        <button type="submit" className="teamCreate__submit" disabled={!canSubmit}>
          {submitting ? "만드는 중…" : "팀 만들기"}
        </button>
      </form>
    </div>
  );
};

export default TeamCreate;
