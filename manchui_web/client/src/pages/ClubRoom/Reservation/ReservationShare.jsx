import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IoShareOutline } from "react-icons/io5";
import apiClient, { serverUrl } from "../../../api/apiClient";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import ClubRoomMapEmbed from "../../../components/ClubRoomMapEmbed/ClubRoomMapEmbed";
import ClubRoomRulesBar from "./ClubRoomRulesBar";
import { normalizeDateKey, formatDateKey } from "../Team/teamCalendarUtils";
import "./ReservationShare.css";
import { formatReservationTimeRange } from "./reservationTimeFormat";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

/** 날짜 키 → { month, day, week, relative } */
function describeDate(raw) {
  const key = normalizeDateKey(raw);
  if (!key) return null;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const diff = Math.round(
    (date - new Date(formatDateKey(new Date()) + "T00:00")) / 86400000,
  );
  const relative =
    diff === 0 ? "오늘" : diff === 1 ? "내일" : diff === 2 ? "모레" : diff > 0 ? `${diff}일 후` : "지난 예약";
  return { year: y, month: m, day: d, week: WEEK[date.getDay()], relative };
}

async function shareThisPage(modal) {
  const url = window.location.href;
  const shareData = { title: "동아리방 예약", url };
  if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(shareData))) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    await modal("예약 링크가 복사되었습니다.");
  } catch {
    await modal(`아래 링크를 복사해 보내 주세요.\n\n${url}`);
  }
}

const ReservationShare = () => {
  const { id } = useParams();
  const modal = useManchuiModal();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!serverUrl) {
        setError("서버 연결 설정이 필요합니다.");
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/api/reservation/public/${id}`);
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e.response?.data?.message || "예약 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const when = data ? describeDate(data.date) : null;
  const thisYear = new Date().getFullYear();

  return (
    <div className="reservationShare">
      <header className="reservationShare__head">
        <p className="reservationShare__eyebrow">동아리방 예약</p>
        <ClubRoomRulesBar inline />
      </header>

      {loading ? (
        <p className="reservationShare__status">불러오는 중…</p>
      ) : error ? (
        <p className="reservationShare__error" role="alert">
          {error}
        </p>
      ) : data ? (
        <section className="reservationShare__info" aria-label="예약 정보">
          {when ? (
            <p className="reservationShare__date">
              {when.year !== thisYear ? `${when.year}년 ` : ""}
              {when.month}월 {when.day}일 {when.week}요일
              <span className="reservationShare__relative" data-past={when.relative === "지난 예약" || undefined}>
                {when.relative}
              </span>
            </p>
          ) : (
            <p className="reservationShare__date">{data.date}</p>
          )}
          <p className="reservationShare__time">{formatReservationTimeRange(data.time)}</p>

          <dl className="reservationShare__rows">
            <div className="reservationShare__row">
              <dt>예약한 팀</dt>
              <dd>{data.teamName ?? "—"}</dd>
            </div>
            <div className="reservationShare__row">
              <dt>인원</dt>
              <dd>{data.headcount != null ? `${data.headcount}명` : "—"}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {data ? (
        <button
          type="button"
          className="reservationShare__share"
          onClick={() => void shareThisPage(modal)}
        >
          <IoShareOutline aria-hidden="true" />
          이 예약 공유하기
        </button>
      ) : null}

      <section className="reservationShare__location" aria-labelledby="reservationShare-location-title">
        <h2 id="reservationShare-location-title" className="reservationShare__locationTitle">
          찾아오는 길
        </h2>
        <div className="reservationShare__map">
          <ClubRoomMapEmbed height={260} />
        </div>
      </section>

      <footer className="reservationShare__footer">
        <Link className="reservationShare__link" to="/club/reservation">
          동아리방 예약하기
        </Link>
        <Link className="reservationShare__link reservationShare__link--sub" to="/club">
          홈으로
        </Link>
      </footer>
    </div>
  );
};

export default ReservationShare;
