import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { IoChevronDown } from "react-icons/io5";
import {
  activateWeeklyTimetable,
  createWeeklyTimetable,
  deleteWeeklyTimetable,
  fetchMyWeeklyTimetables,
  updateWeeklyTimetable,
} from "../../../api/weeklyTimetableApi";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import {
  WEEKDAY_COLUMNS,
  draftSlotsToEntries,
  entryToDraftSlot,
  formatEntryTimeRange,
  getDraftSlotsGridHours,
  getEntryGridRow,
  getEntriesForWeekday,
  hourHasEntry,
  normalizeWeeklyEntries,
  slotOverlapsHour,
  toggleHourDraftSlot,
  toggleWeekdayDraftSlots,
} from "../weeklyTimetableUtils";
import WeeklyTimetableSelectPanel from "./WeeklyTimetableSelectPanel";
import "./MypageWeeklyTimetable.css";
import "./Mypage.css";

const DAWN_HOUR_END = 7;

function WeeklyTimetablePickerSheet({
  open,
  timetables,
  activeId,
  onClose,
  onSelect,
  onRename,
  onDelete,
  onCreateTimetable,
}) {
  if (!open) return null;

  return createPortal(
    <div className="weeklyTimetablePicker" role="presentation">
      <button
        type="button"
        className="weeklyTimetablePicker__backdrop"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className="weeklyTimetablePicker__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekly-timetable-picker-title"
      >
        <div className="weeklyTimetablePicker__handleWrap">
          <span className="weeklyTimetablePicker__handle" aria-hidden />
        </div>
        <h2
          id="weekly-timetable-picker-title"
          className="weeklyTimetablePicker__title"
        >
          시간표 선택
        </h2>
        <ul className="weeklyTimetablePicker__list">
          {timetables.map((item) => {
            const isActive = String(item._id) === String(activeId);
            return (
              <li
                key={item._id}
                className={[
                  "weeklyTimetablePicker__item",
                  isActive ? "weeklyTimetablePicker__item--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button
                  type="button"
                  className="weeklyTimetablePicker__row"
                  onClick={() => onSelect(item._id)}
                >
                  <span className="weeklyTimetablePicker__name">{item.name}</span>
                  {isActive ? (
                    <span className="weeklyTimetablePicker__badge">사용 중</span>
                  ) : null}
                </button>
                <div className="weeklyTimetablePicker__actions">
                  <button
                    type="button"
                    className="weeklyTimetablePicker__actionBtn"
                    onClick={() => onRename(item)}
                  >
                    이름 변경
                  </button>
                  <button
                    type="button"
                    className="weeklyTimetablePicker__actionBtn weeklyTimetablePicker__actionBtn--danger"
                    onClick={() => onDelete(item)}
                    disabled={timetables.length <= 1}
                  >
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="weeklyTimetablePicker__createBtn"
          onClick={onCreateTimetable}
        >
          새 시간표 만들기
        </button>
      </div>
    </div>,
    document.body,
  );
}

const MypageWeeklyTimetable = () => {
  const nav = useNavigate();
  const modal = useManchuiModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timetables, setTimetables] = useState([]);
  const [activeTimetable, setActiveTimetable] = useState(null);
  const [entries, setEntries] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [draftSlots, setDraftSlots] = useState([]);

  const visibleHours = useMemo(
    () => getDraftSlotsGridHours(draftSlots, entries),
    [draftSlots, entries],
  );

  const gridHourCount = Math.max(visibleHours.length, 1);

  const loadTimetables = useCallback(async () => {
    const data = await fetchMyWeeklyTimetables();
    setTimetables(data.timetables);
    const active = data.activeTimetable ?? data.timetables[0] ?? null;
    setActiveTimetable(active);
    if (active) {
      setEntries(normalizeWeeklyEntries(active.entries));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadTimetables();
      } catch (error) {
        if (!cancelled) {
          await modal(
            error.response?.data?.message ??
              "시간표를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadTimetables, modal]);

  const persistEntries = useCallback(
    async (nextEntries) => {
      if (!activeTimetable?._id) return false;
      setSaving(true);
      try {
        const { timetable } = await updateWeeklyTimetable(activeTimetable._id, {
          entries: nextEntries,
        });
        const normalized = normalizeWeeklyEntries(timetable.entries);
        setEntries(normalized);
        setActiveTimetable(timetable);
        setTimetables((prev) =>
          prev.map((item) =>
            String(item._id) === String(timetable._id) ? timetable : item,
          ),
        );
        return true;
      } catch (error) {
        await modal(
          error.response?.data?.message ?? "시간표 저장에 실패했습니다.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [activeTimetable?._id, modal],
  );

  const exitSelectMode = () => {
    setSelectMode(false);
    setEditingEntry(null);
    setDraftName("");
    setDraftSlots([]);
  };

  const startAddEntry = () => {
    setEditingEntry(null);
    setDraftName("");
    setDraftSlots([]);
    setSelectMode(true);
  };

  const startEditEntry = (entry) => {
    if (selectMode) return;
    setEditingEntry(entry);
    setDraftName(entry.name);
    setDraftSlots([entryToDraftSlot(entry)]);
    setSelectMode(true);
  };

  const handleSlotClick = (weekday, hour) => {
    setDraftSlots((prev) => toggleHourDraftSlot(prev, weekday, hour));
  };

  const handleDayHeadClick = (weekday) => {
    setDraftSlots((prev) => toggleWeekdayDraftSlots(prev, weekday, visibleHours));
  };

  const handleSaveDraft = async () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      await modal("일정 이름을 입력해 주세요.");
      return;
    }
    if (draftSlots.length === 0) {
      await modal("요일·시간을 추가해 주세요.");
      return;
    }

    const newEntries = draftSlotsToEntries(trimmedName, draftSlots);
    const nextEntries = editingEntry?._id
      ? [
          ...entries.filter(
            (entry) => String(entry._id) !== String(editingEntry._id),
          ),
          ...newEntries,
        ]
      : [...entries, ...newEntries];

    const ok = await persistEntries(nextEntries);
    if (ok) exitSelectMode();
  };

  const handleEntryDelete = async () => {
    if (!editingEntry?._id) return;
    if (!(await modal("이 일정을 삭제할까요?", "confirm"))) return;
    const nextEntries = entries.filter(
      (entry) => String(entry._id) !== String(editingEntry._id),
    );
    const ok = await persistEntries(nextEntries);
    if (ok) exitSelectMode();
  };

  const handleCreateTimetable = async () => {
    const name = window.prompt("새 시간표 이름을 입력하세요.", "새 시간표");
    if (name == null) return;
    const trimmed = String(name).trim();
    if (!trimmed) {
      await modal("시간표 이름을 입력해 주세요.");
      return;
    }
    try {
      const { timetable } = await createWeeklyTimetable(trimmed, {
        activate: true,
      });
      setTimetables((prev) => [
        ...prev.map((item) => ({ ...item, isActive: false })),
        timetable,
      ]);
      setActiveTimetable(timetable);
      setEntries(normalizeWeeklyEntries(timetable.entries));
      setPickerOpen(false);
      await modal("시간표가 추가되었습니다.");
    } catch (error) {
      await modal(
        error.response?.data?.message ?? "시간표 추가에 실패했습니다.",
      );
    }
  };

  const handleSelectTimetable = async (id) => {
    if (String(activeTimetable?._id) === String(id)) {
      setPickerOpen(false);
      return;
    }
    exitSelectMode();
    try {
      const { timetable } = await activateWeeklyTimetable(id);
      setTimetables((prev) =>
        prev.map((item) => ({
          ...item,
          isActive: String(item._id) === String(timetable._id),
        })),
      );
      setActiveTimetable(timetable);
      setEntries(normalizeWeeklyEntries(timetable.entries));
      setPickerOpen(false);
    } catch (error) {
      await modal(
        error.response?.data?.message ?? "시간표 변경에 실패했습니다.",
      );
    }
  };

  const handleRenameTimetable = async (item) => {
    const name = window.prompt("시간표 이름", item.name);
    if (name == null) return;
    const trimmed = String(name).trim();
    if (!trimmed) {
      await modal("시간표 이름을 입력해 주세요.");
      return;
    }
    try {
      const { timetable } = await updateWeeklyTimetable(item._id, {
        name: trimmed,
      });
      setTimetables((prev) =>
        prev.map((row) =>
          String(row._id) === String(timetable._id) ? timetable : row,
        ),
      );
      if (String(activeTimetable?._id) === String(timetable._id)) {
        setActiveTimetable(timetable);
      }
    } catch (error) {
      await modal(
        error.response?.data?.message ?? "이름 변경에 실패했습니다.",
      );
    }
  };

  const handleDeleteTimetable = async (item) => {
    if (timetables.length <= 1) {
      await modal("마지막 시간표는 삭제할 수 없습니다.");
      return;
    }
    if (!(await modal(`"${item.name}" 시간표를 삭제할까요?`, "confirm"))) {
      return;
    }
    try {
      await deleteWeeklyTimetable(item._id);
      await loadTimetables();
      await modal("시간표가 삭제되었습니다.");
    } catch (error) {
      await modal(
        error.response?.data?.message ?? "시간표 삭제에 실패했습니다.",
      );
    }
  };

  const isDayHeadSelected = (weekday) => {
    if (visibleHours.length === 0) return false;
    return visibleHours.every((hour) =>
      draftSlots.some(
        (slot) => slot.weekday === weekday && slotOverlapsHour(slot, hour),
      ),
    );
  };

  const isDayHeadPartial = (weekday) => {
    const hasAny = draftSlots.some((slot) => slot.weekday === weekday);
    return hasAny && !isDayHeadSelected(weekday);
  };

  const isHourSelected = (weekday, hour) =>
    draftSlots.some(
      (slot) => slot.weekday === weekday && slotOverlapsHour(slot, hour),
    );

  return (
    <div
      className={[
        "mypageHub",
        "weeklyTimetablePage",
        selectMode ? "weeklyTimetablePage--selectMode" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="mypageSaved__back"
        onClick={() => nav("/club/mypage")}
      >
        ← 마이페이지
      </button>

      <header className="weeklyTimetablePage__header">
        <button
          type="button"
          className="weeklyTimetablePage__nameBtn"
          onClick={() => setPickerOpen(true)}
          disabled={loading || !activeTimetable || selectMode}
        >
          <span className="weeklyTimetablePage__name">
            {activeTimetable?.name ?? "시간표"}
          </span>
          <IoChevronDown className="weeklyTimetablePage__nameIcon" aria-hidden />
        </button>
        {selectMode ? (
          <button
            type="button"
            className="weeklyTimetablePage__cancelBtn"
            onClick={exitSelectMode}
          >
            취소
          </button>
        ) : (
          <button
            type="button"
            className="weeklyTimetablePage__addBtn"
            onClick={startAddEntry}
            disabled={loading || !activeTimetable}
          >
            일정 추가
          </button>
        )}
      </header>

      {selectMode ? (
        <p className="weeklyTimetablePage__selectHint">
          캘린더에서 시간을 선택하거나, 아래에서 이름과 요일·시간을 직접 추가할
          수 있습니다.
        </p>
      ) : null}

      {saving ? (
        <p className="weeklyTimetablePage__saveStatus">저장 중…</p>
      ) : null}

      {loading ? (
        <p className="weeklyTimetablePage__loading">불러오는 중…</p>
      ) : (
        <div
          className={[
            "weeklyTimetablePage__gridWrap",
            selectMode ? "weeklyTimetablePage__gridWrap--selectMode" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ "--hour-count": gridHourCount }}
        >
          <div className="weeklyTimetablePage__scrollArea">
            <div className="weeklyTimetablePage__scrollInner">
              <div className="weeklyTimetablePage__timeCol" aria-hidden>
                <span className="weeklyTimetablePage__timeHeadSpacer" />
                <div className="weeklyTimetablePage__timeRows">
                  {visibleHours.map((hour) => (
                    <span key={hour} className="weeklyTimetablePage__timeLabel">
                      {hour}시
                    </span>
                  ))}
                </div>
              </div>

              <div className="weeklyTimetablePage__dayCols">
                {WEEKDAY_COLUMNS.map(({ key, label }) => {
                  const dayEntries = getEntriesForWeekday(entries, key);
                  return (
                    <div
                      key={key}
                      className={[
                        "weeklyTimetablePage__dayCol",
                        selectMode && isDayHeadSelected(key)
                          ? "weeklyTimetablePage__dayCol--selected"
                          : "",
                        selectMode && isDayHeadPartial(key)
                          ? "weeklyTimetablePage__dayCol--partial"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <button
                        type="button"
                        className={[
                          "weeklyTimetablePage__dayHead",
                          selectMode ? "weeklyTimetablePage__dayHead--interactive" : "",
                          selectMode && isDayHeadSelected(key)
                            ? "weeklyTimetablePage__dayHead--selected"
                            : "",
                          selectMode && isDayHeadPartial(key)
                            ? "weeklyTimetablePage__dayHead--partial"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => selectMode && handleDayHeadClick(key)}
                        disabled={!selectMode}
                      >
                        <span className="weeklyTimetablePage__dayLabel">
                          {label}
                        </span>
                      </button>
                      <div className="weeklyTimetablePage__dayBody">
                        {visibleHours.map((hour, hourIndex) => {
                          const isSelected = isHourSelected(key, hour);
                          const hasEntry = hourHasEntry(dayEntries, hour);

                          if (selectMode) {
                            return (
                              <button
                                key={`${key}-slot-${hour}`}
                                type="button"
                                className={[
                                  "weeklyTimetablePage__slot",
                                  isSelected
                                    ? "weeklyTimetablePage__slot--selected"
                                    : "",
                                  hour <= DAWN_HOUR_END
                                    ? "weeklyTimetablePage__slot--dawn"
                                    : "",
                                  hour < 12
                                    ? "weeklyTimetablePage__slot--am"
                                    : "weeklyTimetablePage__slot--pm",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                style={{ gridRow: hourIndex + 1 }}
                                onClick={() => handleSlotClick(key, hour)}
                                aria-pressed={isSelected}
                                aria-label={`${label}요일 ${hour}시`}
                              />
                            );
                          }

                          if (hasEntry) return null;

                          return (
                            <span
                              key={`${key}-line-${hour}`}
                              className="weeklyTimetablePage__rowLine"
                              style={{ gridRow: hourIndex + 1 }}
                            />
                          );
                        })}
                        {!selectMode
                          ? dayEntries.map((entry) => {
                              const gridRow = getEntryGridRow(entry, visibleHours);
                              if (!gridRow) return null;
                              return (
                                <button
                                  key={
                                    entry._id ??
                                    `${entry.weekday}-${entry.startHour}-${entry.name}`
                                  }
                                  type="button"
                                  className="weeklyTimetablePage__block"
                                  style={{ gridRow }}
                                  onClick={() => startEditEntry(entry)}
                                >
                                  <span className="weeklyTimetablePage__blockName">
                                    {entry.name}
                                  </span>
                                  <span className="weeklyTimetablePage__blockTime">
                                    {formatEntryTimeRange(entry)}
                                  </span>
                                </button>
                              );
                            })
                          : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <WeeklyTimetableSelectPanel
        open={selectMode}
        draftName={draftName}
        draftSlots={draftSlots}
        isEdit={Boolean(editingEntry?._id)}
        saving={saving}
        onDraftNameChange={setDraftName}
        onAddSlot={(slot) => setDraftSlots((prev) => [...prev, slot])}
        onRemoveSlot={(slotId) =>
          setDraftSlots((prev) => prev.filter((slot) => slot.id !== slotId))
        }
        onSave={() => void handleSaveDraft()}
        onDelete={
          editingEntry?._id ? () => void handleEntryDelete() : undefined
        }
      />

      <WeeklyTimetablePickerSheet
        open={pickerOpen}
        timetables={timetables}
        activeId={activeTimetable?._id}
        onClose={() => setPickerOpen(false)}
        onSelect={(id) => void handleSelectTimetable(id)}
        onRename={(item) => void handleRenameTimetable(item)}
        onDelete={(item) => void handleDeleteTimetable(item)}
        onCreateTimetable={() => void handleCreateTimetable()}
      />
    </div>
  );
};

export default MypageWeeklyTimetable;
