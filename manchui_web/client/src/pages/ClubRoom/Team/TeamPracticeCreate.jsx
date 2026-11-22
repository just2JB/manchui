import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import ClubPageSkeleton from "../ClubPageSkeleton";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { useInvalidateClubTeams } from "../../../queries/useClubQueries";
import { fetchPoll, fetchTeamPolls } from "../../../api/pollApi";
import TeamPracticeAvailabilityGrid from "./TeamPracticeAvailabilityGrid";
import {
  formatPollDatesSummary,
  getPollDisplayTitle,
  isGuestMemberId,
  isPollActive,
  mergePracticeGridData,
} from "../Poll/pollUtils";
import {
  buildBookedHoursByDate,
  formatHourRangeLabel,
} from "./practiceAvailabilityUtils";
import {
  formatDateKey,
  formatPracticeDatesSummary,
  parsePracticeDateKeys,
} from "./teamCalendarUtils";
import { isTeamLeader, getTeamLeaderIds } from "./teamUtils";
import { toVisibleTeamColor } from "./teamColorPresets";
import "./Team.css";

const NO_DATES = [];

/** '선택한 연습' 안의 직접 입력 폼: 날짜 · 시작 · 끝(시 숫자) → 목록에 추가 */
function ManualEntryForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => formatDateKey(new Date()));
  const [start, setStart] = useState("19");
  const [end, setEnd] = useState("21");

  if (!open) {
    return (
      <button
        type="button"
        className="practiceManual__open"
        onClick={() => setOpen(true)}
      >
        + 직접 입력
      </button>
    );
  }

  const startHour = Number(start);
  const endHour = Number(end);
  const startOk = start !== "" && Number.isInteger(startHour) && startHour >= 0 && startHour <= 23;
  const endOk = end !== "" && Number.isInteger(endHour) && endHour >= 1 && endHour <= 24;
  const valid = Boolean(date) && startOk && endOk && endHour > startHour;
  const error =
    start === "" || end === ""
      ? ""
      : !startOk
        ? "시작은 0~23시로 넣어 주세요"
        : !endOk
          ? "끝은 1~24시로 넣어 주세요"
          : endHour <= startHour
            ? "끝 시간이 시작보다 늦어야 해요"
            : "";

  const onlyDigits = (value) => value.replace(/[^0-9]/g, "").slice(0, 2);

  const handleAdd = () => {
    if (!valid) return;
    onAdd({ dateKey: date, startHour, endHour: endHour - 1 });
    setOpen(false);
  };

  return (
    <div className="practiceManual">
      <input
        type="date"
        className="practiceManual__input practiceManual__date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        aria-label="날짜"
      />
      <div className="practiceManual__time">
        <label className="practiceManual__hour">
          <input
            type="text"
            inputMode="numeric"
            className="practiceManual__input"
            value={start}
            onChange={(event) => setStart(onlyDigits(event.target.value))}
            aria-label="시작 시"
            placeholder="19"
          />
          <span>시</span>
        </label>
        <span className="practiceManual__dash" aria-hidden>
          –
        </span>
        <label className="practiceManual__hour">
          <input
            type="text"
            inputMode="numeric"
            className="practiceManual__input"
            value={end}
            onChange={(event) => setEnd(onlyDigits(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleAdd();
            }}
            aria-label="끝 시"
            placeholder="21"
          />
          <span>시</span>
        </label>
      </div>
      {error ? <p className="practiceManual__error">{error}</p> : null}
      <div className="practiceManual__actions">
        <button
          type="button"
          className="practiceManual__cancel"
          onClick={() => setOpen(false)}
        >
          닫기
        </button>
        <button
          type="button"
          className="practiceManual__add"
          disabled={!valid}
          onClick={handleAdd}
        >
          목록에 추가
        </button>
      </div>
    </div>
  );
}

