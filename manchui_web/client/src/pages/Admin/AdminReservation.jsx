import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import apiClient, { serverUrl } from "../../api/apiClient";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import "../ClubRoom/Reservation/Reservation.css";
import { formatReservationTimeRange } from "../ClubRoom/Reservation/reservationTimeFormat";
import ClubRoomRulesBar from "../ClubRoom/Reservation/ClubRoomRulesBar";
import ReservedSlotDetailModal from "../ClubRoom/Reservation/ReservedSlotDetailModal";
import {
  findReservationForHour,
  getHourSlotState,
} from "../ClubRoom/Reservation/reservationLookup";
import "./AdminReservation.css";


const FIRST_HOUR = 0;
const LAST_HOUR = 23;

const authConfig = () => {
  const token = localStorage.getItem("token");
  return {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

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

/** 서버 `bookingType === 'admin'` (구 데이터는 general로 간주) */
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

function AdminReservationTable({
  rows,
  busyId,
  onDeleteOne,
  isPastDateKey,
}) {
  if (rows.length === 0) return null;
  return (
    <div className="admin-reservation__tableWrap">
      <table className="admin-reservation__table">
        <thead>
          <tr>
            <th scope="col">날짜</th>
            <th scope="col">시간</th>
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

const AdminReservation = () => {
  const modal = useManchuiModal();

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [allReservations, setAllReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const [selectedHours, setSelectedHours] = useState([]);
  const [contact, setContact] = useState("");
  const [headcount, setHeadcount] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [purging, setPurging] = useState(false);
  const [viewingReservation, setViewingReservation] = useState(null);

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

  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const todayStart = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  }, []);

  const reservedOnSelected = useMemo(() => {
    if (!selectedDateKey) return new Set();
    return collectReservedHoursForDate(selectedDateKey, allReservations);
  }, [selectedDateKey, allReservations]);

  const hourSlots = useMemo(() => {
    const list = [];
    for (let h = FIRST_HOUR; h <= LAST_HOUR; h++) list.push(h);
    return list;
  }, []);

  const headcountStepValue = useMemo(() => {
    if (headcount === "") return 1;
    const n = Number(headcount);
    if (!Number.isFinite(n)) return 1;
    return Math.min(99, Math.max(1, n));
  }, [headcount]);

  /** 관리자 화면: 계정당 예약 건수 제한 없음 */
  const canCreateReservation = true;

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
      closeSheet();
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
      "오늘 이전 날짜의 예약을 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다.",
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
      await modal(`지난 예약 ${n}건을 삭제했습니다.`, "alert");
      await loadList();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "삭제에 실패했습니다.";
      await modal(msg, "alert");
    } finally {
      setPurging(false);
    }
  };

  const monthTitle = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;
  const grid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  const hasReservationOnDate = (dateKey) => {
    return collectReservedHoursForDate(dateKey, allReservations).size > 0;
  };

  const { generalReservationRows, adminReservationRows } = useMemo(() => {
    const general = [];
    const admin = [];
    for (const r of allReservations) {
      if (isAdminBooking(r)) admin.push(r);
      else general.push(r);
    }
    return {
      generalReservationRows: sortReservationRowsDesc(general),
      adminReservationRows: sortReservationRowsDesc(admin),
    };
  }, [allReservations]);

  const isPastDateKey = (dateKey) => {
    const [y, m, d] = dateKey.split("-").map(Number);
    if (!y || !m || !d) return false;
    const t = new Date(y, m - 1, d).getTime();
    return t < todayStart;
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
    <div className="reservation admin-reservation">
      <h1 className="admin-page-heading reservation__title">예약 관리</h1>
      <p className="admin-reservation__lead">
        전체 예약을 조회·삭제하고, 계정당 건수 제한 없이 새 예약을 등록할 수
        있습니다.
      </p>

      <section
        className="admin-reservation__listSection"
        aria-label="예약 목록"
      >
        <div className="admin-reservation__toolbar">
          <h2 className="admin-reservation__listTitle">예약 목록</h2>
          <div className="admin-reservation__toolbarRight">
            <ClubRoomRulesBar inline />
            <button
              type="button"
              className="admin-reservation__purgeBtn"
              disabled={purging || loading}
              onClick={() => void handlePurgePast()}
            >
              {purging ? "처리 중…" : "지난 예약 일괄 삭제"}
            </button>
          </div>
        </div>
        {listError ? (
          <p className="reservation__warn" role="alert">
            {listError}
          </p>
        ) : null}
        {loading ? (
          <p className="reservation__hint">목록을 불러오는 중…</p>
        ) : generalReservationRows.length === 0 &&
          adminReservationRows.length === 0 ? (
          <p className="reservation__empty">등록된 예약이 없습니다.</p>
        ) : (
          <>
            <div className="admin-reservation__block">
              <h3 className="admin-reservation__subTitle">일반 예약</h3>
              <p className="admin-reservation__subHint">
                동아리방 예약 서비스(/club/reservation)에서 등록한 내역입니다.
              </p>
              {generalReservationRows.length === 0 ? (
                <p className="admin-reservation__emptyBlock">해당 내역이 없습니다.</p>
              ) : (
                <AdminReservationTable
                  rows={generalReservationRows}
                  busyId={busyId}
                  onDeleteOne={(id) => void handleDeleteOne(id)}
                  isPastDateKey={isPastDateKey}
                />
              )}
            </div>
            <div className="admin-reservation__block admin-reservation__block--executive">
              <h3 className="admin-reservation__subTitle">관리자 예약</h3>
              <p className="admin-reservation__subHint">
                관리자 예약 관리 화면에서 등록한 내역입니다.
              </p>
              {adminReservationRows.length === 0 ? (
                <p className="admin-reservation__emptyBlock">해당 내역이 없습니다.</p>
              ) : (
                <AdminReservationTable
                  rows={adminReservationRows}
                  busyId={busyId}
                  onDeleteOne={(id) => void handleDeleteOne(id)}
                  isPastDateKey={isPastDateKey}
                />
              )}
            </div>
          </>
        )}
      </section>

      <section
        className="reservation__calendarSection"
        aria-label="예약 캘린더"
      >
        <div className="reservation__monthNav">
          <button
            type="button"
            className="reservation__monthBtn"
            onClick={() =>
              setViewMonth(
                (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
              )
            }
            aria-label="이전 달"
          >
            <IoChevronBack />
          </button>
          <span className="reservation__monthTitle">{monthTitle}</span>
          <button
            type="button"
            className="reservation__monthBtn"
            onClick={() =>
              setViewMonth(
                (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
              )
            }
            aria-label="다음 달"
          >
            <IoChevronForward />
          </button>
        </div>

        <div className="reservation__weekRow">
          {WEEK_LABELS.map((w) => (
            <span key={w} className="reservation__weekCell">
              {w}
            </span>
          ))}
        </div>

        <div className="reservation__dayGrid">
          {grid.map((cell) => {
            if (!cell.date) {
              return <div key={cell.key} className="reservation__dayEmpty" />;
            }
            const key = cell.key;
            const t = cell.date.getTime();
            const isPast = t < todayStart;
            const isToday = key === todayKey;
            const hasDot = hasReservationOnDate(key);
            return (
              <button
                key={cell.key}
                type="button"
                disabled={isPast}
                className={`reservation__day${isToday ? " reservation__day--today" : ""}${isPast ? " reservation__day--past" : ""}`}
                onClick={() => !isPast && openSheetForDate(key)}
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
        <p className="reservation__hint">
          날짜를 눌러 예약할 시간과 연락처를 입력하세요. (관리자: 건수 제한
          없음)
        </p>
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
                aria-labelledby="admin-reservation-sheet-title"
              >
                <div className="reservation__sheetHandleWrap">
                  <span className="reservation__sheetHandle" aria-hidden />
                </div>
                <h2
                  id="admin-reservation-sheet-title"
                  className="reservation__sheetTitle"
                >
                  {selectedDateKey} 예약 (관리자)
                </h2>
                <p className="admin-reservation__quotaNote" role="status">
                  이 화면에서 등록하는 예약은 서버에 관리자 예약으로 저장됩니다.
                  계정당 예약 건수 제한은 적용되지 않습니다.
                </p>
                <form className="reservation__form" onSubmit={handleSubmit}>
                  <fieldset className="reservation__field">
                    <legend className="reservation__label">
                      시간 (0~23시)
                    </legend>
                    <p className="reservation__timeHint">설명 추후 삽입</p>
                    <div className="reservation__hourTrack">
                      <div className="reservation__hourScroll">
                        <div
                          className="reservation__hourScrollInner"
                          role="group"
                          aria-label="0시부터 23시까지 시간대 선택"
                        >
                          <span className="reservation__hourLabelWrap">
                            <span className="reservation__hourLabel">
                              {FIRST_HOUR}
                            </span>
                          </span>
                          {hourSlots.map((h) => {
                            const { reserved, visuallyBlocked, disabled } =
                              getHourSlotState(h, {
                                reservedOnSelected,
                                selectedDateKey,
                                todayKey,
                                canCreateReservation,
                              });
                            const selected = selectedHours.includes(h);
                            return (
                              <Fragment key={h}>
                                <button
                                  type="button"
                                  disabled={disabled}
                                  className={`reservation__hourCell${selected ? " reservation__hourCell--selected" : ""}${visuallyBlocked ? " reservation__hourCell--blocked" : ""}${reserved ? " reservation__hourCell--reserved" : ""}`}
                                  onClick={() => {
                                    if (reserved) {
                                      const r = findReservationForHour(
                                        selectedDateKey,
                                        h,
                                        allReservations,
                                      );
                                      if (r) setViewingReservation(r);
                                      return;
                                    }
                                    if (!disabled) void handleHourClick(h);
                                  }}
                                  aria-pressed={selected}
                                  aria-label={
                                    reserved
                                      ? `${h}시~${h + 1}시 예약됨, 정보 보기`
                                      : visuallyBlocked
                                        ? `${h}시~${h + 1}시 구간 예약 불가`
                                        : selected
                                          ? `${h}시~${h + 1}시 구간 선택됨`
                                          : `${h}시~${h + 1}시 구간 선택`
                                  }
                                />
                                <span className="reservation__hourLabelWrap">
                                  <span className="reservation__hourLabel">
                                    {h + 1}
                                  </span>
                                </span>
                              </Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>
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
                      type="button"
                      className="reservation__btn reservation__btn--ghost"
                      onClick={closeSheet}
                    >
                      닫기
                    </button>
                    <button
                      type="submit"
                      className="reservation__btn reservation__btn--primary"
                      disabled={submitting || selectedHours.length === 0}
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
    </div>
  );
};

export default AdminReservation;
