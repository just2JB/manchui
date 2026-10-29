import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { serverUrl } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import {
  IoCloseOutline,
  IoMapOutline,
  IoShareSocialOutline,
} from "react-icons/io5";
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
  collectReservedHoursForDate,
  filterVisibleReservations,
} from "./reservationRetention";
import { useReservationNow } from "./useReservationLiveSync";
import { getReservationBookerName } from "./reservationLookup";
import {
  readLastTeamName,
  writeLastTeamName,
} from "./reservationTeamNameStore";
import {
  isClubInitialLoading,
  useAllReservationsQuery,
  useClubQueryInvalidationOnFocus,
  useInvalidateClubReservations,
  useMyReservationsQuery,
  useReservationMutations,
  emptyReservationsMine,
} from "../../../queries/useClubQueries";

const TEAM_NAME_MAX = 20;
const HEADCOUNT_MAX = 99;

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

/** "2026-10-29" → "10월 29일 (목)" */
function formatDateLabel(dateKey) {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const w = WEEK_LABELS[new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 (${w})`;
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

function sortByDateThenStart(list) {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return Math.min(...a.time.map(Number)) - Math.min(...b.time.map(Number));
  });
}

const Reservation = () => {
  const { user } = useAuth();
  const modal = useManchuiModal();
  const userId = user?._id;

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [sheetOpen, setSheetOpen] = useState(false);
  /** 캘린더에서 고른 날짜 — 처음엔 오늘, 해당일 예약 현황을 아래에 표시 */
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    formatDateKey(new Date()),
  );

  const [selectedHours, setSelectedHours] = useState([]);
  const [teamName, setTeamName] = useState(() => readLastTeamName());
  const [headcount, setHeadcount] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [viewingReservation, setViewingReservation] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const allQuery = useAllReservationsQuery();
  const mineQuery = useMyReservationsQuery(userId);
  const { createReservation, deleteReservation } =
    useReservationMutations(userId);
  const invalidateReservations = useInvalidateClubReservations(userId);
  useClubQueryInvalidationOnFocus(invalidateReservations);

  const trimmedTeamName = teamName.trim();

  const allReservations = useMemo(() => allQuery.data ?? [], [allQuery.data]);
  const mineData = mineQuery.data ?? emptyReservationsMine();
  const mineReservations = mineData.reservations;
  const reservationLimit = mineData.quota.limit;

  const loading = isClubInitialLoading(allQuery);
  const mineLoading = isClubInitialLoading(mineQuery);

  const now = useReservationNow();

  const visibleAllReservations = useMemo(
    () => filterVisibleReservations(allReservations, now),
    [allReservations, now],
  );

  /** 내 계정으로 한 예약 (종료된 건 제외) */
  const myReservations = useMemo(
    () => sortByDateThenStart(filterVisibleReservations(mineReservations, now)),
    [mineReservations, now],
  );

  /** 계정당 건수 제한 (종료되지 않은 일반 예약 기준) */
  const quotaFull = !mineLoading && myReservations.length >= reservationLimit;

  const myReservationIds = useMemo(
    () => new Set(myReservations.map((r) => String(r._id))),
    [myReservations],
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

  /** 인원 스텝 버튼용 (빈 칸은 1로 간주) */
  const headcountStepValue = useMemo(() => {
    if (headcount === "") return 1;
    const n = Number(headcount);
    if (!Number.isFinite(n)) return 1;
    return Math.min(HEADCOUNT_MAX, Math.max(1, n));
  }, [headcount]);

  const selectionSummary = useMemo(() => {
    if (selectedHours.length === 0) return null;
    return `${formatReservationTimeRange(selectedHours)} · ${selectedHours.length}시간`;
  }, [selectedHours]);

  /** 시트가 열려 있는 동안 배경 스크롤 잠금 */
  useEffect(() => {
    if (!sheetOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  /** 선택한 날짜의 예약 (시작 시각순) */
  const selectedDayReservations = useMemo(() => {
    if (!selectedDateKey) return [];
    return sortByDateThenStart(
      visibleAllReservations.filter((r) => r.date === selectedDateKey),
    );
  }, [selectedDateKey, visibleAllReservations]);

  /** 오늘이면 남은 시간이 하나도 없을 수 있음 */
  const selectedDayHasFreeHour = useMemo(() => {
    if (!selectedDateKey) return false;
    const currentHour = new Date().getHours();
    for (let h = 0; h < 24; h++) {
      if (reservedOnSelected.has(h)) continue;
      if (selectedDateKey === todayKey && h <= currentHour) continue;
      return true;
    }
    return false;
    // now: 분 단위 갱신 시 오늘 남은 시간 재계산
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateKey, reservedOnSelected, todayKey, now]);

  const openSheet = () => {
    if (!selectedDateKey) return;
    setSelectedHours([]);
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
      const current = new Date();
      if (h <= current.getHours()) return true;
    }
    return false;
  };

  const handleHourClick = async (h) => {
    if (isHourBlocked(h)) return;

    if (selectedHours.length === 0) {
      setSelectedHours([h]);
      return;
    }

    const earliest = Math.min(...selectedHours);
    const latest = Math.max(...selectedHours);

    /** 이미 선택된 구간 안을 누르면 처음부터 다시 */
    if (h >= earliest && h <= latest) {
      setSelectedHours(h === earliest && selectedHours.length === 1 ? [] : [h]);
      return;
    }

    if (h < earliest) {
      setSelectedHours([h]);
      return;
    }

    for (let t = earliest; t <= h; t++) {
      if (isHourBlocked(t)) {
        await modal(
          "선택한 두 시각 사이에 예약할 수 없는 시간이 포함되어 있습니다.",
          "alert",
        );
        return;
      }
    }
    const range = [];
    for (let t = earliest; t <= h; t++) range.push(t);
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
    if (!trimmedTeamName) {
      await modal("팀 이름을 입력해 주세요.", "alert");
      return;
    }
    if (quotaFull) {
      await modal(
        `한 계정당 예약은 최대 ${reservationLimit}건까지 가능합니다.`,
        "alert",
      );
      return;
    }
    const hc = Number(headcount);
    if (!Number.isInteger(hc) || hc < 1 || hc > HEADCOUNT_MAX) {
      await modal(
        `사용 인원은 1~${HEADCOUNT_MAX}명으로 입력해 주세요.`,
        "alert",
      );
      return;
    }

    setSubmitting(true);
    try {
      await createReservation.mutateAsync({
        date: selectedDateKey,
        teamName: trimmedTeamName,
        time: selectedHours.map(Number),
        headcount: hc,
      });
      writeLastTeamName(trimmedTeamName);
      closeSheet();
      await modal("예약이 완료되었습니다.", "alert");
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "예약에 실패했습니다.";
      await modal(msg, "alert");
    } finally {
      setSubmitting(false);
    }
  };

  /** 내 예약에서 고른 날짜로 캘린더 이동 + 해당일 현황 표시 */
  const showDate = (dateKey) => {
    const [y, m] = String(dateKey).split("-").map(Number);
    if (y && m) setViewMonth(new Date(y, m - 1, 1));
    setSelectedDateKey(dateKey);
  };

  const handleDeleteMine = async (id) => {
    if (!serverUrl) return;
    const ok = await modal("이 예약을 취소할까요?", "confirm");
    if (!ok) return;
    try {
      await deleteReservation.mutateAsync(id);
      await modal("예약이 취소되었습니다.", "alert");
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
    isViewingTodayMonth,
    navigateToMonth,
    swipeHandlers,
    consumeClickAfterSwipe,
    monthKey,
  } = useCalendarMonthSlide(viewMonth, setViewMonth);

  const reservationCountByDate = useMemo(() => {
    const map = new Map();
    for (const r of visibleAllReservations) {
      map.set(r.date, (map.get(r.date) || 0) + 1);
    }
    return map;
  }, [visibleAllReservations]);

  if (!serverUrl) {
    return (
      <div className="reservation">
        <p className="reservation__warn">
          서버 연결 설정(VITE_SERVER_URL)이 필요합니다.
        </p>
      </div>
    );
  }

  const submitDisabled =
    submitting || selectedHours.length === 0 || !trimmedTeamName || quotaFull;

  return (
    <div className="reservation">
      <header className="reservation__titleRow">
        <div className="reservation__titleText">
          <h1 className="reservation__title">동아리방 예약</h1>
          <p className="reservation__subtitle">
            날짜를 골라 예약 현황을 보고, 팀 이름으로 예약하세요.
          </p>
        </div>
        <div className="reservation__titleActions">
          <ClubRoomRulesBar inline />
          <button
            type="button"
            className="reservation__mapBtn"
            onClick={() => setLocationModalOpen(true)}
            aria-label="동아리방 위치 보기"
          >
            <IoMapOutline className="reservation__mapBtnIcon" aria-hidden />
          </button>
        </div>
      </header>

      <div className="reservation__layout">
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
                  return (
                    <div key={cell.key} className="reservation__dayEmpty" />
                  );
                }
                const key = cell.key;
                const t = cell.date.getTime();
                const isPast = t < todayStart;
                const isToday = key === todayKey;
                const count = loading
                  ? 0
                  : (reservationCountByDate.get(key) ?? 0);
                const isSelected = key === selectedDateKey;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={isPast || loading}
                    aria-pressed={isSelected}
                    aria-label={`${formatDateLabel(key)}${count ? `, 예약 ${count}건` : ""}`}
                    className={`reservation__day${isToday ? " reservation__day--today" : ""}${isSelected ? " reservation__day--selected" : ""}${isPast ? " reservation__day--past" : ""}${calendarDayLoadingClass(loading)}`}
                    onClick={() => {
                      if (consumeClickAfterSwipe()) return;
                      if (!isPast && !loading) setSelectedDateKey(key);
                    }}
                  >
                    <span className="reservation__dayNum">
                      {cell.date.getDate()}
                    </span>
                    {count > 0 ? (
                      <span className="reservation__dayDots" aria-hidden>
                        {Array.from({ length: Math.min(count, 3) }).map(
                          (_, i) => (
                            <span key={i} className="reservation__dayDot" />
                          ),
                        )}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </ReservationCalendarSlide>
          <ReservationCalendarFooter
            loading={loading}
            hint="날짜를 누르면 그날 예약 현황을 볼 수 있어요."
            onToday={goToToday}
            isViewingTodayMonth={isViewingTodayMonth}
          />
        </section>

        <aside className="reservation__side">
          <section
            className="reservation__daySection"
            aria-labelledby="reservation-day-title"
            aria-live="polite"
          >
            <div className="reservation__dayHead">
              <h2
                id="reservation-day-title"
                className="reservation__sectionTitle"
              >
                {selectedDateKey
                  ? formatDateLabel(selectedDateKey)
                  : "날짜 선택"}
                {selectedDateKey === todayKey ? (
                  <span className="reservation__todayBadge">오늘</span>
                ) : null}
              </h2>
              <span className="reservation__dayCount">
                {loading ? "" : `예약 ${selectedDayReservations.length}건`}
              </span>
            </div>

            {loading ? (
              <ReservationMyListSkeleton count={1} />
            ) : selectedDayReservations.length === 0 ? (
              <p className="reservation__empty">아직 예약이 없어요.</p>
            ) : (
              <ul className="reservation__dayList">
                {selectedDayReservations.map((r) => (
                  <li key={r._id} className="reservation__dayItem">
                    <span className="reservation__dayItemTime">
                      {formatReservationTimeRange(r.time)}
                    </span>
                    <span className="reservation__dayItemTeam">
                      {getReservationBookerName(r)}
                      {myReservationIds.has(String(r._id)) ? (
                        <span className="reservation__mineBadge">내 예약</span>
                      ) : null}
                    </span>
                    <span className="reservation__dayItemMeta">
                      {r.bookingType === "admin" ? "임원진 · " : ""}
                      {r.headcount != null ? `${r.headcount}명` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              className="reservation__btn reservation__btn--primary reservation__reserveBtn"
              onClick={openSheet}
              disabled={
                loading ||
                !selectedDateKey ||
                !selectedDayHasFreeHour ||
                quotaFull
              }
            >
              {quotaFull
                ? `예약 가능 건수(${reservationLimit}건)를 모두 사용했어요`
                : !loading && selectedDateKey && !selectedDayHasFreeHour
                  ? "예약 가능한 시간이 없어요"
                  : "이 날 예약하기"}
            </button>
          </section>

          <section
            className="reservation__mySection"
            aria-labelledby="reservation-mine-title"
          >
            <div className="reservation__myHead">
              <h2
                id="reservation-mine-title"
                className="reservation__sectionTitle"
              >
                내 예약
              </h2>
              {!mineLoading ? (
                <span className="reservation__dayCount" aria-live="polite">
                  {myReservations.length}/{reservationLimit}건
                </span>
              ) : null}
            </div>
            <p className="reservation__quotaNote">
              계정당 최대 {reservationLimit}건까지 예약할 수 있어요. 취소하면
              다시 예약할 수 있어요.
            </p>
            {mineLoading ? (
              <ReservationMyListSkeleton count={2} />
            ) : myReservations.length === 0 ? (
              <p className="reservation__empty">예약 내역이 없습니다.</p>
            ) : (
              <ul className="reservation__myList">
                {myReservations.map((r) => (
                  <li key={r._id} className="reservation__myCard">
                    <button
                      type="button"
                      className="reservation__myMain"
                      onClick={() => showDate(r.date)}
                      aria-label={`${formatDateLabel(r.date)} 예약 현황 보기`}
                    >
                      <span className="reservation__myDate">
                        {formatDateLabel(r.date)}
                      </span>
                      <span className="reservation__myTime">
                        {formatReservationTimeRange(r.time)}
                      </span>
                      <span className="reservation__myMeta">
                        {getReservationBookerName(r)}
                        {r.headcount != null ? ` · ${r.headcount}명` : ""}
                      </span>
                    </button>
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
          </section>
        </aside>
      </div>

      {sheetOpen && selectedDateKey
        ? createPortal(
            <div className="reservation__sheetRoot" role="presentation">
              <button
                type="button"
                className="reservation__sheetBackdrop"
                aria-label="닫기"
                tabIndex={-1}
                onClick={closeSheet}
              />
              <form
                className="reservation__sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reservation-sheet-title"
                onSubmit={handleSubmit}
              >
                <div className="reservation__sheetHeader">
                  <span className="reservation__sheetHandle" aria-hidden />
                  <h2
                    id="reservation-sheet-title"
                    className="reservation__sheetTitle"
                  >
                    {formatDateLabel(selectedDateKey)}
                  </h2>
                  <button
                    type="button"
                    className="reservation__sheetClose"
                    onClick={closeSheet}
                    aria-label="닫기"
                  >
                    <IoCloseOutline aria-hidden />
                  </button>
                </div>

                <div className="reservation__sheetBody">
                  <fieldset className="reservation__step">
                    <legend className="reservation__stepTitle">
                      <span className="reservation__stepNum">1</span>
                      시간 선택
                    </legend>
                    <p className="reservation__timeHint">
                      시작 시간과 끝 시간을 차례로 누르세요. 예약된 칸을 누르면
                      정보를 볼 수 있어요.
                    </p>
                    <ReservationHourPicker
                      selectedDateKey={selectedDateKey}
                      selectedHours={selectedHours}
                      reservedOnSelected={reservedOnSelected}
                      todayKey={todayKey}
                      canCreateReservation
                      allReservations={allReservations}
                      onSelectHour={(h) => void handleHourClick(h)}
                      onViewReservation={setViewingReservation}
                    />
                  </fieldset>

                  <div className="reservation__step">
                    <p className="reservation__stepTitle">
                      <span className="reservation__stepNum">2</span>
                      예약 정보
                    </p>
                    <label className="reservation__field reservation__field--stack">
                      <span className="reservation__label">팀 이름</span>
                      <input
                        type="text"
                        className="reservation__input"
                        value={teamName}
                        onChange={(e) =>
                          setTeamName(e.target.value.slice(0, TEAM_NAME_MAX))
                        }
                        placeholder="예: 만취 1팀"
                        autoComplete="off"
                        enterKeyHint="done"
                        maxLength={TEAM_NAME_MAX}
                      />
                      <span className="reservation__fieldHelp">
                        다른 팀원들이 알아볼 수 있는 팀 이름을 적어 주세요.
                      </span>
                    </label>

                    <div className="reservation__field reservation__field--stack">
                      <span
                        className="reservation__label"
                        id="reservation-headcount-label"
                      >
                        사용 인원
                      </span>
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
                          max={HEADCOUNT_MAX}
                          inputMode="numeric"
                          aria-labelledby="reservation-headcount-label"
                          className="reservation__input reservation__input--numberCore"
                          value={headcount}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "") {
                              setHeadcount("");
                              return;
                            }
                            const n = Math.round(Number(raw));
                            if (!Number.isFinite(n)) return;
                            setHeadcount(
                              Math.max(1, Math.min(HEADCOUNT_MAX, n)),
                            );
                          }}
                        />
                        <span className="reservation__numberUnit" aria-hidden>
                          명
                        </span>
                        <button
                          type="button"
                          className="reservation__numberBtn"
                          aria-label="인원 한 명 늘리기"
                          disabled={headcountStepValue >= HEADCOUNT_MAX}
                          onClick={() =>
                            setHeadcount(
                              Math.min(HEADCOUNT_MAX, headcountStepValue + 1),
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="reservation__sheetFooter">
                  <p
                    className={`reservation__selectionSummary${selectionSummary ? "" : " reservation__selectionSummary--empty"}`}
                    aria-live="polite"
                  >
                    {selectionSummary ?? "시간을 선택해 주세요"}
                  </p>
                  <button
                    type="submit"
                    className="reservation__btn reservation__btn--primary"
                    disabled={submitDisabled}
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

export default Reservation;