const TeamPracticeCreate = () => {
  const { teamId } = useParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const modal = useManchuiModal();
  const invalidateTeams = useInvalidateClubTeams(user?._id);

  const pick = searchParams.get("pick");
  /** 팀 캘린더에서 날짜를 골라 들어온 경우: 일정 종합 대신 팀원 개인 일정 */
  const queryDateKeys = useMemo(
    () => parsePracticeDateKeys(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString()],
  );
  const dateMode = queryDateKeys.length > 0;

  const [team, setTeam] = useState(null);
  const [memberSchedules, setMemberSchedules] = useState([]);
  const [practices, setPractices] = useState([]);
  /** 이 팀의 모든 일정 종합 (진행 중 먼저) */
  const [teamPolls, setTeamPolls] = useState([]);
  /** 고른 일정 종합 id. null = 아직 안 정함 → 전체 선택 */
  const [selectedPollIds, setSelectedPollIds] = useState(null);
  /** 응답까지 불러온 일정 종합 { id: poll | false(실패) } */
  const [pollCache, setPollCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [manualEntries, setManualEntries] = useState([]);
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
        return;
      }
      setTeam(nextTeam);
      setMemberSchedules(
        Array.isArray(res.data?.memberSchedules) ? res.data.memberSchedules : [],
      );
      const [practiceResult, pollsResult] = await Promise.allSettled([
        apiClient.get(`/api/practice/teamPractice/${teamId}`, {
          withCredentials: true,
        }),
        fetchTeamPolls(teamId),
      ]);
      const polls =
        pollsResult.status === "fulfilled"
          ? [
              ...pollsResult.value.filter(isPollActive),
              ...pollsResult.value.filter((item) => !isPollActive(item)),
            ]
          : [];
      setTeamPolls(polls);
      setSelectedPollIds((prev) => prev ?? polls.map((item) => item._id));
      // 기존 연습 목록은 못 불러와도 페이지는 쓸 수 있게 둔다
      setPractices(
        practiceResult.status === "fulfilled" &&
          Array.isArray(practiceResult.value.data?.teamPractice)
          ? practiceResult.value.data.teamPractice
          : [],
      );
      setForbidden(false);
    } catch (error) {
      console.error(error);
      setForbidden(true);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [teamId, user?._id]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  // 고른 일정 종합 중 아직 응답을 안 불러온 것만 가져온다
  const activePollIds = useMemo(
    () => (dateMode ? [] : (selectedPollIds ?? [])),
    [dateMode, selectedPollIds],
  );
  useEffect(() => {
    const missing = activePollIds.filter((id) => !(id in pollCache));
    if (missing.length === 0) return;
    let cancelled = false;
    void Promise.all(
      missing.map((id) =>
        fetchPoll(id)
          .then((data) =>
            data?.poll && String(data.poll.teamId) === String(teamId)
              ? data.poll
              : false,
          )
          .catch(() => false),
      ),
    ).then((results) => {
      if (cancelled) return;
      setPollCache((prev) => {
        const next = { ...prev };
        missing.forEach((id, index) => {
          next[id] = results[index];
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [activePollIds, pollCache, teamId]);

  const pollsLoading = activePollIds.some((id) => !(id in pollCache));
  const selectedPolls = useMemo(
    () => activePollIds.map((id) => pollCache[id]).filter(Boolean),
    [activePollIds, pollCache],
  );
  const pollGrid = useMemo(
    () => mergePracticeGridData(selectedPolls),
    [selectedPolls],
  );

  const dateKeys = dateMode
    ? queryDateKeys
    : pollGrid
      ? pollGrid.dateKeys
      : NO_DATES;

  const togglePoll = (id) => {
    setSelectedPollIds((prev) => {
      const list = prev ?? [];
      return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    });
  };
  const allSelected =
    teamPolls.length > 0 && (selectedPollIds ?? []).length === teamPolls.length;

  const teamMemberIds = useMemo(
    () =>
      (Array.isArray(team?.members) ? team.members : []).map((member) =>
        String(member?._id ?? member),
      ),
    [team?.members],
  );

  // 매 렌더 새 배열이면 그리드 선택 계산 → onSelectionChange → 재렌더가 무한 반복된다
  const leaderIds = useMemo(() => (team ? getTeamLeaderIds(team) : []), [team]);

  const memberIds = pollGrid && !dateMode ? pollGrid.memberIds : teamMemberIds;
  const gridMembers =
    pollGrid && !dateMode
      ? pollGrid.members
      : Array.isArray(team?.members)
        ? team.members
        : [];
  const gridSchedules =
    pollGrid && !dateMode ? pollGrid.memberSchedules : memberSchedules;

  const guestNameById = useMemo(
    () =>
      new Map(
        (pollGrid?.members ?? [])
          .filter((member) => member.guestName)
          .map((member) => [member._id, member.guestName]),
      ),
    [pollGrid],
  );

  const bookedByDate = useMemo(
    () => buildBookedHoursByDate(practices, dateKeys),
    [practices, dateKeys],
  );

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

  const addManualEntry = (entry) => {
    setManualEntries((prev) => [
      ...prev,
      { ...entry, id: `${entry.dateKey}-${entry.startHour}-${entry.endHour}-${Date.now()}` },
    ]);
  };

  /** 연습 날짜가 들어있는 일정 종합 (연습에 출처로 남김) */
  const pollIdForDate = (dateKey) =>
    selectedPolls.find((item) => (item.dates ?? []).includes(dateKey))?._id ?? null;

  const totalCount = selectedEntries.length + manualEntries.length;

  const handleCreate = async () => {
    if (!team || totalCount === 0 || submitting) return;

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
            pollId: dateMode ? null : pollIdForDate(entry.dateKey),
          },
          { withCredentials: true },
        );
      }
      // 직접 입력: 팀원 전체 참석으로 만든다 (곡장·부곡장은 서버가 항상 포함)
      for (const entry of manualEntries) {
        const members = [...teamMemberIds].sort();
        const memberByHour = [];
        for (let hour = entry.startHour; hour <= entry.endHour; hour += 1) {
          memberByHour.push({ hour, time: formatHourRangeLabel(hour, hour), members });
        }
        await apiClient.post(
          "/api/practice/create",
          {
            teamId,
            date: entry.dateKey,
            time: formatHourRangeLabel(entry.startHour, entry.endHour),
            members,
            memberByHour,
            place: "미확정",
            guestNames: [],
            pollId: null,
          },
          { withCredentials: true },
        );
      }
      await modal(
        totalCount === 1
          ? "연습이 생성되었습니다."
          : `연습 ${totalCount}개를 생성했습니다.`,
      );
      invalidateTeams();
      nav(`/club/team/${teamId}`, { replace: true });
    } catch (error) {
      await modal(error.response?.data?.message ?? "연습 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const backButton = (label) => (
    <button
      type="button"
      className="teamPage__back"
      onClick={() => nav(teamId ? `/club/team/${teamId}` : "/club/team")}
    >
      ← {label}
    </button>
  );

  if (loading) {
    return (
      <div className="teamPage teamPage--practiceCreate">
        {backButton("팀으로")}
        <ClubPageSkeleton variant="grid" />
      </div>
    );
  }

  if (forbidden || !team) {
    return (
      <div className="teamPage teamPage--practiceCreate">
        {backButton("팀으로")}
        <p className="teamPage__intro">연습을 생성할 권한이 없습니다.</p>
      </div>
    );
  }

  const accent = toVisibleTeamColor(team.teamColor);
  const failedCount = activePollIds.filter((id) => pollCache[id] === false).length;

  let emptyMain = null;
  if (!dateMode && dateKeys.length === 0) {
    emptyMain = pollsLoading ? (
      <ClubPageSkeleton variant="grid" />
    ) : (
      <div className="practiceCreate__empty">
        <p className="practiceCreate__emptyTitle">
          {teamPolls.length === 0
            ? "아직 일정 종합이 없어요"
            : "위에서 일정 종합을 골라 주세요"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="teamPage teamPage--practiceCreate"
      style={{ "--team-accent": accent }}
    >
      {backButton(team.name)}

      <header className="practiceCreate__head">
        <h1 className="practiceCreate__title">연습 추가</h1>
        {dateMode ? (
          <p className="practiceCreate__sub">{formatPracticeDatesSummary(dateKeys)}</p>
        ) : null}
      </header>

      {/* 시간 가져올 일정 종합: 여러 개 고르면 한 표로 합친다 (기본 전체 선택) */}
      {!dateMode && teamPolls.length > 0 ? (
        <div className="practiceCreate__sourcesWrap">
          <div className="practiceCreate__sourcesHead">
            <span className="practiceCreate__sourcesLabel">
              일정 종합 {(selectedPollIds ?? []).length}/{teamPolls.length}
            </span>
            <button
              type="button"
              className="practiceCreate__sourcesAll"
              onClick={() =>
                setSelectedPollIds(allSelected ? [] : teamPolls.map((item) => item._id))
              }
            >
              {allSelected ? "전체 해제" : "전체 선택"}
            </button>
          </div>
          <div className="practiceCreate__sources" role="group" aria-label="일정 종합 고르기">
            {teamPolls.map((item) => {
              const on = (selectedPollIds ?? []).includes(item._id);
              const active = isPollActive(item);
              return (
                <button
                  key={item._id}
                  type="button"
                  aria-pressed={on}
                  className={`practiceCreate__source${on ? " practiceCreate__source--on" : ""}`}
                  onClick={() => togglePoll(item._id)}
                >
                  <span className="practiceCreate__sourceCheck" aria-hidden>
                    {on ? "✓" : ""}
                  </span>
                  <span className="practiceCreate__sourceText">
                    <span className="practiceCreate__sourceTitle">
                      {getPollDisplayTitle(item)}
                      {active ? null : (
                        <span className="practiceCreate__sourceTag">마감</span>
                      )}
                    </span>
                    <span className="practiceCreate__sourceMeta">
                      {formatPollDatesSummary(item.dates)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {failedCount > 0 ? (
            <p className="practiceCreate__warn">
              일정 종합 {failedCount}개를 불러오지 못해 빼고 보여줘요.
            </p>
          ) : null}
        </div>
      ) : null}

      <TeamPracticeAvailabilityGrid
        key={dateMode ? queryDateKeys.join(",") : activePollIds.join(",")}
        dateKeys={dateKeys}
        memberIds={memberIds}
        members={gridMembers}
        memberSchedules={gridSchedules}
        leaderIds={leaderIds}
        onSelectionChange={handleSelectionChange}
        hours={pollGrid && !dateMode ? pollGrid.hours : null}
        initialSelection={initialSelection}
        bookedByDate={bookedByDate}
        manualEntries={manualEntries}
        onRemoveManual={(id) =>
          setManualEntries((prev) => prev.filter((entry) => entry.id !== id))
        }
        manualForm={<ManualEntryForm onAdd={addManualEntry} />}
        emptyMain={emptyMain}
        footer={
          <div className="practiceCreate__bar">
            <p className="practiceCreate__barInfo" aria-live="polite">
              {totalCount === 0 ? "시간을 선택하세요" : `연습 ${totalCount}개 선택됨`}
            </p>
            <button
              type="button"
              className="practiceCreate__submit"
              onClick={() => void handleCreate()}
              disabled={totalCount === 0 || submitting}
            >
              {submitting
                ? "만드는 중…"
                : totalCount > 1
                  ? `${totalCount}개 만들기`
                  : "연습 만들기"}
            </button>
          </div>
        }
      />
    </div>
  );
};

export default TeamPracticeCreate;
