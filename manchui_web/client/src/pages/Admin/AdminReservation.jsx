import React, { useCallback, useEffect, useMemo, useState } from "react";
import apiClient, { serverUrl } from "../../api/apiClient";
import { authRequestConfig } from "../../api/tokenStorage";
import { IoMapOutline } from "react-icons/io5";
import ClubRoomLocationModal from "../../components/ClubRoomMapEmbed/ClubRoomLocationModal";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import "../ClubRoom/Reservation/Reservation.css";
import { formatReservationTimeRange } from "../ClubRoom/Reservation/reservationTimeFormat";
import ClubRoomRulesBar from "../ClubRoom/Reservation/ClubRoomRulesBar";
import ReservedSlotDetailModal from "../ClubRoom/Reservation/ReservedSlotDetailModal";
import ReservationHourPicker from "../ClubRoom/Reservation/ReservationHourPicker";
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
  useReservationRefreshOnFocus,
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
            <th scope="col">연락처</th>
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
                <td>{r.agentId ?? "—"}</td>
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
              연락처 {r.agentId ?? "—"}
              {r.headcount != null ? ` · 인원 ${r.headcount}명` : ""}
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
  const [contact, setContact] = useState("");
  const [headcount, setHeadcount] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [purging, setPurging] = useState(false);
  const [viewingReservation, setViewingReservation] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

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
  useReservationRefreshOnFocus(loadList);

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
    setContact("");
    setHeadcount(1);
    setViewingReservation(null);
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
    const phone = contact.trim();
    if (!phone) {
      await modal("대표자 연락처를 입력해 주세요.", "alert");
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
          agentId: phone,
          time: selectedHours.map(Number),
          headcount: hc,
        },
        authConfig(),
      );
      await modal("예약이 완료되었습니다.", "alert");
      setSelectedHours([]);
      setContact("");
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

  const hasReservationOnDate = (dateKey) =>
    visibleAllReservations.some((r) => r.date === dateKey);

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
      <div className="reservation__titleRow">
        <h1 className="admin-page-heading reservation__title">예약 관리</h1>
        <button
          type="button"
          className="reservation__mapBtn"
          onClick={() => setLocationModalOpen(true)}
          aria-label="동아리방 위치 보기"
        >
          <IoMapOutline className="reservation__mapBtnIcon" aria-hidden />
        </button>
      </div>
      <p className="admin-reservation__lead">
        캘린더에서 날짜를 선택해 해당 일 예약을 확인하고, 아래에서 관리자
        예약을 추가할 수 있습니다.
      </p>

      {listError ? (
        <p className="reservation__warn" role="alert">
          {listError}
        </p>
      ) : null}

      <section
        className={`reservation__calendarSection admin-reservation__calendarSection${loading ? " reservation__calendarSection--loading" : ""}`}
        aria-label="예약 캘린더"
        aria-busy={loading}
      >
        <div className="admin-reservation__calendarHead">
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
          <div className="admin-reservation__calendarHeadActions">
            <ClubRoomRulesBar inline />
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
        </div>

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
            {WEEK_LABELS.map((w) => (
              <span key={w} className="reservation__weekCell">
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
              const hasDot = !loading && hasReservationOnDate(key);
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
                  aria-label={`${key}${hasDot ? ", 예약 있음" : ""}${isSelected ? ", 선택됨" : ""}`}
                >
                  <span className="reservation__dayNum">
                    {cell.date.getDate()}
                  </span>
                  {hasDot ? (
                    <span className="reservation__dayDot" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        </ReservationCalendarSlide>
        <ReservationCalendarFooter
          loading={loading}
          hint="날짜를 선택하면 해당 일의 예약 내역과 관리자 예약 추가 폼이 아래에 표시됩니다."
          onToday={() => {
            goToToday();
            selectDate(todayKey);
          }}
          isViewingTodayMonth={isViewingTodayMonth}
        />
      </section>

      {showAllReservations ? (
        <section
          className="admin-reservation__listSection"
          aria-label="전체 예약 목록"
        >
          <h2 className="admin-reservation__listTitle">전체 예약</h2>
          <p className="admin-reservation__subHint">
            모든 일반·관리자 예약을 날짜순으로 표시합니다.
          </p>
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

      {selectedDateKey ? (
        <>
          <section
            className="admin-reservation__daySection"
            aria-label={`${selectedDateKey} 예약 내역`}
          >
            <h2 className="admin-reservation__dayTitle">
              {selectedDateKey} 예약
              {selectedDateIsPast ? (
                <span className="admin-reservation__dayTitleTag">지난 날</span>
              ) : null}
            </h2>
            {loading ? (
              <p className="reservation__hint">{LOADING_TEXT}</p>
            ) : (
              <AdminDayReservationList
                rows={dayReservations}
                busyId={busyId}
                onDeleteOne={(id) => void handleDeleteOne(id)}
                onViewDetail={setViewingReservation}
              />
            )}
          </section>

          <section
            className="admin-reservation__addSection"
            aria-label="관리자 예약 추가"
          >
            <h2 className="admin-reservation__dayTitle">관리자 예약 추가</h2>
            <p className="admin-reservation__quotaNote" role="status">
              관리자 예약은 회원별 건수 제한에 포함되지 않습니다.
            </p>
            {selectedDateIsPast ? (
              <p className="admin-reservation__emptyBlock">
                지난 날짜에는 새 예약을 등록할 수 없습니다.
              </p>
            ) : (
              <form className="reservation__form" onSubmit={handleSubmit}>
                <fieldset className="reservation__field">
                  <ReservationHourPicker
                    active={Boolean(selectedDateKey)}
                    selectedDateKey={selectedDateKey}
                    selectedHours={selectedHours}
                    reservedOnSelected={reservedOnSelected}
                    todayKey={todayKey}
                    canCreateReservation={canCreateReservation}
                    allReservations={allReservations}
                    onSelectHour={(h) => void handleHourClick(h)}
                    onViewReservation={setViewingReservation}
                  />
                </fieldset>

                <label className="reservation__field reservation__field--stack">
                  <span className="reservation__label">대표자 연락처</span>
                  <input
                    type="tel"
                    className="reservation__input"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="전화번호"
                    autoComplete="tel"
                  />
                </label>

                <label className="reservation__field reservation__field--stack">
                  <span className="reservation__label">인원</span>
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
                </label>

                <div className="reservation__formActions">
                  <button
                    type="submit"
                    className="reservation__btn reservation__btn--primary"
                    disabled={submitting || selectedHours.length === 0}
                  >
                    {submitting ? "처리 중…" : "예약 등록"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </>
      ) : null}

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
