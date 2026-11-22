import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  IoChevronBack,
  IoChevronForward,
  IoCheckmarkCircle,
  IoShareOutline,
} from "react-icons/io5";
import apiClient from "../../../api/apiClient";
import { createPoll } from "../../../api/pollApi";
import { useAuth } from "../../../context/AuthContext";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import ClubPageSkeleton from "../ClubPageSkeleton";
import {
  buildMonthGrid,
  formatDateKey,
  parsePracticeDateKeys,
  WEEK_LABELS,
} from "../Team/teamCalendarUtils";
import { isTeamLeader } from "../Team/teamUtils";
import {
  POLL_DEFAULT_END_HOUR,
  POLL_DEFAULT_START_HOUR,
  POLL_MAX_DATES,
  formatPollDatesSummary,
  formatPollHour,
  getPollUrl,
  sharePollLink,
} from "./pollUtils";
import { toVisibleTeamColor } from "../Team/teamColorPresets";
import "../Team/Team.css";
import "./Poll.css";

const TIME_PRESETS = [
  { label: "오후·저녁", start: 13, end: 24 },
  { label: "낮", start: 10, end: 22 },
  { label: "저녁", start: 18, end: 24 },
  { label: "하루 종일", start: 0, end: 24 },
];

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const PollCreate = () => {
  const { teamId } = useParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const modal = useManchuiModal();
  const { user } = useAuth();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const todayKey = formatDateKey(new Date());
  const initialDates = useMemo(
    () => parsePracticeDateKeys(searchParams).filter((key) => key >= todayKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [selectedDates, setSelectedDates] = useState(() => new Set(initialDates));
  const [viewMonth, setViewMonth] = useState(() => {
    const base = initialDates[0] ? new Date(`${initialDates[0]}T00:00:00`) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [startHour, setStartHour] = useState(POLL_DEFAULT_START_HOUR);
  const [endHour, setEndHour] = useState(POLL_DEFAULT_END_HOUR);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiClient.get(`/api/team/${teamId}`);
        const nextTeam = res.data?.team ?? null;
        if (cancelled) return;
        if (!nextTeam || !isTeamLeader(nextTeam, user?._id)) {
          setForbidden(true);
        } else {
          setTeam(nextTeam);
        }
      } catch {
        if (!cancelled) setForbidden(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId, user?._id]);

  const monthCells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const sortedDates = useMemo(() => [...selectedDates].sort(), [selectedDates]);

  const toggleDate = (dateKey) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else if (next.size < POLL_MAX_DATES) next.add(dateKey);
      return next;
    });
  };

  const selectNextDays = (count) => {
    const today = new Date();
    const next = new Set();
    for (let i = 0; i < count; i += 1) next.add(formatDateKey(addDays(today, i)));
    setSelectedDates(next);
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const selectWeekends = () => {
    const today = new Date();
    const next = new Set();
    for (let i = 0; i < 28; i += 1) {
      const date = addDays(today, i);
      if (date.getDay() === 0 || date.getDay() === 6) next.add(formatDateKey(date));
    }
    setSelectedDates(next);
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || sortedDates.length === 0 || startHour >= endHour) return;
    setSubmitting(true);
    try {
      const poll = await createPoll({
        teamId,
        dates: sortedDates,
        startHour,
        endHour,
      });
      setCreated(poll);
    } catch (error) {
      await modal(error.response?.data?.message ?? "일정 종합을 만들지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="teamPage">
        <button type="button" className="teamPage__back" onClick={() => nav(`/club/team/${teamId}`)}>
          ← 팀으로
        </button>
        <ClubPageSkeleton variant="form" />
      </div>
    );
  }

  if (forbidden || !team) {
    return (
      <div className="teamPage">
        <button
          type="button"
          className="teamPage__back"
          onClick={() => nav(`/club/team/${teamId}`)}
        >
          ← 팀으로
        </button>
        <p className="teamPage__intro">곡장·부곡장만 일정 종합을 만들 수 있습니다.</p>
      </div>
    );
  }

  const accent = toVisibleTeamColor(team.teamColor, "#ff453a");

  if (created) {
    return (
      <div className="teamPage" style={{ "--team-accent": accent }}>
        <div className="pollCard pollDone">
          <IoCheckmarkCircle className="pollDone__icon" aria-hidden />
          <p className="pollCard__title">일정 종합을 만들었어요</p>
          <p className="pollCard__muted">
            링크를 단톡방에 뿌려 주세요. 만취 계정이 없는 사람도 이름과 비밀번호만으로
            응답할 수 있어요.
          </p>
          <p className="pollDone__url">{getPollUrl(created._id)}</p>
          <button
            type="button"
            className="pollBtn pollBtn--primary pollBtn--block"
            onClick={() => void sharePollLink(created, team.name, modal)}
          >
            <IoShareOutline aria-hidden /> 링크 공유하기
          </button>
          <button
            type="button"
            className="pollBtn pollBtn--secondary pollBtn--block"
            onClick={() => nav(`/club/poll/${created._id}`)}
          >
            내 시간 먼저 입력하기
          </button>
          <button
            type="button"
            className="pollBtn pollBtn--text"
            onClick={() => nav(`/club/team/${teamId}`, { replace: true })}
          >
            팀으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const hourOptions = Array.from({ length: 25 }, (_, i) => i);
  const slotCount = sortedDates.length * Math.max(0, endHour - startHour);

  return (
    <div className="teamPage" style={{ "--team-accent": accent }}>
      <button
        type="button"
        className="teamPage__back"
        onClick={() => nav(`/club/team/${teamId}`)}
      >
        ← {team.name}
      </button>

      <div className="teamPage__top">
        <h1 className="teamPage__title">일정 종합 만들기</h1>
        <p className="teamPage__intro">
          후보 날짜와 시간대를 정하면 링크가 만들어져요. 팀원들이 가능한 시간을 칠하면
          추천 연습시간을 알려 드려요.
        </p>
      </div>

      <form className="teamForm" onSubmit={handleSubmit}>
        <div className="teamForm__card">
          <div className="teamForm__field">
            <div className="pollCreate__labelRow">
              <span className="teamForm__label">후보 날짜</span>
              <span className="pollCreate__count">
                {sortedDates.length > 0 ? `${sortedDates.length}일 선택` : "날짜를 눌러 선택"}
              </span>
            </div>
            <div className="pollCreate__quick">
              <button type="button" className="pollChipBtn" onClick={() => selectNextDays(7)}>
                오늘부터 7일
              </button>
              <button type="button" className="pollChipBtn" onClick={() => selectNextDays(14)}>
                2주
              </button>
              <button type="button" className="pollChipBtn" onClick={selectWeekends}>
                4주간 주말
              </button>
              {sortedDates.length > 0 ? (
                <button
                  type="button"
                  className="pollChipBtn pollChipBtn--muted"
                  onClick={() => setSelectedDates(new Set())}
                >
                  초기화
                </button>
              ) : null}
            </div>

            <div className="pollCal">
              <div className="pollCal__nav">
                <button
                  type="button"
                  className="pollCal__navBtn"
                  onClick={() =>
                    setViewMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                    )
                  }
                  aria-label="이전 달"
                >
                  <IoChevronBack aria-hidden />
                </button>
                <span className="pollCal__month">
                  {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
                </span>
                <button
                  type="button"
                  className="pollCal__navBtn"
                  onClick={() =>
                    setViewMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                    )
                  }
                  aria-label="다음 달"
                >
                  <IoChevronForward aria-hidden />
                </button>
              </div>
              <div className="pollCal__grid">
                {WEEK_LABELS.map((label) => (
                  <span key={label} className="pollCal__week">
                    {label}
                  </span>
                ))}
                {monthCells.map((cell) => {
                  if (!cell.date) return <span key={cell.key} />;
                  const dateKey = cell.key;
                  const past = dateKey < todayKey;
                  const on = selectedDates.has(dateKey);
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      className={[
                        "pollCal__day",
                        on ? "pollCal__day--on" : "",
                        dateKey === todayKey ? "pollCal__day--today" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={past}
                      aria-pressed={on}
                      onClick={() => toggleDate(dateKey)}
                    >
                      {cell.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
            {sortedDates.length > 0 ? (
              <p className="teamForm__hint">{formatPollDatesSummary(sortedDates)}</p>
            ) : null}
          </div>
        </div>

        <div className="teamForm__card">
          <div className="teamForm__field">
            <span className="teamForm__label">시간대</span>
            <div className="pollCreate__quick">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={[
                    "pollChipBtn",
                    preset.start === startHour && preset.end === endHour
                      ? "pollChipBtn--on"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setStartHour(preset.start);
                    setEndHour(preset.end);
                  }}
                >
                  {preset.label} {formatPollHour(preset.start)}–{formatPollHour(preset.end)}
                </button>
              ))}
            </div>
            <div className="pollCreate__range">
              <label className="pollCreate__select">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  aria-label="시작 시각"
                >
                  {hourOptions.slice(0, 24).map((hour) => (
                    <option key={hour} value={hour}>
                      {formatPollHour(hour)}
                    </option>
                  ))}
                </select>
              </label>
              <span aria-hidden>부터</span>
              <label className="pollCreate__select">
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  aria-label="끝 시각"
                >
                  {hourOptions.slice(1).map((hour) => (
                    <option key={hour} value={hour} disabled={hour <= startHour}>
                      {formatPollHour(hour)}
                    </option>
                  ))}
                </select>
              </label>
              <span aria-hidden>까지</span>
            </div>
            {startHour >= endHour ? (
              <p className="pollError">끝 시각은 시작 시각보다 늦어야 해요.</p>
            ) : (
              <p className="teamForm__hint">
                1시간 단위 · 하루 {endHour - startHour}칸 · 총 {slotCount}칸
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="teamForm__submit"
          disabled={submitting || sortedDates.length === 0 || startHour >= endHour}
        >
          {submitting ? "만드는 중…" : "만들고 링크 받기"}
        </button>
      </form>
    </div>
  );
};

export default PollCreate;
