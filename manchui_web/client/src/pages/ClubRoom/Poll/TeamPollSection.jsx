import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoAdd, IoShareOutline } from "react-icons/io5";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { deletePoll, updatePoll } from "../../../api/pollApi";
import PollAggregate from "./PollAggregate";
import PollGrid from "./PollGrid";
import {
  getPendingTeamMembers,
  getRespondents,
  isPollActive,
  sharePollLink,
} from "./pollUtils";
import { getMemberDisplayName } from "../Team/teamUtils";
import "./Poll.css";

const PLACEHOLDER_HOURS = [17, 18, 19, 20, 21, 22];
const EMPTY_HEATMAP = { slots: new Map(), total: 0, max: 0, respondents: [] };

/** 오늘부터 n일의 날짜 키 (빈 표 모양용) */
function nextDateKeys(n) {
  const out = [];
  const base = new Date();
  for (let i = 0; i < n; i += 1) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    out.push(`${d.getFullYear()}-${mm}-${dd}`);
  }
  return out;
}

/** "11/24–11/27" (하루면 "11/24") */
function formatPollRange(dates) {
  const keys = [...(dates ?? [])].sort();
  if (keys.length === 0) return "—";
  const short = (key) => {
    const [, m, d] = key.split("-").map(Number);
    return `${m}/${d}`;
  };
  return keys.length === 1 ? short(keys[0]) : `${short(keys[0])}–${short(keys[keys.length - 1])}`;
}

