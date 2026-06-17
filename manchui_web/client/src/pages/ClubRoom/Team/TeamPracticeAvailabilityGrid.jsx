import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  PRACTICE_FULL_DAY_HOURS,
  applyRecommendedRanges,
  availabilityIntensity,
  buildDateHourAvailability,
  buildMemberSchedulesForDate,
  buildRecommendedPracticeSlots,
  buildSelectionEntries,
  clearHourRange,
  formatHourRangeLabel,
  formatPracticeGridDateHeader,
  formatPracticeGridHourLabel,
  getMembersUnavailableAtHour,
  getPracticeGridHours,
  isAllMembersAvailable,
  isHourSelected,
  recommendationNeedsDawn,
  toggleHourInSelection,
} from "./practiceAvailabilityUtils";
import { getMemberDisplayName } from "./teamUtils";

const LONG_PRESS_MS = 450;

const TeamPracticeAvailabilityGrid = ({
  dateKeys = [],
  memberIds = [],
  members = [],
  memberSchedules = [],
  leaderIds = [],
  onSelectionChange,
}) => {
  const [selectionByDate, setSelectionByDate] = useState({});
  const [showDawn, setShowDawn] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [expandedMemberKey, setExpandedMemberKey] = useState(null);
  const [unavailableInspect, setUnavailableInspect] = useState(null);
  const prevDateKeysKeyRef = useRef("");
  const scrollRef = useRef(null);
  const bubbleRef = useRef(null);
  const longPressAnchorRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const suppressClickRef = useRef(false);
  const visibleHours = useMemo(() => getPracticeGridHours(showDawn), [showDawn]);

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

  const { matrix: fullDayMatrix, totalMembers: fullDayTotalMembers } = useMemo(
    () =>
      buildDateHourAvailability(
        dateKeys,
        memberIds,
        memberSchedules,
        PRACTICE_FULL_DAY_HOURS,
      ),
    [dateKeys, memberIds, memberSchedules],
  );

  const recommendations = useMemo(
    () =>
      buildRecommendedPracticeSlots(
        dateKeys,
        fullDayMatrix,
        fullDayTotalMembers,
      ),
    [dateKeys, fullDayMatrix, fullDayTotalMembers],
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

  const schedulesByDate = useMemo(() => {
    const map = new Map();
    for (const dateKey of dateKeys) {
      map.set(dateKey, buildMemberSchedulesForDate(memberSchedules, dateKey));
    }
    return map;
  }, [dateKeys, memberSchedules]);

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
    setShowRecommendations(false);
    setExpandedMemberKey(null);
    setUnavailableInspect(null);
  }, [dateKeysKey]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setExpandedMemberKey(null);
  }, [selectionByDate]);

  useEffect(() => {
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
    setExpandedMemberKey(null);
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
    handleToggleHour(dateKey, hour);
  };

  const handleToggleHour = (dateKey, hour) => {
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

  const handleAdoptRecommendation = (item) => {
    if (!item) return;

    if (recommendationNeedsDawn([item])) {
      setShowDawn(true);
    }

    setSelectionByDate((prev) => applyRecommendedRanges(prev, [item]));
  };

  const isRecommendationAdopted = (item) => {
    const hours = selectionByDate[item.dateKey];
    if (!Array.isArray(hours)) return false;

    for (let hour = item.startHour; hour <= item.endHour; hour += 1) {
      if (!hours.includes(hour)) return false;
    }
    return true;
  };

  if (dateKeys.length === 0) return null;

  return (
    <section
      className="teamPracticeGrid"
      aria-labelledby="team-practice-grid-title"
    >
      <div className="teamPracticeGrid__head">
        <div className="teamPracticeGrid__headRow">
          <h2 id="team-practice-grid-title" className="teamPracticeGrid__title">
            팀원 가능 시간
          </h2>
          <label className="teamPracticeGrid__dawnToggle">
            <input
              type="checkbox"
              className="teamPracticeGrid__dawnToggleInput"
              checked={showDawn}
              onChange={(event) => setShowDawn(event.target.checked)}
            />
            <span className="teamPracticeGrid__dawnToggleTrack" aria-hidden />
            <span className="teamPracticeGrid__dawnToggleLabel">새벽연습</span>
          </label>
        </div>
        <p className="teamPracticeGrid__meta">
          일정 제출 최대 {totalResponded}/{totalMembers}명 · 진할수록 더 많은
          팀원이 가능합니다
        </p>
        <p className="teamPracticeGrid__hint">
          시간 칸을 탭해 연습 시간을 선택하세요. 같은 칸을 다시 탭하면 해제됩니다.
          연속된 시간은 하나의 연습으로 합쳐집니다. 칸을 길게 누르거나 우클릭하면
          해당 시간에 불가능한 멤버를 볼 수 있습니다.
        </p>
      </div>

      <div className="teamPracticeGrid__legend">
        <span className="teamPracticeGrid__legendItem">
          <span className="teamPracticeGrid__legendSwatch teamPracticeGrid__legendSwatch--low" />
          일부 가능
        </span>
        <span className="teamPracticeGrid__legendItem">
          <span className="teamPracticeGrid__legendSwatch teamPracticeGrid__legendSwatch--high" />
          많이 가능
        </span>
        <span className="teamPracticeGrid__legendItem">
          <span className="teamPracticeGrid__legendSwatch teamPracticeGrid__legendSwatch--all" />
          전원 가능
        </span>
        <span className="teamPracticeGrid__legendItem">
          <span className="teamPracticeGrid__legendSwatch teamPracticeGrid__legendSwatch--selected" />
          선택된 시간
        </span>
      </div>

      <div
        ref={scrollRef}
        className="teamPracticeGrid__scroll"
        style={{ "--practice-date-cols": dateKeys.length }}
      >
        <table className="teamPracticeGrid__table">
          <thead>
            <tr>
              <th className="teamPracticeGrid__timeHead" scope="col">
                시간
              </th>
              {dateKeys.map((dateKey) => {
                const { month, day, week } = formatPracticeGridDateHeader(dateKey);
                return (
                  <th key={dateKey} className="teamPracticeGrid__dateHead" scope="col">
                    <span className="teamPracticeGrid__dateMonth">{month}/{day}</span>
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

                  return (
                    <td key={`${dateKey}-${hour}`} className="teamPracticeGrid__cellWrap">
                      <button
                        type="button"
                        className={[
                          "teamPracticeGrid__cell",
                          allAvailable ? "teamPracticeGrid__cell--all" : "",
                          selected ? "teamPracticeGrid__cell--selected" : "",
                          unavailableInspect?.dateKey === dateKey &&
                          unavailableInspect?.hour === hour
                            ? "teamPracticeGrid__cell--inspect"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
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
                        title={`${count}/${totalMembers}명 가능 · 길게 누르거나 우클릭: 불가 멤버`}
                        aria-label={`${dateKey} ${formatPracticeGridHourLabel(hour)}, ${count}명 가능`}
                        aria-pressed={selected}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {unavailableInspect && unavailableBubblePlacement
        ? createPortal(
            <div
              ref={bubbleRef}
              className={[
                "teamPracticeGrid__unavailBubble",
                unavailableBubblePlacement.showBelow
                  ? "teamPracticeGrid__unavailBubble--below"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
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
                          <li
                            key={memberId}
                            className="teamPracticeGrid__unavailItem"
                          >
                            {memberNameById.get(memberId) ?? "이름 없음"}
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

      <div className="teamPracticeGrid__selection" role="status">
        {selectedEntries.length === 0 ? (
          <p className="teamPracticeGrid__selectionEmpty">
            선택한 연습 시간이 없습니다.
          </p>
        ) : (
          selectedEntries.map((entry) => {
            const { month, day, week } = formatPracticeGridDateHeader(entry.dateKey);
            const isExpanded = expandedMemberKey === entry.displayKey;

            return (
              <div
                key={entry.displayKey}
                className="teamPracticeGrid__selectionBlock"
              >
                <div className="teamPracticeGrid__selectionRow">
                  <span className="teamPracticeGrid__selectionDate">
                    {month}/{day} ({week})
                  </span>
                  <span className="teamPracticeGrid__selectionTime">
                    {formatHourRangeLabel(entry.startHour, entry.endHour)}
                  </span>
                  <button
                    type="button"
                    className={[
                      "teamPracticeGrid__selectionCount",
                      isExpanded ? "teamPracticeGrid__selectionCount--open" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      setExpandedMemberKey((prev) =>
                        prev === entry.displayKey ? null : entry.displayKey,
                      )
                    }
                    aria-expanded={isExpanded}
                    aria-label={`${entry.availableCount}명 가능, 멤버 목록 ${isExpanded ? "닫기" : "보기"}`}
                  >
                    {entry.availableCount}/{entry.totalMembers}명
                  </button>
                  <button
                    type="button"
                    className="teamPracticeGrid__selectionClear"
                    onClick={(event) => {
                      event.stopPropagation();
                      setExpandedMemberKey(null);
                      handleClearRange(
                        entry.dateKey,
                        entry.startHour,
                        entry.endHour,
                      );
                    }}
                    aria-label={`${month}월 ${day}일 ${entry.time} 선택 취소`}
                  >
                    취소
                  </button>
                </div>
                {isExpanded ? (
                  <div className="teamPracticeGrid__selectionMembers">
                    {entry.memberHours.map((hourEntry) => (
                      <div
                        key={hourEntry.hour}
                        className="teamPracticeGrid__selectionSegment"
                      >
                        <p className="teamPracticeGrid__selectionSegmentHead">
                          <span className="teamPracticeGrid__selectionSegmentTime">
                            {hourEntry.time}
                          </span>
                          <span className="teamPracticeGrid__selectionSegmentCount">
                            {hourEntry.availableCount}/{entry.totalMembers}명
                          </span>
                        </p>
                        {hourEntry.availableMemberIds.length === 0 ? (
                          <p className="teamPracticeGrid__selectionMembersEmpty">
                            이 시간에 가능한 멤버가 없습니다.
                          </p>
                        ) : (
                          <ul className="teamPracticeGrid__selectionMemberList">
                            {hourEntry.availableMemberIds.map((memberId) => (
                              <li
                                key={memberId}
                                className="teamPracticeGrid__selectionMemberItem"
                              >
                                {memberNameById.get(memberId) ?? "이름 없음"}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div className="teamPracticeGrid__recommend">
        <button
          type="button"
          className="teamPracticeGrid__recommendBtn"
          aria-expanded={showRecommendations}
          onClick={() => setShowRecommendations((prev) => !prev)}
        >
          추천 연습시간
        </button>

        {showRecommendations ? (
          <div className="teamPracticeGrid__recommendPanel">
            <p className="teamPracticeGrid__recommendHint">
              2시간 이상 연속 · 참여 가능 인원 많은 순 · 오후 시간 우선 · 항목의
              채택 버튼을 누르면 바로 반영됩니다
            </p>
            {recommendations.length === 0 ? (
              <p className="teamPracticeGrid__recommendEmpty">
                조건에 맞는 추천 시간이 없습니다.
              </p>
            ) : (
              <ul className="teamPracticeGrid__recommendList">
                {recommendations.map((item) => {
                  const { month, day, week } = formatPracticeGridDateHeader(
                    item.dateKey,
                  );
                  const adopted = isRecommendationAdopted(item);

                  return (
                    <li key={item.id} className="teamPracticeGrid__recommendItem">
                      <div
                        className={[
                          "teamPracticeGrid__recommendRow",
                          adopted ? "teamPracticeGrid__recommendRow--adopted" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className="teamPracticeGrid__recommendBody">
                          <span className="teamPracticeGrid__recommendDate">
                            {month}/{day} ({week})
                          </span>
                          <span className="teamPracticeGrid__recommendTime">
                            {item.time}
                          </span>
                          <span className="teamPracticeGrid__recommendMeta">
                            {item.minAvailable}/{item.totalMembers}명 가능
                            {item.isAfternoon ? " · 오후" : " · 오전"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="teamPracticeGrid__recommendAdopt"
                          onClick={() => handleAdoptRecommendation(item)}
                          disabled={adopted}
                          aria-label={`${month}월 ${day}일 ${item.time} 채택`}
                        >
                          {adopted ? "채택됨" : "채택"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default TeamPracticeAvailabilityGrid;
