import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import apiClient, { serverUrl } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import { IoMapOutline, IoShareSocialOutline } from "react-icons/io5";
import ClubRoomLocationModal from "../../../components/ClubRoomMapEmbed/ClubRoomLocationModal";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import "./Reservation.css";
import { formatReservationTimeRange } from "./reservationTimeFormat";
import ClubRoomRulesBar from "./ClubRoomRulesBar";
import ReservedSlotDetailModal from "./ReservedSlotDetailModal";
import ReservationHourPicker from "./ReservationHourPicker";
import ReservationMyListSkeleton from "./ReservationMyListSkeleton";
import {
  calendarDayLoadingClass,
  calendarGridLoadingClass,
} from "./reservationCalendarLoading";
import ReservationCalendarSlide from "./ReservationCalendarSlide";
import ReservationCalendarFooter from "./ReservationCalendarFooter";
import ReservationMonthNav from "./ReservationMonthNav";
import { useCalendarMonthSlide } from "./useCalendarMonthSlide";
import {
  DEFAULT_RESERVATION_QUOTA,
  parseMineResponse,
} from "./reservationMine";
import { LOADING_TEXT } from "../../../constants/loadingText";

function isConsecutiveHours(hours) {
  if (hours.length <= 1) return true;
  const s = [...hours].sort((a, b) => a - b);
  for (let i = 1; i < s.length; i++) {
    if (s[i] !== s[i - 1] + 1) return false;
  }
  return true;
}

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

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

function collectReservedHoursForDate(dateKey, reservations) {
  const set = new Set();
  for (const r of reservations) {
    if (r.date !== dateKey || !Array.isArray(r.time)) continue;
    for (const t of r.time) {
      set.add(Number(t));
    }
  }
  return set;
}