const PollCard = ({ poll, team, teamId, isLeader, currentUserId, onChanged, onDeleted }) => {
  const nav = useNavigate();
  const modal = useManchuiModal();
  const [busy, setBusy] = useState(false);
  const [showWho, setShowWho] = useState(false);
  const active = isPollActive(poll);
  const respondents = getRespondents(poll);
  const responded = respondents.some(
    (response) => currentUserId && String(response.userId) === String(currentUserId),
  );
  const teamMembers = (Array.isArray(team.members) ? team.members : []).map(
    (member) => ({
      _id: String(member?._id ?? member),
      username: getMemberDisplayName(member),
    }),
  );
  const pending = getPendingTeamMembers(poll, teamMembers);

  const toggleClosed = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await updatePoll(poll._id, { closed: !poll.closed });
      if (next) onChanged(next);
    } catch (error) {
      await modal(error.response?.data?.message ?? "변경하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    const ok = await modal(
      `${formatPollRange(poll.dates)} 일정 종합과 응답을 모두 삭제할까요?`,
      "confirm",
    );
    if (!ok) return;
    setBusy(true);
    try {
      await deletePoll(poll._id);
      onDeleted(poll._id);
    } catch (error) {
      await modal(error.response?.data?.message ?? "삭제하지 못했습니다.");
      setBusy(false);
    }
  };

  return (
    <article className={`teamPollCard${active ? "" : " teamPollCard--done"}`}>
      {/* 취합된 일정: 모두의 가능 시간 (칸을 누르면 가능/불가 명단) */}
      <PollAggregate poll={poll} showLegend={false} />

      {/* 응답 현황 · 내 시간 · 링크 공유: 한 박스로 */}
      <div className="teamPollCard__panel">
      <div className="teamPollCard__actions">
        <button
          type="button"
          className="teamPollCard__count"
          aria-expanded={showWho}
          onClick={() => setShowWho((v) => !v)}
        >
          <strong>{respondents.length}</strong>명 응답
        </button>
        {active ? (
          <>
            <button
              type="button"
              className="pollBtn pollBtn--primary"
              onClick={() => nav(`/club/poll/${poll._id}`)}
            >
              {responded ? "내 시간 수정" : "내 시간 입력"}
            </button>
            <button
              type="button"
              className="pollBtn pollBtn--ghost"
              onClick={() => void sharePollLink(poll, team.name, modal)}
            >
              <IoShareOutline aria-hidden /> 링크 공유
            </button>
          </>
        ) : (
          <button
            type="button"
            className="pollBtn pollBtn--ghost"
            onClick={() => nav(`/club/poll/${poll._id}`)}
          >
            결과 보기
          </button>
        )}
      </div>

      {/* 'n명 응답'을 누르면 누가 응답했는지 */}
      {showWho ? (
        <div className="teamPollCard__who">
          <p className="teamPollCard__whoLabel">응답 {respondents.length}</p>
          <ul className="teamPollCard__whoList">
            {respondents.length === 0 ? <li className="teamPollCard__whoNone">아직 없어요</li> : null}
            {respondents.map((response) => (
              <li key={response._id} className="pollChip pollChip--ok">
                {response.name}
              </li>
            ))}
          </ul>
          {pending.length > 0 ? (
            <>
              <p className="teamPollCard__whoLabel">미응답 {pending.length}</p>
              <ul className="teamPollCard__whoList">
                {pending.map((member) => (
                  <li key={member._id} className="pollChip pollChip--no">
                    {member.username}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
      </div>

      {isLeader ? (
        <div className="teamPollCard__admin">
          <button
            type="button"
            className="pollBtn pollBtn--text"
            onClick={() => void toggleClosed()}
            disabled={busy}
          >
            {poll.closed ? "다시 열기" : "마감하기"}
          </button>
          <button
            type="button"
            className="pollBtn pollBtn--text pollBtn--danger"
            onClick={() => void remove()}
            disabled={busy}
          >
            삭제
          </button>
        </div>
      ) : null}

    </article>
  );
};

const TeamPollSection = ({
  team,
  teamId,
  polls = [],
  loading = false,
  isLeader = false,
  currentUserId,
  onPollChanged,
  onPollDeleted,
}) => {
  const nav = useNavigate();
  // 진행 중 → 지난·마감 순으로 한 줄에. 진행 중인 게 없어도 지난 일정 종합을 바로 볼 수 있다.
  const ordered = [
    ...polls.filter(isPollActive),
    ...polls.filter((poll) => !isPollActive(poll)),
  ];
  const [selectedId, setSelectedId] = useState(null);
  const [placeholderDates] = useState(() => nextDateKeys(5));
  const current = ordered.find((poll) => poll._id === selectedId) ?? ordered[0] ?? null;

  return (
    <section className="teamPolls teamPolls--flat" aria-labelledby="team-polls-title">
      <div className="teamPolls__head">
        <h2 id="team-polls-title" className="teamPolls__title">
          일정 종합
          {ordered.length > 1 ? (
            <span className="teamPolls__countBadge">{ordered.length}</span>
          ) : null}
        </h2>
        {isLeader && ordered.length > 0 ? (
          <button
            type="button"
            className="teamPolls__new"
            onClick={() => nav(`/club/team/${teamId}/poll/new`)}
          >
            <IoAdd aria-hidden /> 새 일정 종합
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="teamPolls__empty">불러오는 중…</p>
      ) : ordered.length === 0 ? (
        /* 일정 종합이 없을 때: 빈 표 모양을 흐리게 깔고 그 위에 시작 버튼 */
        <div className="teamPolls__placeholder">
          <div className="teamPolls__placeholderGrid" aria-hidden="true">
            <PollGrid
              dates={placeholderDates}
              hours={PLACEHOLDER_HOURS}
              mode="view"
              heatmap={EMPTY_HEATMAP}
              disabled
            />
          </div>
          <div className="teamPolls__placeholderDim">
            {isLeader ? (
              <button
                type="button"
                className="teamPolls__startBtn"
                onClick={() => nav(`/club/team/${teamId}/poll/new`)}
              >
                <IoAdd aria-hidden /> 일정 종합 시작하기
              </button>
            ) : (
              <p className="teamPolls__startHint">팀장이 일정 종합을 시작하면 여기에 보여요</p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 일정 종합이 여러 개일 때만: 날짜 범위로 고르기 */}
          {ordered.length > 1 ? (
            <div className="teamPolls__switch" role="tablist" aria-label="일정 종합 선택">
              {ordered.map((poll) => {
                const on = poll._id === current?._id;
                return (
                  <button
                    key={poll._id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    className="teamPolls__switchBtn"
                    onClick={() => setSelectedId(poll._id)}
                  >
                    {formatPollRange(poll.dates)}
                    {isPollActive(poll) ? null : <span className="teamPolls__switchTag">마감</span>}
                  </button>
                );
              })}
            </div>
          ) : null}
          {current ? (
            <PollCard
              key={current._id}
              poll={current}
              team={team}
              teamId={teamId}
              isLeader={isLeader}
              currentUserId={currentUserId}
              onChanged={onPollChanged}
              onDeleted={onPollDeleted}
            />
          ) : null}
        </>
      )}
    </section>
  );
};

export default TeamPollSection;
