import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import apiClient, { serverUrl } from "../../api/apiClient";
import { authRequestConfig } from "../../api/tokenStorage";
import { createPortal } from "react-dom";
import { IoCloseOutline, IoMapOutline } from "react-icons/io5";
import ClubRoomLocationModal from "../../components/ClubRoomMapEmbed/ClubRoomLocationModal";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import "../ClubRoom/Reservation/Reservation.css";
import { formatReservationTimeRange } from "../ClubRoom/Reservation/reservationTimeFormat";
import ClubRoomRulesBar from "../ClubRoom/Reservation/ClubRoomRulesBar";
import ReservedSlotDetailModal from "../ClubRoom/Reservation/ReservedSlotDetailModal";
import ReservationDayTimeline from "../ClubRoom/Reservation/ReservationDayTimeline";
import "./AdminReservation.css";
import { LOADING_TEXT } from "../../constants/loadingText";
import {
  calendarDayLoadingClass,
  calendarGridLoadingClass,
} from "../ClubRoom/Reservation/reservationCalendarLoading";
import ReservationCalendarSlide from "../ClubRoom/Reservation/ReservationCalendarSlide";
import ReservationCalendarFooter from "../ClubRoom/Reservation/ReservationCalendarFooter";
import ReservationMonthNav from "../ClubRoom/Reservation/ReservationMonthNav";
import { useCalendarMonthSlide } from "../ClubRoom/Reservation/useCalendarMonthSlide";
import {
  collectReservedHoursForDate,
  filterAdminVisibleReservations,
} from "../ClubRoom/Reservation/reservationRetention";
import {
  useReservationNow,
} from "../ClubRoom/Reservation/useReservationLiveSync";

const authConfig = authRequestConfig;

function isConsecutiveHours(hours) {
  if (hours.length <= 1) return true;
  const s = [...hours].sort((a, b) => a - b);
  for (let i = 1; i < s.length; i++) {
    if (s[i] !== s[i - 1] + 1) return false;
  }
  return true;
}

function formatDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildMonthGrid(viewMonth) {
  const first = startOfMonth(viewMonth);
  const year = first.getFullYear();
  const month = first.getMonth();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay();
  const cells = [];
  for (let i = 0; i < leading; i++) {
    cells.push({ key: `pad-${i}`, date: null });
  }
  for (let day = 1; day <= lastDate; day++) {
    const date = new Date(year, month, day);
    cells.push({ key: formatDateKey(date), date });
  }
  return cells;
}

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function memberLabel(r) {
  const u = r.userId;
  if (u && typeof u === "object") {
    const name = u.username || "—";
    const id = u.Identification ? ` (${u.Identification})` : "";
    return `${name}${id}`;
  }
  return "—";
}

/** 팀 이름 (구버전 예약은 연락처 표시) */
function teamLabel(r) {
  if (r.teamName) return r.teamName;
  if (r.agentId) return `연락처 ${r.agentId}`;
  return "—";
}

function isAdminBooking(r) {
  return r.bookingType === "admin";
}

function sortReservationRowsDesc(rows) {
  return [...rows].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (da !== db) return db - da;
    const minA = Math.min(...(a.time || []).map(Number));
    const minB = Math.min(...(b.time || []).map(Number));
    return minB - minA;
  });
}

function sortByStartTimeAsc(rows) {
  return [...rows].sort((a, b) => {
    const minA = Math.min(...(a.time || []).map(Number));
    const minB = Math.min(...(b.time || []).map(Number));
    return minA - minB;
  });
}

