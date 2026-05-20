import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient, { serverUrl } from "../../../api/apiClient";
import "./ReservationShare.css";
import { formatReservationTimeRange } from "./reservationTimeFormat";

const ReservationShare = () => {
  const { id } = useParams();
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

  return (
    <div className="reservationShare">
      <h1 className="reservationShare__title">동아리방 예약</h1>
      <p className="reservationShare__lead">
        공유 링크로 열람한 예약 정보입니다. 연락처는 일부만 표시됩니다.
      </p>

      {loading ? (
        <p className="reservationShare__status">불러오는 중…</p>
      ) : error ? (
        <p className="reservationShare__error" role="alert">
          {error}
        </p>
      ) : data ? (
        <div className="reservationShare__card">
          <dl className="reservationShare__dl">
            <div className="reservationShare__row">
              <dt>날짜</dt>
              <dd>{data.date}</dd>
            </div>
            <div className="reservationShare__row">
              <dt>시간</dt>
              <dd>{formatReservationTimeRange(data.time)}</dd>
            </div>
            <div className="reservationShare__row">
              <dt>인원</dt>
              <dd>{data.headcount != null ? `${data.headcount}명` : "—"}</dd>
            </div>
            <div className="reservationShare__row">
              <dt>연락처</dt>
              <dd>{data.contactMasked ?? "—"}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className="reservationShare__footer">
        <Link className="reservationShare__link" to="/club/reservation">
          예약 페이지로
        </Link>
        <Link
          className="reservationShare__link reservationShare__link--sub"
          to="/club"
        >
          홈
        </Link>
      </div>
    </div>
  );
};

export default ReservationShare;
