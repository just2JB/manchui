import React, { useCallback, useMemo, useState } from "react";
import PollGrid from "./PollGrid";
import {
  buildPollHeatmap,
  formatPollDateShort,
  formatPollHourRange,
  getPollHours,
} from "./pollUtils";
import "./Poll.css";

/**
 * 일정 종합: 응답을 모은 '모두의 가능 시간' 그리드.
 * 진할수록 가능한 사람이 많고, 칸을 누르면(PC는 올리면) 가능/불가 명단을 보여 준다. 설명 문구는 두지 않는다.
 * (PollRespond 의 그룹 패널과 같은 표시 — 팀 메인에서 바로 보여 주기 위해 분리)
 */
export default function PollAggregate({ poll, showLegend = true }) {
  const hours = useMemo(() => getPollHours(poll), [poll]);
  const heatmap = useMemo(() => buildPollHeatmap(poll), [poll]);
  const responseById = useMemo(
    () => new Map((poll?.responses ?? []).map((r) => [r._id, r])),
    [poll],
  );
  const [activeSlot, setActiveSlot] = useState(null);
  const [pinnedSlot, setPinnedSlot] = useState(null);

  const handleSlotFocus = useCallback((slot, opts) => {
    if (opts?.fromHover) {
      setActiveSlot(slot);
      return;
    }
    setPinnedSlot((prev) =>
      prev && slot && prev.dateKey === slot.dateKey && prev.hour === slot.hour ? null : slot,
    );
  }, []);

  // 응답이 없어도 표는 그대로(전부 빈 칸) 보여 준다

  const shownSlot = activeSlot ?? pinnedSlot;
  const shownIds = shownSlot
    ? (heatmap.slots.get(`${shownSlot.dateKey}|${shownSlot.hour}`) ?? [])
    : [];
  const shownAvailable = shownIds.map((id) => responseById.get(id)).filter(Boolean);
  const shownSet = new Set(shownIds);
  const shownUnavailable = heatmap.respondents.filter((r) => !shownSet.has(r._id));

  return (
    <div className="pollAggregate">
      {showLegend ? (
        <div className="pollLegend" aria-hidden>
          <span>0/{heatmap.total}</span>
          <span className="pollLegend__bar" />
          <span>
            {heatmap.total}/{heatmap.total} 가능
          </span>
        </div>
      ) : null}
      <div className="pollGridScroll">
        <PollGrid
          dates={poll.dates}
          hours={hours}
          mode="view"
          heatmap={heatmap}
          activeSlot={shownSlot}
          onSlotFocus={handleSlotFocus}
          ariaLabel="모두의 가능 시간"
        />
      </div>
      {shownSlot ? (
        <div className="pollWho" aria-live="polite">
          <p className="pollWho__slot">
            {formatPollDateShort(shownSlot.dateKey)}{" "}
            {formatPollHourRange(shownSlot.hour, shownSlot.hour + 1)}
          </p>
          <div className="pollWho__cols">
            <div>
              <p className="pollWho__label">가능 {shownAvailable.length}</p>
              <ul className="pollWho__list">
                {shownAvailable.map((r) => (
                  <li key={r._id} className="pollChip pollChip--ok">
                    {r.name}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="pollWho__label">불가 {shownUnavailable.length}</p>
              <ul className="pollWho__list">
                {shownUnavailable.map((r) => (
                  <li key={r._id} className="pollChip pollChip--no">
                    {r.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