function AdminReservationTable({ rows, busyId, onDeleteOne, isPastDateKey }) {
  if (rows.length === 0) return null;
  return (
    <div className="admin-reservation__tableWrap">
      <table className="admin-reservation__table">
        <thead>
          <tr>
            <th scope="col">날짜</th>
            <th scope="col">시간</th>
            <th scope="col">구분</th>
            <th scope="col">팀</th>
            <th scope="col">인원</th>
            <th scope="col">예약 계정</th>
            <th scope="col">관리</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const past = isPastDateKey(r.date);
            const timeStr = formatReservationTimeRange(r.time);
            return (
              <tr
                key={r._id}
                className={past ? "admin-reservation__row--past" : undefined}
              >
                <td>{r.date}</td>
                <td>{timeStr}</td>
                <td>
                  <span
                    className={`admin-reservation__typeBadge${isAdminBooking(r) ? " admin-reservation__typeBadge--admin" : ""}`}
                  >
                    {isAdminBooking(r) ? "관리자" : "일반"}
                  </span>
                </td>
                <td>{teamLabel(r)}</td>
                <td>{r.headcount != null ? `${r.headcount}명` : "—"}</td>
                <td>{memberLabel(r)}</td>
                <td>
                  <button
                    type="button"
                    className="admin-reservation__rowDelete"
                    disabled={busyId === r._id}
                    onClick={() => onDeleteOne(r._id)}
                  >
                    {busyId === r._id ? "…" : "삭제"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AdminDayReservationList({
  rows,
  busyId,
  onDeleteOne,
  onViewDetail,
}) {
  if (rows.length === 0) {
    return <p className="admin-reservation__emptyBlock">이 날짜에 예약이 없습니다.</p>;
  }
  return (
    <ul className="admin-reservation__dayList">
      {rows.map((r) => {
        const timeStr = formatReservationTimeRange(r.time);
        return (
          <li key={r._id} className="admin-reservation__dayCard">
            <div className="admin-reservation__dayCardMain">
              <span className="admin-reservation__dayCardTime">{timeStr}</span>
              <span
                className={`admin-reservation__typeBadge${isAdminBooking(r) ? " admin-reservation__typeBadge--admin" : ""}`}
              >
                {isAdminBooking(r) ? "관리자" : "일반"}
              </span>
            </div>
            <p className="admin-reservation__dayCardMeta">
              {teamLabel(r)}
              {r.headcount != null ? ` · ${r.headcount}명` : ""}
              {" · "}
              {memberLabel(r)}
            </p>
            <div className="admin-reservation__dayCardActions">
              <button
                type="button"
                className="admin-reservation__dayCardBtn"
                onClick={() => onViewDetail(r)}
              >
                상세
              </button>
              <button
                type="button"
                className="admin-reservation__rowDelete"
                disabled={busyId === r._id}
                onClick={() => onDeleteOne(r._id)}
              >
                {busyId === r._id ? "…" : "삭제"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const AdminReservation = () => {
  const modal = useManchuiModal();

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [allReservations, setAllReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [showAllReservations, setShowAllReservations] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    formatDateKey(new Date()),
  );

  const [selectedHours, setSelectedHours] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [headcount, setHeadcount] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [purging, setPurging] = useState(false);
  const [viewingReservation, setViewingReservation] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  /** 시간은 시간 막대에서 고르고, 팀 이름·인원은 바텀시트에서 (동아리방 예약 페이지와 같은 흐름) */
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadList = useCallback(async () => {
    if (!serverUrl) return;
    setListError("");
    try {
      const res = await apiClient.get(
        "/api/reservation/admin/list",
        authConfig(),
      );
      setAllReservations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setListError(
        e.response?.data?.message || "예약 목록을 불러오지 못했습니다.",
      );
      setAllReservations([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!serverUrl) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await loadList();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadList]);

  const now = useReservationNow();
  useRefreshOnFocus(loadList);

  const visibleAllReservations = useMemo(
    () => filterAdminVisibleReservations(allReservations, now),
    [allReservations, now],
  );

  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const todayStart = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  }, []);

  const reservedOnSelected = useMemo(() => {
    if (!selectedDateKey) return new Set();
    return collectReservedHoursForDate(selectedDateKey, allReservations, now);
  }, [selectedDateKey, allReservations, now]);

  const headcountStepValue = useMemo(() => {
    if (headcount === "") return 1;
    const n = Number(headcount);
    if (!Number.isFinite(n)) return 1;
    return Math.min(99, Math.max(1, n));
  }, [headcount]);

  const canCreateReservation = true;

  const isPastDateKey = useCallback(
    (dateKey) => {
      const [y, m, d] = dateKey.split("-").map(Number);
      if (!y || !m || !d) return false;
      const t = new Date(y, m - 1, d).getTime();
      return t < todayStart;
    },
    [todayStart],
  );

  const selectedDateIsPast = selectedDateKey
    ? isPastDateKey(selectedDateKey)
    : false;

  const {
    slideDir,
    goPrevMonth,
    goNextMonth,
    goToToday,
    isViewingTodayMonth,
    navigateToMonth,
    swipeHandlers,
    monthKey,
  } = useCalendarMonthSlide(viewMonth, setViewMonth);

  const selectDate = (dateKey) => {
    setSelectedDateKey(dateKey);
    setSelectedHours([]);
    setTeamName("");
    setHeadcount(1);
    setViewingReservation(null);
    setSheetOpen(false);
    const [y, m] = dateKey.split("-").map(Number);
    if (y && m) {
      navigateToMonth(new Date(y, m - 1, 1));
    }
  };

  const isHourBlocked = (h) => {
    if (reservedOnSelected.has(h)) return true;
    if (selectedDateKey === todayKey) {
      const now = new Date();
      if (h <= now.getHours()) return true;
    }
    return false;
  };

  const handleHourClick = async (h) => {
    if (selectedDateIsPast) return;
    if (!canCreateReservation) return;
    if (isHourBlocked(h)) return;

    if (selectedHours.length === 0) {
      setSelectedHours([h]);
      return;
    }

    const earliest = Math.min(...selectedHours);

    if (h === earliest) {
      setSelectedHours([]);
      return;
    }

    if (h < earliest) {
      setSelectedHours([h]);
      return;
    }

    const lo = earliest;
    const hi = h;
    for (let t = lo; t <= hi; t++) {
      if (isHourBlocked(t)) {
        await modal(
          "선택한 두 시각 사이에 예약할 수 없는 시간이 포함되어 있습니다.",
          "alert",
        );
        return;
      }
    }
    const range = [];
    for (let t = lo; t <= hi; t++) range.push(t);
    setSelectedHours(range);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serverUrl) {
      await modal("서버 주소가 설정되지 않았습니다.", "alert");
      return;
    }
    if (!selectedDateKey) return;
    if (selectedDateIsPast) {
      await modal("지난 날짜에는 예약을 추가할 수 없습니다.", "alert");
      return;
    }
    if (selectedHours.length === 0) {
      await modal("예약할 시간을 선택해 주세요.", "alert");
      return;
    }
    if (!isConsecutiveHours(selectedHours)) {
      await modal("연속된 시간만 예약할 수 있습니다.", "alert");
      return;
    }
    const name = teamName.trim();
    if (!name) {
      await modal("팀 이름을 입력해 주세요.", "alert");
      return;
    }
    const hc = Number(headcount);
    if (!Number.isFinite(hc) || hc < 1 || hc > 99) {
      await modal("인원수는 1~99 사이로 입력해 주세요.", "alert");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(
        "/api/reservation/admin/make",
        {
          date: selectedDateKey,
          teamName: name,
          time: selectedHours.map(Number),
          headcount: hc,
        },
        authConfig(),
      );
      setSheetOpen(false);
      await modal("예약이 완료되었습니다.", "alert");
      setSelectedHours([]);
      setTeamName("");
      setHeadcount(1);
      await loadList();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "예약에 실패했습니다.";
      await modal(msg, "alert");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOne = async (id) => {
    if (!serverUrl) return;
    const ok = await modal("이 예약을 삭제할까요?", "confirm");
    if (!ok) return;
    setBusyId(id);
    try {
      await apiClient.delete(
        `/api/reservation/admin/by-id/${id}`,
        authConfig(),
      );
      await modal("삭제되었습니다.", "alert");
      await loadList();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "삭제에 실패했습니다.";
      await modal(msg, "alert");
    } finally {
      setBusyId(null);
    }
  };

  const handlePurgePast = async () => {
    if (!serverUrl) return;
    const ok = await modal(
      "예약 종료 후 보관 기간(2일)이 지난 예약을 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다.",
      "confirm",
    );
    if (!ok) return;
    setPurging(true);
    try {
      const res = await apiClient.post(
        "/api/reservation/admin/delete-past",
        {},
        authConfig(),
      );
      const n = res.data?.deletedCount ?? 0;
      await modal(`보관 만료 예약 ${n}건을 삭제했습니다.`, "alert");
      await loadList();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "삭제에 실패했습니다.";
      await modal(msg, "alert");
    } finally {
      setPurging(false);
    }
  };

  const grid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  const allReservationRows = useMemo(
    () => sortReservationRowsDesc(visibleAllReservations),
    [visibleAllReservations],
  );

  const dayReservations = useMemo(() => {
    if (!selectedDateKey) return [];
    return sortByStartTimeAsc(
      visibleAllReservations.filter((r) => r.date === selectedDateKey),
    );
  }, [selectedDateKey, visibleAllReservations]);

  /** 시간 막대에서 관리자 예약을 밝은 블록으로 */
  const adminBookingIds = new Set(
    dayReservations.filter(isAdminBooking).map((r) => String(r._id)),
  );
  const selectionLabel =
    selectedHours.length > 0
      ? `${formatReservationTimeRange(selectedHours)} · ${selectedHours.length}시간`
      : null;

  if (!serverUrl) {
    return (
      <div className="reservation">
        <p className="reservation__warn">
          서버 연결 설정(VITE_SERVER_URL)이 필요합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="reservation admin-reservation admin-reservation--manage">
      <div className="admin-reservation__head">
        <h1 className="admin-page-heading">예약 관리</h1>
        <div className="admin-reservation__headActions">
          <ClubRoomRulesBar inline />
          <button
            type="button"
            className="reservation__mapBtn"
            onClick={() => setLocationModalOpen(true)}
            aria-label="동아리방 위치 보기"
          >
            <IoMapOutline className="reservation__mapBtnIcon" aria-hidden />
            <span className="reservation__mapBtnText">위치 안내</span>
          </button>
        </div>
      </div>

      {listError ? (
        <p className="reservation__warn" role="alert">
          {listError}
        </p>
      ) : null}

      {/* PC: 왼쪽 달력 · 오른쪽 선택한 날(시간 막대 + 예약 목록). 모바일은 위아래 */}
      <div className="admin-reservation__grid">
        <section
          className={`reservation__calendarSection admin-reservation__calendarSection${loading ? " reservation__calendarSection--loading" : ""}`}
          aria-label="예약 캘린더"
          aria-busy={loading}
        >
          <ReservationMonthNav
            viewMonth={viewMonth}
            slideDir={slideDir}
            goPrevMonth={goPrevMonth}
            goNextMonth={goNextMonth}
            navigateToMonth={navigateToMonth}
          />

          <ReservationCalendarSlide
            monthKey={monthKey}
            slideDir={slideDir}
            swipeHandlers={swipeHandlers}
          >
            <div className="reservation__weekRow">
              {WEEK_LABELS.map((w, i) => (
                <span
                  key={w}
                  className={`reservation__weekCell${i === 0 ? " reservation__weekCell--sun" : ""}${i === 6 ? " reservation__weekCell--sat" : ""}`}
                >
                  {w}
                </span>
              ))}
            </div>

            <div
              className={`reservation__dayGrid${calendarGridLoadingClass(loading)}`}
            >
              {grid.map((cell) => {
                if (!cell.date) {
                  return <div key={cell.key} className="reservation__dayEmpty" />;
                }
                const key = cell.key;
                const t = cell.date.getTime();
                const isPast = t < todayStart;
                const isToday = key === todayKey;
                const isSelected = key === selectedDateKey;
                const count = loading
                  ? 0
                  : visibleAllReservations.filter((r) => r.date === key).length;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={loading}
                    className={`reservation__day${isToday ? " reservation__day--today" : ""}${isPast ? " reservation__day--past" : ""}${isSelected ? " reservation__day--selected" : ""}${calendarDayLoadingClass(loading)}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => !loading && selectDate(key)}
                    aria-pressed={isSelected}
                    aria-label={`${key}${count ? `, 예약 ${count}건` : ""}${isSelected ? ", 선택됨" : ""}`}
                  >
                    <span className="reservation__dayNum">
                      {cell.date.getDate()}
                    </span>
                    {count > 0 ? (
                      <span className="reservation__dayDots" aria-hidden>
                        {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                          <span key={i} className="reservation__dayDot" />
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </ReservationCalendarSlide>
          <ReservationCalendarFooter
            loading={loading}
            onToday={() => {
              goToToday();
              selectDate(todayKey);
            }}
            isViewingTodayMonth={isViewingTodayMonth}
          />

          <div className="admin-reservation__calendarTools">
            <label className="admin-reservation__toggle">
              <input
                type="checkbox"
                className="admin-reservation__toggleInput"
                checked={showAllReservations}
                onChange={(e) => setShowAllReservations(e.target.checked)}
              />
              <span className="admin-reservation__toggleTrack" aria-hidden />
              <span className="admin-reservation__toggleLabel">전체 예약 보기</span>
            </label>
            {showAllReservations ? (
              <button
                type="button"
                className="admin-reservation__purgeBtn"
                disabled={purging || loading}
                onClick={() => void handlePurgePast()}
              >
                {purging ? "처리 중…" : "만료 예약 삭제"}
              </button>
            ) : null}
          </div>
        </section>

        {selectedDateKey ? (
          <section
            className="reservation__daySection admin-reservation__dayPanel"
            aria-label={`${selectedDateKey} 예약`}
          >
            <div className="reservation__dayHead">
              <h2 className="reservation__sectionTitle">
                {selectedDateKey}
                {selectedDateKey === todayKey ? (
                  <span className="reservation__todayBadge">오늘</span>
                ) : null}
                {selectedDateIsPast ? (
                  <span className="admin-reservation__dayTitleTag">지난 날</span>
                ) : null}
              </h2>
              <span className="reservation__dayCount">
                {loading ? "" : `예약 ${dayReservations.length}건`}
              </span>
            </div>

            {loading ? (
              <p className="reservation__hint">{LOADING_TEXT}</p>
            ) : (
              <ReservationDayTimeline
                reservations={dayReservations}
                myIds={adminBookingIds}
                isToday={selectedDateKey === todayKey}
                now={now}
                onSelect={setViewingReservation}
                selectable={!selectedDateIsPast}
                selectedHours={selectedHours}
                isHourBlocked={isHourBlocked}
                onSelectHour={(h) => void handleHourClick(h)}
                footer={
                  selectedDateIsPast ? null : (
                    <button
                      type="button"
                      className="reservation__btn reservation__btn--primary reservation__reserveBtn"
                      disabled={selectedHours.length === 0}
                      onClick={() => setSheetOpen(true)}
                    >
                      {selectedHours.length > 0
                        ? `${formatReservationTimeRange(selectedHours)} 관리자 예약`
                        : "관리자 예약"}
                    </button>
                  )
                }
              />
            )}

            {!loading ? (
              <AdminDayReservationList
                rows={dayReservations}
                busyId={busyId}
                onDeleteOne={(id) => void handleDeleteOne(id)}
                onViewDetail={setViewingReservation}
              />
            ) : null}
          </section>
        ) : null}
      </div>

      {showAllReservations ? (
        <section
          className="admin-reservation__listSection"
          aria-label="전체 예약 목록"
        >
          <h2 className="admin-reservation__listTitle">전체 예약</h2>
          {loading ? (
            <p className="reservation__hint">{LOADING_TEXT}</p>
          ) : allReservationRows.length === 0 ? (
            <p className="reservation__empty">등록된 예약이 없습니다.</p>
          ) : (
            <AdminReservationTable
              rows={allReservationRows}
              busyId={busyId}
              onDeleteOne={(id) => void handleDeleteOne(id)}
              isPastDateKey={isPastDateKey}
            />
          )}
        </section>
      ) : null}

      {/* 바텀시트: 팀 이름 · 인원 (예약 페이지와 같은 틀) */}
      {sheetOpen && selectedDateKey
        ? createPortal(
            <div className="reservation__sheetRoot" role="presentation">
              <button
                type="button"
                className="reservation__sheetBackdrop"
                aria-label="닫기"
                tabIndex={-1}
                onClick={() => setSheetOpen(false)}
              />
              <form
                className="reservation__sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-reservation-sheet-title"
                onSubmit={handleSubmit}
              >
                <div className="reservation__sheetHeader">
                  <span className="reservation__sheetHandle" aria-hidden />
                  <h2
                    id="admin-reservation-sheet-title"
                    className="reservation__sheetTitle"
                  >
                    {selectedDateKey} 관리자 예약
                  </h2>
                  <button
                    type="button"
                    className="reservation__sheetClose"
                    onClick={() => setSheetOpen(false)}
                    aria-label="닫기"
                  >
                    <IoCloseOutline aria-hidden />
                  </button>
                </div>

                <div className="reservation__sheetBody">
                  <div className="reservation__step">
                    <p className="reservation__stepTitle">예약 정보</p>
                    <label className="reservation__field reservation__field--stack">
                      <span className="reservation__label">팀 이름</span>
                      <input
                        type="text"
                        className="reservation__input"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value.slice(0, 20))}
                        placeholder="예: 만취 1팀"
                        maxLength={20}
                        autoComplete="off"
                      />
                    </label>

                    <div className="reservation__field reservation__field--stack">
                      <span className="reservation__label">사용 인원</span>
                      <div className="reservation__numberWrap">
                        <button
                          type="button"
                          className="reservation__numberBtn"
                          aria-label="인원 한 명 줄이기"
                          disabled={headcountStepValue <= 1}
                          onClick={() =>
                            setHeadcount(Math.max(1, headcountStepValue - 1))
                          }
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          inputMode="numeric"
                          className="reservation__input reservation__input--numberCore"
                          value={headcount}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "") {
                              setHeadcount("");
                              return;
                            }
                            const n = Number(raw);
                            if (!Number.isFinite(n)) return;
                            setHeadcount(Math.max(1, Math.min(99, n)));
                          }}
                        />
                        <button
                          type="button"
                          className="reservation__numberBtn"
                          aria-label="인원 한 명 늘리기"
                          disabled={headcountStepValue >= 99}
                          onClick={() =>
                            setHeadcount(Math.min(99, headcountStepValue + 1))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="reservation__sheetFooter">
                  <p className="reservation__selectionSummary" aria-live="polite">
                    {selectionLabel ?? "시간을 선택해 주세요"}
                  </p>
                  <button
                    type="submit"
                    className="reservation__btn reservation__btn--primary"
                    disabled={submitting || selectedHours.length === 0 || !teamName.trim()}
                  >
                    {submitting ? "처리 중…" : "예약하기"}
                  </button>
                </div>
              </form>
            </div>,
            document.body,
          )
        : null}

      {viewingReservation ? (
        <ReservedSlotDetailModal
          reservation={viewingReservation}
          onClose={() => setViewingReservation(null)}
        />
      ) : null}
      <ClubRoomLocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
    </div>
  );
};

export default AdminReservation;
