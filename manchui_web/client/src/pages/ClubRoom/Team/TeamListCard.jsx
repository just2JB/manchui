import React from "react";
import {
  IoCalendarOutline,
  IoChevronForward,
  IoPeopleOutline,
} from "react-icons/io5";

function isDefaultComment(comment) {
  const c = String(comment ?? "").trim();
  return !c || c === "작성해 주세요.";
}

const TeamListCard = ({
  team,
  isLeader,
  isActive,
  onClick,
}) => {
  const color = team.teamColor || "#E87070";
  const memberCount = Array.isArray(team.members) ? team.members.length : 0;
  const requestCount = Array.isArray(team.requestSchedules)
    ? team.requestSchedules.length
    : 0;
  const showComment = !isDefaultComment(team.comment);

  return (
    <button
      type="button"
      className="teamListCard"
      onClick={onClick}
      style={{ "--team-accent": color }}
    >
      <span className="teamListCard__logoMark" aria-hidden />

      <span className="teamListCard__main">
        <span className="teamListCard__titleRow">
          <span className="teamListCard__name">{team.name}</span>
          {isLeader ? (
            <span className="teamListCard__badge teamListCard__badge--leader">
              팀장
            </span>
          ) : null}
          {isActive ? (
            <span className="teamListCard__badge teamListCard__badge--active">
              연습 중
            </span>
          ) : null}
        </span>

        <span className="teamListCard__chips">
          <span className="teamListCard__chip">
            <IoPeopleOutline className="teamListCard__chipIcon" aria-hidden />
            멤버 {memberCount}명
          </span>
          {requestCount > 0 ? (
            <span className="teamListCard__chip teamListCard__chip--accent">
              <IoCalendarOutline className="teamListCard__chipIcon" aria-hidden />
              취합 {requestCount}일
            </span>
          ) : null}
        </span>

        {showComment ? (
          <span className="teamListCard__comment">{team.comment}</span>
        ) : (
          <span className="teamListCard__comment teamListCard__comment--muted">
            팀 소개가 아직 없습니다
          </span>
        )}
      </span>

      <IoChevronForward className="teamListCard__chevron" aria-hidden />
    </button>
  );
};

export default TeamListCard;
