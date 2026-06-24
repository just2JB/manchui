import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoShareSocialOutline } from "react-icons/io5";
import { serverUrl } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { formatReservationTimeRange } from "../Reservation/reservationTimeFormat";
import {
  countActiveReservations,
  filterVisibleReservations,
} from "../Reservation/reservationRetention";
import { useReservationNow } from "../Reservation/useReservationLiveSync";
import ClubRoomRulesBar from "../Reservation/ClubRoomRulesBar";
import ReservationMyListSkeleton from "../Reservation/ReservationMyListSkeleton";
import {
  emptyReservationsMine,
  isClubInitialLoading,
  useClubQueryInvalidationOnFocus,
  useInvalidateClubReservations,
  useMyReservationsQuery,
  useReservationMutations,
} from "../../../queries/useClubQueries";
import "../Reservation/Reservation.css";
import "./Mypage.css";

const MypageReservations = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const modal = useManchuiModal();
  const userId = user?._id;

  const mineQuery = useMyReservationsQuery(userId);
  const { deleteReservation } = useReservationMutations(userId);
  const invalidateReservations = useInvalidateClubReservations(userId);
  useClubQueryInvalidationOnFocus(invalidateReservations);

  const mineData = mineQuery.data ?? emptyReservationsMine();
  const myReservations = mineData.reservations;
  const reservationLimit = mineData.quota.limit;
  const loading = isClubInitialLoading(mineQuery);

  const now = useReservationNow();

  const visibleReservations = useMemo(
    () => filterVisibleReservations(myReservations, now),
    [myReservations, now],
  );

  const activeCount = useMemo(
    () => countActiveReservations(myReservations, now),
    [myReservations, now],
  );

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

  return (
    <div className="mypageHub mypageReservations">
      <button
        type="button"
        className="mypageSaved__back"
        onClick={() => nav("/club/mypage")}
      >
        ← 마이페이지
      </button>
      <div className="mypageReservations__head">
        <h1 className="mypageHub__pageTitle">내 예약</h1>
        <ClubRoomRulesBar inline />
      </div>

      <div className="mypageReservations__content">
      {loading ? (
        <ReservationMyListSkeleton count={2} />
      ) : (
        <>
      <p className="reservation__quotaNote" aria-live="polite">
        계정당 예약 최대 {reservationLimit}건 (현재 {activeCount}/
        {reservationLimit})
      </p>
      {visibleReservations.length === 0 ? (
        <div className="mypageReservations__empty">
          <p className="reservation__empty">예약 내역이 없습니다.</p>
          <Link className="mypageReservations__reserveLink" to="/club/reservation">
            동아리방 예약하기
          </Link>
        </div>
      ) : (
        <ul className="reservation__myList mypageReservations__list">
          {visibleReservations.map((r) => (
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
                  onClick={() => void handleShareReservation(r._id)}
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
                  onClick={() => void handleDeleteMine(r._id)}
                >
                  취소
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {visibleReservations.length > 0 ? (
        <Link
          className="mypageReservations__reserveLink mypageReservations__reserveLink--compact"
          to="/club/reservation"
        >
          새 예약하기
        </Link>
      ) : null}
        </>
      )}
      </div>
    </div>
  );
};

export default MypageReservations;
