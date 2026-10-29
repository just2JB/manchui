import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_GRID_START_HOUR,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  WEEKDAY_COLUMNS,
  createTimedDraftSlot,
  formatDraftSlotLabel,
  validateDraftSlotRange,
} from "../weeklyTimetableUtils";

function TimeFields({ label, hour, minute, onHourChange, onMinuteChange }) {
  return (
    <div className="weeklyTimetablePage__selectTimeBlock">
      <span className="weeklyTimetablePage__selectSubLabel">{label}</span>
      <div className="weeklyTimetablePage__selectTimeRow">
        <label className="weeklyTimetablePage__selectTimeField">
          <span className="weeklyTimetablePage__selectSubLabel">시</span>
          <select
            className="weeklyTimetablePage__selectSelect"
            value={hour}
            onChange={(event) => onHourChange(Number(event.target.value))}
          >
            {HOUR_OPTIONS.map((value) => (
              <option key={`${label}-hour-${value}`} value={value}>
                {value}시
              </option>
            ))}
          </select>
        </label>
        <label className="weeklyTimetablePage__selectTimeField">
          <span className="weeklyTimetablePage__selectSubLabel">분</span>
          <select
            className="weeklyTimetablePage__selectSelect"
            value={minute}
            onChange={(event) => onMinuteChange(Number(event.target.value))}
          >
            {MINUTE_OPTIONS.map((value) => (
              <option key={`${label}-minute-${value}`} value={value}>
                {value}분
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function WeeklyTimetableSelectPanel({
  open,
  draftName,
  draftSlots,
  isEdit,
  saving,
  onDraftNameChange,
  onAddSlot,
  onRemoveSlot,
  onSave,
  onDelete,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [weekday, setWeekday] = useState("mon");
  const [startHour, setStartHour] = useState(DEFAULT_GRID_START_HOUR);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(DEFAULT_GRID_START_HOUR + 1);
  const [endMinute, setEndMinute] = useState(0);
  const [addError, setAddError] = useState("");

  if (!open) return null;

  const resetAddForm = () => {
    setWeekday("mon");
    setStartHour(DEFAULT_GRID_START_HOUR);
    setStartMinute(0);
    setEndHour(DEFAULT_GRID_START_HOUR + 1);
    setEndMinute(0);
    setAddError("");
  };

  const handleToggleAddForm = () => {
    setShowAddForm((prev) => {
      if (prev) resetAddForm();
      return !prev;
    });
  };

  const handleAddSlot = () => {
    const validationError = validateDraftSlotRange(
      startHour,
      startMinute,
      endHour,
      endMinute,
    );
    if (validationError) {
      setAddError(validationError);
      return;
    }

    onAddSlot(
      createTimedDraftSlot(
        weekday,
        startHour,
        startMinute,
        endHour,
        endMinute,
      ),
    );
    setShowAddForm(false);
    resetAddForm();
  };

  return createPortal(
    <footer className="weeklyTimetablePage__selectPanel">
      <div className="weeklyTimetablePage__selectPanelScroll">
        <label className="weeklyTimetablePage__selectField">
          <span className="weeklyTimetablePage__selectLabel">일정 이름</span>
          <input
            type="text"
            className="weeklyTimetablePage__selectInput"
            value={draftName}
            onChange={(event) => onDraftNameChange(event.target.value)}
            placeholder="예: 전공 수업"
            maxLength={40}
          />
        </label>

        <div className="weeklyTimetablePage__selectSlotsSection">
          <span className="weeklyTimetablePage__selectLabel">요일·시간</span>

          {draftSlots.length > 0 ? (
            <ul className="weeklyTimetablePage__selectSlotList">
              {draftSlots.map((slot) => (
                <li key={slot.id} className="weeklyTimetablePage__selectSlotItem">
                  <span className="weeklyTimetablePage__selectSlotText">
                    {formatDraftSlotLabel(slot)}
                  </span>
                  <button
                    type="button"
                    className="weeklyTimetablePage__selectSlotRemoveBtn"
                    onClick={() => onRemoveSlot(slot.id)}
                    aria-label="시간 삭제"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="weeklyTimetablePage__selectEmpty">
              캘린더를 누르거나 시간 추가로 일정을 넣어 주세요.
            </p>
          )}

          {showAddForm ? (
            <div className="weeklyTimetablePage__selectAddForm">
              <div className="weeklyTimetablePage__selectWeekdayRow">
                {WEEKDAY_COLUMNS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={[
                      "weeklyTimetablePage__selectWeekdayBtn",
                      weekday === key
                        ? "weeklyTimetablePage__selectWeekdayBtn--active"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setWeekday(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="weeklyTimetablePage__selectTimeRange">
                <TimeFields
                  label="시작"
                  hour={startHour}
                  minute={startMinute}
                  onHourChange={(value) => {
                    setStartHour(value);
                    setAddError("");
                  }}
                  onMinuteChange={(value) => {
                    setStartMinute(value);
                    setAddError("");
                  }}
                />

                <span
                  className="weeklyTimetablePage__selectTimeSep"
                  aria-hidden="true"
                >
                  ~
                </span>

                <TimeFields
                  label="종료"
                  hour={endHour}
                  minute={endMinute}
                  onHourChange={(value) => {
                    setEndHour(value);
                    setAddError("");
                  }}
                  onMinuteChange={(value) => {
                    setEndMinute(value);
                    setAddError("");
                  }}
                />
              </div>

              {addError ? (
                <p className="weeklyTimetablePage__selectError">{addError}</p>
              ) : null}

              <button
                type="button"
                className="weeklyTimetablePage__selectConfirmAddBtn weeklyTimetablePage__selectConfirmAddBtn--full"
                onClick={handleAddSlot}
              >
                이 시간 추가
              </button>
            </div>
          ) : null}

          <button
            type="button"
            className={[
              "weeklyTimetablePage__selectAddSlotBtn",
              showAddForm
                ? "weeklyTimetablePage__selectAddSlotBtn--active"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={handleToggleAddForm}
          >
            {showAddForm ? "시간 추가 닫기" : "+ 시간 추가"}
          </button>
        </div>
      </div>

      <div className="weeklyTimetablePage__selectActions">
        {isEdit && onDelete ? (
          <button
            type="button"
            className="weeklyTimetablePage__selectDeleteBtn"
            onClick={onDelete}
            disabled={saving}
          >
            삭제
          </button>
        ) : null}
        <button
          type="button"
          className="weeklyTimetablePage__selectSaveBtn"
          onClick={onSave}
          disabled={
            saving || !draftName.trim() || draftSlots.length === 0
          }
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </footer>,
    document.body,
  );
}

export default WeeklyTimetableSelectPanel;