const Reservation = () => {
  const { user } = useAuth();
  const modal = useManchuiModal();

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [allReservations, setAllReservations] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [reservationQuota, setReservationQuota] = useState(
    DEFAULT_RESERVATION_QUOTA,
  );
  const [loading, setLoading] = useState(true);
  const [mineLoading, setMineLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const [selectedHours, setSelectedHours] = useState([]);
  const [contact, setContact] = useState("");
  const [headcount, setHeadcount] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [viewingReservation, setViewingReservation] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const loadAll = useCallback(async () => {
    if (!serverUrl) return;
    try {
      const res = await apiClient.get("/api/reservation");
      setAllReservations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadMine = useCallback(async () => {
    if (!serverUrl || !user?._id) {
      setMineLoading(false);
      return;
    }
    setMineLoading(true);
    try {
      const res = await apiClient.get("/api/reservation/mine", {
        withCredentials: true,
      });
      const { reservations, quota } = parseMineResponse(res.data);
      setMyReservations(reservations);
      setReservationQuota(quota);
    } catch (e) {
      console.error(e);
      setMyReservations([]);
      setReservationQuota({ ...DEFAULT_RESERVATION_QUOTA });
    } finally {
      setMineLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!serverUrl) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await loadAll();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const todayStart = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  }, []);

  const reservedOnSelected = useMemo(() => {
    if (!selectedDateKey) return new Set();
    return collectReservedHoursForDate(selectedDateKey, allReservations);
  }, [selectedDateKey, allReservations]);

  /** 인원 스텝 버튼용 (빈 칸은 1로 간주) */
  const headcountStepValue = useMemo(() => {
    if (headcount === "") return 1;
    const n = Number(headcount);
    if (!Number.isFinite(n)) return 1;
    return Math.min(99, Math.max(1, n));
  }, [headcount]);

  const reservationLimit = reservationQuota.limit;
  const reservationCount = reservationQuota.count;
  const canCreateReservation = reservationCount < reservationLimit;

  const openSheetForDate = (dateKey) => {
    setSelectedDateKey(dateKey);
    setSelectedHours([]);
    setContact("");
    setHeadcount(1);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setViewingReservation(null);
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
    if (selectedHours.length === 0) {
      await modal("예약할 시간을 선택해 주세요.", "alert");
      return;
    }
    if (!isConsecutiveHours(selectedHours)) {
      await modal("연속된 시간만 예약할 수 있습니다.", "alert");
      return;
    }
    if (reservationCount >= reservationLimit) {
      await modal(
        `한 계정당 예약은 최대 ${reservationLimit}건까지 가능합니다.`,
        "alert",
      );
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
        "/api/reservation/make",
        {
          date: selectedDateKey,
          agentId: phone,
          time: selectedHours.map(Number),
          headcount: hc,
        },
        { withCredentials: true },
      );
      await modal("예약이 완료되었습니다.", "alert");
      closeSheet();
      await loadAll();
      await loadMine();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "예약에 실패했습니다.";
      await modal(msg, "alert");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMine = async (id) => {
    if (!serverUrl) return;
    const ok = await modal("이 예약을 취소할까요?", "confirm");
    if (!ok) return;
    try {
      await apiClient.delete(`/api/reservation/${id}`, {
        withCredentials: true,
      });
      await modal("예약이 취소되었습니다.", "alert");
      await loadAll();
      await loadMine();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "취소에 실패했습니다.";
      await modal(msg, "alert");
    }
  };

  const buildShareUrl = (reservationId) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/club/reservation/share/${reservationId}`;
  };

  const handleShareReservation = async (reservationId) => {
    const url = buildShareUrl(reservationId);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "동아리방 예약",
          text: "예약 정보를 확인해 주세요.",
          url,
        });
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      await modal("공유 링크를 복사했습니다.", "alert");
    } catch {
      try {
        window.prompt("아래 링크를 복사해 주세요:", url);
      } catch {
        await modal("링크 복사에 실패했습니다.", "alert");
      }
    }
  };

  const grid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const {
    slideDir,
    goPrevMonth,
    goNextMonth,
    goToToday,
    navigateToMonth,
    swipeHandlers,
    monthKey,
  } = useCalendarMonthSlide(viewMonth, setViewMonth);

  const hasReservationOnDate = (dateKey) => {
    return collectReservedHoursForDate(dateKey, allReservations).size > 0;
  };

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
    <div className="reservation">
      <div className="reservation__titleRow">
        <h1 className="reservation__title">동아리방 예약</h1>
        <button
          type="button"
          className="reservation__mapBtn"
          onClick={() => setLocationModalOpen(true)}
          aria-label="동아리방 위치 보기"
        >
          <IoMapOutline className="reservation__mapBtnIcon" aria-hidden />
        </button>
      </div>

      <section
        className={`reservation__calendarSection${loading ? " reservation__calendarSection--loading" : ""}`}
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
              const hasDot = !loading && hasReservationOnDate(key);
              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={isPast || loading}
                  className={`reservation__day${isToday ? " reservation__day--today" : ""}${isPast ? " reservation__day--past" : ""}${calendarDayLoadingClass(loading)}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={() => !isPast && !loading && openSheetForDate(key)}
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
          hint="날짜를 눌러 예약할 시간(0~23시)과 연락처를 입력하세요."
          onToday={goToToday}
        />
      </section>

      <section className="reservation__mySection" aria-label="내 예약">
        <div className="reservation__myHead">
          <h2 className="reservation__sectionTitle">내 예약</h2>
          <ClubRoomRulesBar inline />
        </div>
        {mineLoading ? (
          <ReservationMyListSkeleton count={2} />
        ) : (
          <>
        <p className="reservation__quotaNote" aria-live="polite">
          계정당 예약 최대 {reservationLimit}건 (현재 {reservationCount}/
          {reservationLimit})
        </p>
        {myReservations.length === 0 ? (
          <p className="reservation__empty">예약 내역이 없습니다.</p>
        ) : (
          <ul className="reservation__myList">
            {myReservations.map((r) => (
              <li key={r._id} className="reservation__myCard">
                <div className="reservation__myMain">
                  <span className="reservation__myDate">{r.date}</span>
                  <span className="reservation__myTime">
                    {formatReservationTimeRange(r.time)}
                  </span>
                  <span className="reservation__myMeta">
                    연락처 {r.agentId ?? "—"}
                    {r.headcount != null ? ` · 인원 ${r.headcount}명` : ""}
                  </span>
                </div>
                <div className="reservation__myActions">
                  <button
                    type="button"
                    className="reservation__shareBtn"
                    onClick={() => handleShareReservation(r._id)}
                    aria-label="예약 공유"
                    title="공유"
                  >
                    <IoShareSocialOutline
                      className="reservation__shareBtnIcon"
                      aria-hidden
                    />
                  </button>
                  <button
                    type="button"
                    className="reservation__cancelBtn"
                    onClick={() => handleDeleteMine(r._id)}
                  >
                    취소
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
          </>
        )}
      </section>

      {sheetOpen && selectedDateKey
        ? createPortal(
            <div className="reservation__sheetRoot" role="presentation">
              <button
                type="button"
                className="reservation__sheetBackdrop"
                aria-label="닫기"
                onClick={closeSheet}
              />
              <div
                className="reservation__sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reservation-sheet-title"
              >
                <div className="reservation__sheetHandleWrap">
                  <span className="reservation__sheetHandle" aria-hidden />
                </div>
                <h2
                  id="reservation-sheet-title"
                  className="reservation__sheetTitle"
                >
                  {selectedDateKey} 예약
                </h2>
                {!canCreateReservation ? (
                  <p className="reservation__limitBanner" role="status">
                    한 계정당 예약은 최대 {reservationLimit}건입니다. 취소한 뒤
                    새로 예약할 수 있어요.
                  </p>
                ) : null}
                <form className="reservation__form" onSubmit={handleSubmit}>
                  <fieldset className="reservation__field">
                    <p className="reservation__timeHint">설명 추후 삽입</p>
                    <ReservationHourPicker
                      active={sheetOpen}
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
                      disabled={!canCreateReservation}
                    />
                  </label>

                  <label className="reservation__field reservation__field--stack">
                    <span className="reservation__label">인원</span>
                    <div className="reservation__numberWrap">
                      <button
                        type="button"
                        className="reservation__numberBtn"
                        aria-label="인원 한 명 줄이기"
                        disabled={
                          !canCreateReservation || headcountStepValue <= 1
                        }
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
                        disabled={!canCreateReservation}
                      />
                      <button
                        type="button"
                        className="reservation__numberBtn"
                        aria-label="인원 한 명 늘리기"
                        disabled={
                          !canCreateReservation || headcountStepValue >= 99
                        }
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
                      type="button"
                      className="reservation__btn reservation__btn--ghost"
                      onClick={closeSheet}
                    >
                      닫기
                    </button>
                    <button
                      type="submit"
                      className="reservation__btn reservation__btn--primary"
                      disabled={
                        submitting ||
                        !canCreateReservation ||
                        selectedHours.length === 0
                      }
                    >
                      {submitting ? "처리 중…" : "예약하기"}
                    </button>
                  </div>
                </form>
              </div>
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

export default Reservation;
