import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IoLocationOutline, IoShareOutline } from "react-icons/io5";
import apiClient from "../../../api/apiClient";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import {
  formatDateKey,
  formatPracticeTimeShort,
  getUpcomingPractices,
} from "./teamCalendarUtils";
import { toVisibleTeamColor } from "./teamColorPresets";
import { getTeamPracticeShareUrl, shareTeamPracticeSchedule } from "./teamUtils";
import "./TeamPracticeShare.css";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function relativeLabel(dateKey, todayKey) {
  const diff = Math.round(
    (new Date(dateKey + "T00:00") - new Date(todayKey + "T00:00")) / 86400000,
  );
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  if (diff <= 6) return `${diff}일 후`;
  return "";
}

/**
 * 팀 전체 연습 일정 공유 페이지 (로그인 없이 열람)
 * 다가오는 연습을 달별로 묶어 날짜 · 시간 · 장소만 보여준다.
 */
const TeamPracticeShare = () => {
  const { teamId } = useParams();
  const modal = useManchuiModal();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/api/practice/share/${teamId}`);
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || "연습 일정을 불러오지 못했어요.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const todayKey = formatDateKey(new Date());
  const upcoming = useMemo(
    () => getUpcomingPractices(data?.practices ?? [], { limit: 0 }),
    [data],
  );

  // 달별로 묶기
  const months = useMemo(() => {
    const groups = [];
    for (const practice of upcoming) {
      const [y, m] = practice.dateKey.split("-").map(Number);
      const key = `${y}-${m}`;
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        group = { key, label: `${y !== new Date().getFullYear() ? `${y}년 ` : ""}${m}월`, items: [] };
        groups.push(group);
      }
      group.items.push(practice);
    }
    return groups;
  }, [upcoming]);

  const accent = toVisibleTeamColor(data?.team?.teamColor);
  const teamName = data?.team?.name ?? "";

  return (
    <div className="practiceShare" style={{ "--team-accent": accent }}>
      {loading ? (
        <p className="practiceShare__status">불러오는 중…</p>
      ) : error ? (
        <p className="practiceShare__error" role="alert">{error}</p>
      ) : (
        <>
          <header className="practiceShare__head">
            <p className="practiceShare__eyebrow">연습 일정</p>
            <h1 className="practiceShare__team">
              <span className="practiceShare__mark" aria-hidden="true" />
              {teamName}
            </h1>
            <div className="practiceShare__headRow">
              <p className="practiceShare__summary">
                {upcoming.length > 0 ? `앞으로 ${upcoming.length}번` : "잡힌 연습이 없어요"}
              </p>
              <button
                type="button"
                className="practiceShare__shareBtn"
                onClick={() => void shareTeamPracticeSchedule(teamName, teamId, modal)}
                aria-label="이 페이지 링크 공유"
              >
                <IoShareOutline aria-hidden="true" />
                공유
              </button>
            </div>
          </header>

          {months.map((group) => (
            <section key={group.key} className="practiceShare__month" aria-label={group.label}>
              <h2 className="practiceShare__monthTitle">{group.label}</h2>
              <ul className="practiceShare__list">
                {group.items.map((practice) => {
                  const [y, m, d] = practice.dateKey.split("-").map(Number);
                  const weekIndex = new Date(y, m - 1, d).getDay();
                  const rel = relativeLabel(practice.dateKey, todayKey);
                  const place = String(practice.place ?? "").trim();
                  return (
                    <li key={practice._id} className="practiceShare__item"
                      data-today={practice.dateKey === todayKey || undefined}>
                      <div className="practiceShare__date" data-weekend={weekIndex === 0 || weekIndex === 6 || undefined}>
                        <span className="practiceShare__day">{d}</span>
                        <span className="practiceShare__week">{WEEK[weekIndex]}</span>
                      </div>
                      <div className="practiceShare__body">
                        <p className="practiceShare__time">
                          {formatPracticeTimeShort(practice.time)}
                          {rel ? <span className="practiceShare__rel">{rel}</span> : null}
                        </p>
                        <p className="practiceShare__place">
                          <IoLocationOutline aria-hidden="true" />
                          {place && place !== "미확정" ? place : "장소 미정"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <footer className="practiceShare__foot">
            <Link to="/club" className="practiceShare__homeLink">만취 동아리방 열기</Link>
            <span className="practiceShare__url">{getTeamPracticeShareUrl(teamId).replace(/^https?:\/\//, "")}</span>
          </footer>
        </>
      )}
    </div>
  );
};

export default TeamPracticeShare;
