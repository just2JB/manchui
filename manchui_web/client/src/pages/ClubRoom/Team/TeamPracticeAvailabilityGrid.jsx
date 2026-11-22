import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildDateHourAvailability,
  buildMemberSchedulesForDate,
  buildSelectionEntries,
  availabilityIntensity,
  clearHourRange,
  formatHourRangeLabel,
  formatPracticeGridDateHeader,
  formatPracticeGridHourLabel,
  getMembersAvailableAtHour,
  getMembersUnavailableAtHour,
  getPracticeGridHours,
  isAllMembersAvailable,
  isHourSelected,
  toggleHourInSelection,
} from "./practiceAvailabilityUtils";
import { getMemberDisplayName } from "./teamUtils";

const LONG_PRESS_MS = 450;

const joinClass = (...names) => names.filter(Boolean).join(" ");

const TeamPracticeAvailabilityGrid = ({
  dateKeys = [],
  memberIds = [],
  members = [],
  memberSchedules = [],
  leaderIds = [],
  onSelectionChange,
  /** 일정 투표 기반일 때: 투표 시간대만 표시 (새벽 토글 숨김) */
  hours: hoursOverride = null,
  initialSelection = null,
  /** 이미 잡힌 연습: { [dateKey]: { [hour]: { isStart, time, place } } } */
  bookedByDate = null,
  /** 오른쪽(모바일은 아래) 선택 목록 밑에 붙일 내용 — 만들기 버튼 등 */
  footer = null,
  /** 직접 입력으로 추가한 연습: [{ id, dateKey, startHour, endHour(포함) }] */
  manualEntries = [],
  onRemoveManual,
  /** '선택한 연습' 안에 넣을 직접 입력 폼 */
  manualForm = null,
  /** 표를 그릴 날짜가 없을 때 왼쪽에 대신 보여줄 내용 */
  emptyMain = null,
}) => {
  // 이미 잡힌 연습 시간은 처음부터 선택하지 않는다 (?pick= 으로 들어온 경우)
  const [selectionByDate, setSelectionByDate] = useState(() => {
    const next = {};
    for (const [dateKey, hours] of Object.entries(initialSelection ?? {})) {
      const free = hours.filter((hour) => !bookedByDate?.[dateKey]?.[hour]);
      if (free.length > 0) next[dateKey] = free;
    }
    return next;
  });
  const [showDawn, setShowDawn] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterMemberIds, setFilterMemberIds] = useState([]);
  const [minCount, setMinCount] = useState(0);
  const [expandedKey, setExpandedKey] = useState(null);
  const [unavailableInspect, setUnavailableInspect] = useState(null);
  const prevDateKeysKeyRef = useRef(dateKeys.join(","));
  const scrollRef = useRef(null);
  const bubbleRef = useRef(null);
  const longPressAnchorRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const suppressClickRef = useRef(false);

  const visibleHours = useMemo(
    () => hoursOverride ?? getPracticeGridHours(showDawn),
    [hoursOverride, showDawn],
  );

  const { matrix, totalMembers, respondedByDate } = useMemo(
    () =>
      buildDateHourAvailability(
        dateKeys,
        memberIds,
        memberSchedules,
        visibleHours,
      ),
    [dateKeys, memberIds, memberSchedules, visibleHours],
  );

  const totalResponded = useMemo(() => {
    const values = Object.values(respondedByDate);
    if (values.length === 0) return 0;
    return Math.max(...values);
  }, [respondedByDate]);

  const selectedEntries = useMemo(
    () =>
      buildSelectionEntries(
        selectionByDate,
        dateKeys,
        memberIds,
        memberSchedules,
        leaderIds,
      ),
    [selectionByDate, dateKeys, memberIds, memberSchedules, leaderIds],
  );

  const memberNameById = useMemo(() => {
    const map = new Map();
    for (const member of members) {
      const memberId = String(member?._id ?? member);
      map.set(memberId, getMemberDisplayName(member));
    }
    return map;
  }, [members]);

  const memberIdList = useMemo(() => memberIds.map(String), [memberIds]);

  const schedulesByDate = useMemo(() => {
    const map = new Map();
    for (const dateKey of dateKeys) {
      map.set(dateKey, buildMemberSchedulesForDate(memberSchedules, dateKey));
    }
    return map;
  }, [dateKeys, memberSchedules]);

  /** 상세 필터용: 날짜·시간별 가능한 멤버 Set */
  const availableSetByCell = useMemo(() => {
    const map = {};
    for (const dateKey of dateKeys) {
      const schedulesByUser = schedulesByDate.get(dateKey);
      const byHour = {};
      for (const hour of visibleHours) {
        byHour[hour] = new Set(
          getMembersAvailableAtHour(memberIdList, schedulesByUser, hour),
        );
      }
      map[dateKey] = byHour;
    }
    return map;
  }, [dateKeys, schedulesByDate, visibleHours, memberIdList]);

  const filterActive = filterMemberIds.length > 0 || minCount > 0;

  const cellMatchesFilter = (dateKey, hour) => {
    if (!filterActive) return true;
    const set = availableSetByCell[dateKey]?.[hour];
    if (!set) return false;
    if (set.size < minCount) return false;
    return filterMemberIds.every((id) => set.has(id));
  };

  const matchingCellCount = useMemo(() => {
    if (!filterActive) return 0;
    let count = 0;
    for (const dateKey of dateKeys) {
      for (const hour of visibleHours) {
        if (bookedByDate?.[dateKey]?.[hour]) continue;
        const set = availableSetByCell[dateKey]?.[hour];
        if (!set || set.size < minCount) continue;
        if (filterMemberIds.every((id) => set.has(id))) count += 1;
      }
    }
    return count;
  }, [
    filterActive,
    dateKeys,
    visibleHours,
    bookedByDate,
    availableSetByCell,
    minCount,
    filterMemberIds,
  ]);

  const unavailableMemberIds = useMemo(() => {
    if (!unavailableInspect) return [];
    const schedulesByUser = schedulesByDate.get(unavailableInspect.dateKey);
    return getMembersUnavailableAtHour(
      memberIds,
      schedulesByUser,
      unavailableInspect.hour,
    );
  }, [unavailableInspect, schedulesByDate, memberIds]);

  const unavailableBubblePlacement = useMemo(() => {
    if (!unavailableInspect?.anchor) return null;
    const { top, left, height } = unavailableInspect.anchor;
    const showBelow = top < 140;
    return {
      showBelow,
      top: showBelow ? top + height + 12 : top - 12,
      left,
    };
  }, [unavailableInspect]);

  const dateKeysKey = useMemo(() => dateKeys.join(","), [dateKeys]);

  useEffect(() => {
    if (prevDateKeysKeyRef.current === dateKeysKey) return;
    prevDateKeysKeyRef.current = dateKeysKey;
    setSelectionByDate({});
    setExpandedKey(null);
    setUnavailableInspect(null);
  }, [dateKeysKey]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // 내용이 같으면 부모에 다시 알리지 않는다 (props 배열이 매번 새로 와도 렌더 루프 방지)
  const lastReportedRef = useRef(null);
  useEffect(() => {
    const signature = JSON.stringify(selectedEntries);
    if (lastReportedRef.current === signature) return;
    lastReportedRef.current = signature;
    onSelectionChange?.(selectedEntries);
  }, [selectedEntries, onSelectionChange]);

  useEffect(() => {
    if (!unavailableInspect) return undefined;

    const closeBubble = () => setUnavailableInspect(null);

    const handlePointerDown = (event) => {
      if (bubbleRef.current?.contains(event.target)) return;
      closeBubble();
    };

    const handleScroll = () => closeBubble();

    const scrollEl = scrollRef.current;
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("scroll", handleScroll, true);
    scrollEl?.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", handleScroll, true);
      scrollEl?.removeEventListener("scroll", handleScroll);
    };
  }, [unavailableInspect]);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const showUnavailableMembers = (dateKey, hour, anchorEl) => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    setUnavailableInspect({
      dateKey,
      hour,
      anchor: {
        top: rect.top,
        left: rect.left + rect.width / 2,
        height: rect.height,
      },
    });
  };

  const handleCellContextMenu = (event, dateKey, hour) => {
    event.preventDefault();
    clearLongPress();
    showUnavailableMembers(dateKey, hour, event.currentTarget);
  };

  const handleCellPointerDown = (event, dateKey, hour) => {
    if (event.button !== 0) return;
    clearLongPress();
    suppressClickRef.current = false;
    longPressAnchorRef.current = event.currentTarget;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      suppressClickRef.current = true;
      showUnavailableMembers(dateKey, hour, longPressAnchorRef.current);
    }, LONG_PRESS_MS);
  };

  const handleCellPointerUp = () => {
    clearLongPress();
  };

  const handleCellClick = (dateKey, hour) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (bookedByDate?.[dateKey]?.[hour]) return;
    setSelectionByDate((prev) => {
      const nextHours = toggleHourInSelection(prev[dateKey], hour);
      if (nextHours.length === 0) {
        const next = { ...prev };
        delete next[dateKey];
        return next;
      }
      return { ...prev, [dateKey]: nextHours };
    });
  };

  const handleClearRange = (dateKey, startHour, endHour) => {
    setSelectionByDate((prev) => {
      const nextHours = clearHourRange(prev[dateKey], startHour, endHour);
      if (nextHours.length === 0) {
        const next = { ...prev };
        delete next[dateKey];
        return next;
      }
      return { ...prev, [dateKey]: nextHours };
    });
  };

  const toggleFilterMember = (memberId) => {
    setFilterMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const resetFilter = () => {
    setFilterMemberIds([]);
    setMinCount(0);
  };

  const nameOf = (memberId) => memberNameById.get(memberId) ?? "이름 없음";

  const hasGrid = dateKeys.length > 0;
  if (!hasGrid && !emptyMain) return null;
  const totalCount = selectedEntries.length + manualEntries.length;

  const filterBadge = filterMemberIds.length + (minCount > 0 ? 1 : 0);

  // 인원 고르기: 전체 / 2명+ … / 전원
  const countOptions = [{ value: 0, label: "전체" }];
  for (let n = 2; n < totalMembers; n += 1) {
    countOptions.push({ value: n, label: `${n}명+` });
  }
  if (totalMembers > 0) countOptions.push({ value: totalMembers, label: "전원" });

  const filterSummary = [
    minCount >= totalMembers && minCount > 0
      ? "전원"
      : minCount > 0
        ? `${minCount}명 이상`
        : "",
    filterMemberIds.length > 0
      ? `${filterMemberIds.map(nameOf).join(", ")} 포함`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      className="teamPracticeGrid"
      aria-label="팀원 가능 시간"
      style={{ "--practice-date-cols": dateKeys.length }}
    >
      {hasGrid ? (
      <div className="teamPracticeGrid__main">
        <div className="teamPracticeGrid__toolbar">
          <p className="teamPracticeGrid__meta">
            일정 제출 <strong>{totalResponded}</strong>/{totalMembers}명
          </p>
          <div className="teamPracticeGrid__tools">
            {hoursOverride ? null : (
              <label className="teamPracticeGrid__dawnToggle">
                <input
                  type="checkbox"
                  className="teamPracticeGrid__dawnToggleInput"
                  checked={showDawn}
                  onChange={(event) => setShowDawn(event.target.checked)}
                />
                <span className="teamPracticeGrid__dawnToggleTrack" aria-hidden />
                <span className="teamPracticeGrid__dawnToggleLabel">새벽</span>
              </label>
            )}
            <button
              type="button"
              className={joinClass(
                "teamPracticeGrid__filterBtn",
                filterOpen ? "teamPracticeGrid__filterBtn--open" : "",
                filterActive ? "teamPracticeGrid__filterBtn--active" : "",
              )}
              onClick={() => setFilterOpen((prev) => !prev)}
              aria-expanded={filterOpen}
              aria-controls="team-practice-filter"
            >
              상세 필터
              {filterBadge > 0 ? (
                <span className="teamPracticeGrid__filterBadge">{filterBadge}</span>
              ) : null}
              <span className="teamPracticeGrid__filterChevron" aria-hidden>
                ▾
              </span>
            </button>
          </div>
        </div>

        {filterOpen ? (
          <div id="team-practice-filter" className="teamPracticeGrid__filter">
            <div className="teamPracticeGrid__filterRow">
              <span className="teamPracticeGrid__filterLabel">인원</span>
              <div
                className="teamPracticeGrid__filterChips"
                role="radiogroup"
                aria-label="최소 가능 인원"
              >
                {countOptions.map((option) => {
                  const active = minCount === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={joinClass(
                        "teamPracticeGrid__filterChip",
                        active ? "teamPracticeGrid__filterChip--on" : "",
                      )}
                      onClick={() => setMinCount(option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="teamPracticeGrid__filterRow">
              <span className="teamPracticeGrid__filterLabel">꼭 올 멤버</span>
              <div className="teamPracticeGrid__filterChips">
                {memberIdList.map((memberId) => {
                  const active = filterMemberIds.includes(memberId);
                  return (
                    <button
                      key={memberId}
                      type="button"
                      className={joinClass(
                        "teamPracticeGrid__filterChip",
                        active ? "teamPracticeGrid__filterChip--on" : "",
                      )}
                      onClick={() => toggleFilterMember(memberId)}
                      aria-pressed={active}
                    >
                      {nameOf(memberId)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {filterActive ? (
          <div className="teamPracticeGrid__filterSummary" aria-live="polite">
            <span>
              <strong>{filterSummary}</strong> · 맞는 칸 {matchingCellCount}개
            </span>
            <button
              type="button"
              className="teamPracticeGrid__filterReset"
              onClick={resetFilter}
            >
              필터 해제
            </button>
          </div>
        ) : null}

        <div className="teamPracticeGrid__legend">
          <span className="teamPracticeGrid__legendItem">
            <span className="teamPracticeGrid__legendScale" aria-hidden />
            적음 → 많음
          </span>
          <span className="teamPracticeGrid__legendItem">
            <span className="teamPracticeGrid__legendSwatch teamPracticeGrid__legendSwatch--all" />
            전원 가능
          </span>
          <span className="teamPracticeGrid__legendItem">
            <span className="teamPracticeGrid__legendSwatch teamPracticeGrid__legendSwatch--selected" />
            선택함
          </span>
          {bookedByDate ? (
            <span className="teamPracticeGrid__legendItem">
              <span className="teamPracticeGrid__legendSwatch teamPracticeGrid__legendSwatch--booked" />
              잡힌 연습
            </span>
          ) : null}
        </div>

        <div ref={scrollRef} className="teamPracticeGrid__scroll">
          <table className="teamPracticeGrid__table">
            <thead>
              <tr>
                <th className="teamPracticeGrid__timeHead" scope="col">
                  <span className="teamPracticeGrid__srOnly">시간</span>
                </th>
                {dateKeys.map((dateKey) => {
                  const { month, day, week } = formatPracticeGridDateHeader(dateKey);
                  return (
                    <th key={dateKey} className="teamPracticeGrid__dateHead" scope="col">
                      <span className="teamPracticeGrid__dateMonth">
                        {month}/{day}
                      </span>
                      <span className="teamPracticeGrid__dateWeek">{week}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleHours.map((hour) => (
                <tr key={hour}>
                  <th className="teamPracticeGrid__timeLabel" scope="row">
                    {formatPracticeGridHourLabel(hour)}
                  </th>
                  {dateKeys.map((dateKey) => {
                    const count = matrix[dateKey]?.[hour] ?? 0;
                    const intensity = availabilityIntensity(count, totalMembers);
                    const allAvailable = isAllMembersAvailable(count, totalMembers);
                    const selected = isHourSelected(hour, selectionByDate[dateKey]);
                    const booked = bookedByDate?.[dateKey]?.[hour] ?? null;
                    const dimmed = !booked && !cellMatchesFilter(dateKey, hour);

                    return (
                      <td key={`${dateKey}-${hour}`} className="teamPracticeGrid__cellWrap">
                        <button
                          type="button"
                          className={joinClass(
                            "teamPracticeGrid__cell",
                            allAvailable && !booked ? "teamPracticeGrid__cell--all" : "",
                            selected ? "teamPracticeGrid__cell--selected" : "",
                            booked ? "teamPracticeGrid__cell--booked" : "",
                            dimmed ? "teamPracticeGrid__cell--dimmed" : "",
                            unavailableInspect?.dateKey === dateKey &&
                              unavailableInspect?.hour === hour
                              ? "teamPracticeGrid__cell--inspect"
                              : "",
                          )}
                          style={{ "--avail-intensity": intensity }}
                          onClick={() => handleCellClick(dateKey, hour)}
                          onContextMenu={(event) =>
                            handleCellContextMenu(event, dateKey, hour)
                          }
                          onPointerDown={(event) =>
                            handleCellPointerDown(event, dateKey, hour)
                          }
                          onPointerUp={handleCellPointerUp}
                          onPointerCancel={handleCellPointerUp}
                          onPointerLeave={handleCellPointerUp}
                          title={
                            booked
                              ? `이미 잡힌 연습 ${booked.time}`
                              : `${count}/${totalMembers}명 가능 · 길게 누르거나 우클릭: 안 되는 멤버`
                          }
                          aria-label={
                            booked
                              ? `${dateKey} ${formatPracticeGridHourLabel(hour)}, 이미 잡힌 연습`
                              : `${dateKey} ${formatPracticeGridHourLabel(hour)}, ${count}명 가능`
                          }
                          aria-pressed={selected}
                          aria-disabled={booked ? true : undefined}
                        >
                          {booked?.isStart ? (
                            <span className="teamPracticeGrid__cellTag">연습</span>
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="teamPracticeGrid__hint">
          칸을 탭해 고르면 이어진 시간은 연습 하나가 돼요 · 길게 누르면 안 되는 멤버
        </p>
      </div>
      ) : (
        <div className="teamPracticeGrid__main">{emptyMain}</div>
      )}

      <aside className="teamPracticeGrid__side" aria-label="선택한 연습">
        <div className="teamPracticeGrid__selection" role="status">
          <h2 className="teamPracticeGrid__selectionTitle">
            선택한 연습
            {totalCount > 0 ? (
              <span className="teamPracticeGrid__selectionTotal">
                {totalCount}
              </span>
            ) : null}
          </h2>

          {totalCount === 0 ? (
            <p className="teamPracticeGrid__selectionEmpty">
              {hasGrid
                ? "표에서 칸을 탭하거나 아래에서 직접 입력해 주세요."
                : "아래에서 날짜와 시간을 직접 입력해 주세요."}
            </p>
          ) : selectedEntries.length === 0 ? null : (
            <ul className="teamPracticeGrid__selectionList">
              {selectedEntries.map((entry) => {
                const { month, day, week } = formatPracticeGridDateHeader(
                  entry.dateKey,
                );
                const duration = entry.endHour - entry.startHour + 1;
                const availableSet = new Set(entry.availableMemberIds.map(String));
                const missingIds = memberIdList.filter((id) => !availableSet.has(id));
                const isAll = missingIds.length === 0;
                const isExpanded = expandedKey === entry.displayKey;

                return (
                  <li key={entry.displayKey} className="teamPracticeGrid__entry">
                    <div className="teamPracticeGrid__entryHead">
                      <div className="teamPracticeGrid__entryWhen">
                        <span className="teamPracticeGrid__entryDate">
                          {month}/{day} ({week})
                        </span>
                        <span className="teamPracticeGrid__entryTime">
                          {formatHourRangeLabel(entry.startHour, entry.endHour)}
                        </span>
                        <span className="teamPracticeGrid__entryDuration">
                          {duration}시간
                        </span>
                      </div>
                      <button
                        type="button"
                        className="teamPracticeGrid__entryRemove"
                        onClick={() => {
                          setExpandedKey(null);
                          handleClearRange(entry.dateKey, entry.startHour, entry.endHour);
                        }}
                        aria-label={`${month}월 ${day}일 ${entry.time} 선택 취소`}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="teamPracticeGrid__entryStatus">
                      <span
                        className={joinClass(
                          "teamPracticeGrid__entryBadge",
                          isAll ? "teamPracticeGrid__entryBadge--all" : "",
                        )}
                      >
                        {isAll
                          ? "전원 가능"
                          : `${entry.availableCount}/${entry.totalMembers}명 가능`}
                      </span>
                      {!isAll ? (
                        <span className="teamPracticeGrid__entryMissing">
                          불가 · {missingIds.map(nameOf).join(", ")}
                        </span>
                      ) : null}
                    </div>

                    {duration > 1 ? (
                      <button
                        type="button"
                        className="teamPracticeGrid__entryToggle"
                        onClick={() =>
                          setExpandedKey((prev) =>
                            prev === entry.displayKey ? null : entry.displayKey,
                          )
                        }
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? "시간별 접기" : "시간별 보기"}
                      </button>
                    ) : null}

                    {isExpanded ? (
                      <ul className="teamPracticeGrid__entryHours">
                        {entry.memberHours.map((hourEntry) => {
                          const hourSet = new Set(
                            hourEntry.availableMemberIds.map(String),
                          );
                          const hourMissing = memberIdList.filter(
                            (id) => !hourSet.has(id),
                          );
                          return (
                            <li key={hourEntry.hour} className="teamPracticeGrid__entryHour">
                              <span className="teamPracticeGrid__entryHourTime">
                                {formatPracticeGridHourLabel(hourEntry.hour)}
                              </span>
                              <span className="teamPracticeGrid__entryHourCount">
                                {hourEntry.availableCount}/{entry.totalMembers}
                              </span>
                              <span className="teamPracticeGrid__entryHourMissing">
                                {hourMissing.length === 0
                                  ? "전원 가능"
                                  : `불가 ${hourMissing.map(nameOf).join(", ")}`}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {manualEntries.length > 0 ? (
            <ul className="teamPracticeGrid__selectionList">
              {manualEntries.map((entry) => {
                const { month, day, week } = formatPracticeGridDateHeader(entry.dateKey);
                const duration = entry.endHour - entry.startHour + 1;
                return (
                  <li key={entry.id} className="teamPracticeGrid__entry teamPracticeGrid__entry--manual">
                    <div className="teamPracticeGrid__entryHead">
                      <div className="teamPracticeGrid__entryWhen">
                        <span className="teamPracticeGrid__entryDate">
                          {month}/{day} ({week})
                        </span>
                        <span className="teamPracticeGrid__entryTime">
                          {formatHourRangeLabel(entry.startHour, entry.endHour)}
                        </span>
                        <span className="teamPracticeGrid__entryDuration">
                          {duration}시간
                        </span>
                      </div>
                      <button
                        type="button"
                        className="teamPracticeGrid__entryRemove"
                        onClick={() => onRemoveManual?.(entry.id)}
                        aria-label={`${month}월 ${day}일 직접 입력한 연습 빼기`}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="teamPracticeGrid__entryStatus">
                      <span className="teamPracticeGrid__entryBadge">직접 입력</span>
                      <span className="teamPracticeGrid__entryMissing">팀원 전체로 만들어요</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {manualForm}
        </div>
        {footer}
      </aside>

      {unavailableInspect && unavailableBubblePlacement
        ? createPortal(
            <div
              ref={bubbleRef}
              className={joinClass(
                "teamPracticeGrid__unavailBubble",
                unavailableBubblePlacement.showBelow
                  ? "teamPracticeGrid__unavailBubble--below"
                  : "",
              )}
              style={{
                top: unavailableBubblePlacement.top,
                left: unavailableBubblePlacement.left,
              }}
              role="dialog"
              aria-labelledby="team-practice-unavail-title"
            >
              {(() => {
                const { month, day, week } = formatPracticeGridDateHeader(
                  unavailableInspect.dateKey,
                );
                const hourLabel = formatHourRangeLabel(
                  unavailableInspect.hour,
                  unavailableInspect.hour,
                );
                const booked =
                  bookedByDate?.[unavailableInspect.dateKey]?.[unavailableInspect.hour];

                return (
                  <>
                    <div className="teamPracticeGrid__unavailHead">
                      <div>
                        <h3
                          id="team-practice-unavail-title"
                          className="teamPracticeGrid__unavailTitle"
                        >
                          {month}/{day} ({week}) {hourLabel}
                        </h3>
                        <p className="teamPracticeGrid__unavailMeta">
                          {booked ? `이미 잡힌 연습 ${booked.time} · ` : ""}
                          불가능 {unavailableMemberIds.length}/{totalMembers}명
                        </p>
                      </div>
                      <button
                        type="button"
                        className="teamPracticeGrid__unavailClose"
                        onClick={() => setUnavailableInspect(null)}
                        aria-label="닫기"
                      >
                        닫기
                      </button>
                    </div>
                    {unavailableMemberIds.length === 0 ? (
                      <p className="teamPracticeGrid__unavailEmpty">
                        이 시간에 불가능한 멤버가 없습니다.
                      </p>
                    ) : (
                      <ul className="teamPracticeGrid__unavailList">
                        {unavailableMemberIds.map((memberId) => (
                          <li key={memberId} className="teamPracticeGrid__unavailItem">
                            {nameOf(memberId)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                );
              })()}
            </div>,
            document.body,
          )
        : null}
    </section>
  );
};

export default TeamPracticeAvailabilityGrid;
