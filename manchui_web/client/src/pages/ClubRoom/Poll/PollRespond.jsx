import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { IoShareOutline, IoPersonCircleOutline } from "react-icons/io5";
import { useAuth } from "../../../context/AuthContext";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import Loading from "../../../components/Loading/Loading";
import {
  enterPollAsGuest,
  fetchPoll,
  savePollResponse,
} from "../../../api/pollApi";
import PollGrid from "./PollGrid";
import {
  availabilityToSet,
  buildPollHeatmap,
  formatPollDateShort,
  formatPollHourRange,
  getPollDisplayTitle,
  getPollHours,
  isPollPast,
  loadGuestCredentials,
  setToAvailability,
  sharePollLink,
  storeGuestCredentials,
} from "./pollUtils";
import { toVisibleTeamColor } from "../Team/teamColorPresets";
import {
  formatPracticeTimeShort,
  getUpcomingPractices,
} from "../Team/teamCalendarUtils";
import "./Poll.css";

/** identity: { kind: "user" } | { kind: "guest", name, password } */

const PRACTICE_PREVIEW_COUNT = 6;
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function formatPracticeDate(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return `${m}/${d} (${WEEK[new Date(y, m - 1, d).getDay()]})`;
}

const PollRespond = () => {
  const { pollId } = useParams();
  const nav = useNavigate();
  const modal = useManchuiModal();
  const { user, sessionReady } = useAuth();

  const [poll, setPoll] = useState(null);
  const [viewer, setViewer] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamPractices, setTeamPractices] = useState([]);
  const [showAllPractices, setShowAllPractices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [identity, setIdentity] = useState(null);
  const [mySlots, setMySlots] = useState(() => new Set());
  const [saveState, setSaveState] = useState("idle");
  const [tab, setTab] = useState("mine");
  const [activeSlot, setActiveSlot] = useState(null);
  const [pinnedSlot, setPinnedSlot] = useState(null);

  const [guestName, setGuestName] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [guestError, setGuestError] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);

  const savingRef = useRef(false);
  const pendingRef = useRef(null);
  const joinedNoticeRef = useRef(false);

  const load = useCallback(async () => {
    if (!pollId) return;
    try {
      const data = await fetchPoll(pollId);
      if (!data.poll) {
        setNotFound(true);
        return;
      }
      setPoll(data.poll);
      setViewer(data.viewer);
      setTeamMembers(data.teamMembers);
      setTeamPractices(data.teamPractices);
      return data;
    } catch (error) {
      if (error.response?.status === 404) setNotFound(true);
      else console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    if (!sessionReady) return;
    void (async () => {
      const data = await load();
      if (!data?.poll) return;
      // 로그인 계정으로 이미 응답했다면 바로 이어서 수정
      const mine = data.viewer?.myResponseId
        ? data.poll.responses.find((r) => r._id === data.viewer.myResponseId)
        : null;
      if (mine && user) {
        setIdentity({ kind: "user" });
        setMySlots(availabilityToSet(mine.availability));
        return;
      }
      const stored = loadGuestCredentials(pollId);
      if (stored) {
        const guest = data.poll.responses.find(
          (r) =>
            r.kind === "guest" &&
            r.name.toLowerCase() === stored.name.toLowerCase(),
        );
        if (guest) {
          setIdentity({ kind: "guest", ...stored });
          setMySlots(availabilityToSet(guest.availability));
        } else {
          storeGuestCredentials(pollId, null);
        }
      }
    })();
  }, [sessionReady, load, pollId, user]);

  const hours = useMemo(() => getPollHours(poll), [poll]);
  const heatmap = useMemo(() => buildPollHeatmap(poll), [poll]);
  const responseById = useMemo(
    () => new Map((poll?.responses ?? []).map((r) => [r._id, r])),
    [poll],
  );

  const upcomingPractices = useMemo(
    () => getUpcomingPractices(teamPractices, { limit: 0 }),
    [teamPractices],
  );
  const pollDateSet = useMemo(() => new Set(poll?.dates ?? []), [poll]);

  const readOnly = Boolean(poll?.closed) || isPollPast(poll);
  const teamName = poll?.team?.name ?? "";
  const accent = toVisibleTeamColor(poll?.team?.teamColor, "#ff453a");

  const myName =
    identity?.kind === "guest" ? identity.name : (user?.username ?? "나");

  const applyResponse = useCallback((response) => {
    if (!response) return;
    setPoll((prev) => {
      if (!prev) return prev;
      const exists = prev.responses.some((r) => r._id === response._id);
      return {
        ...prev,
        responses: exists
          ? prev.responses.map((r) => (r._id === response._id ? response : r))
          : [...prev.responses, response],
      };
    });
  }, []);

  /** 드래그가 끝날 때마다 저장. 저장 중이면 마지막 상태만 이어서 저장 */
  const flushSave = useCallback(
    async (slots) => {
      if (!poll || !identity) return;
      if (savingRef.current) {
        pendingRef.current = slots;
        return;
      }
      savingRef.current = true;
      setSaveState("saving");
      try {
        const { response, joinedTeam } = await savePollResponse(poll._id, {
          availability: setToAvailability(slots, poll.dates),
          guest:
            identity.kind === "guest"
              ? { name: identity.name, password: identity.password }
              : null,
        });
        applyResponse(response);
        if (identity.kind === "user" && response?._id) {
          setViewer((prev) => ({
            ...prev,
            myResponseId: response._id,
            isMember: true,
          }));
        }
        setSaveState("saved");
        if (joinedTeam && !joinedNoticeRef.current) {
          joinedNoticeRef.current = true;
          void modal(`${teamName || "팀"}에 자동으로 합류했어요.`);
        }
      } catch (error) {
        setSaveState("error");
        await modal(error.response?.data?.message ?? "저장에 실패했습니다.");
      } finally {
        savingRef.current = false;
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending) void flushSave(pending);
      }
    },
    [poll, identity, applyResponse, modal, teamName],
  );

  const handleCommit = useCallback(
    (next) => {
      setMySlots(next);
      void flushSave(next);
    },
    [flushSave],
  );

  const handleUseAccount = () => {
    const mine =
      (viewer?.myResponseId ? responseById.get(viewer.myResponseId) : null) ??
      (poll?.responses ?? []).find(
        (r) => r.kind === "user" && user?._id && String(r.userId) === String(user._id),
      );
    setIdentity({ kind: "user" });
    setMySlots(mine ? availabilityToSet(mine.availability) : new Set());
    setTab("mine");
  };

  const handleGuestSubmit = async (event) => {
    event.preventDefault();
    if (guestSubmitting) return;
    setGuestError("");
    setGuestSubmitting(true);
    try {
      const creds = { name: guestName.trim(), password: guestPassword };
      const response = await enterPollAsGuest(pollId, creds);
      if (!response) throw new Error("no response");
      applyResponse(response);
      storeGuestCredentials(pollId, { name: response.name, password: creds.password });
      setIdentity({ kind: "guest", name: response.name, password: creds.password });
      setMySlots(availabilityToSet(response.availability));
      setGuestPassword("");
      setTab("mine");
    } catch (error) {
      setGuestError(error.response?.data?.message ?? "입장에 실패했습니다.");
    } finally {
      setGuestSubmitting(false);
    }
  };

  const handleSwitchIdentity = () => {
    if (identity?.kind === "guest") storeGuestCredentials(pollId, null);
    setShowGuestForm(identity?.kind === "user");
    setIdentity(null);
    setMySlots(new Set());
    setSaveState("idle");
  };

  const handleSlotFocus = useCallback((slot, opts) => {
    if (opts?.fromHover) {
      setActiveSlot(slot);
      return;
    }
    setPinnedSlot((prev) =>
      prev && slot && prev.dateKey === slot.dateKey && prev.hour === slot.hour
        ? null
        : slot,
    );
  }, []);

  if (loading || !sessionReady) {
    return (
      <div className="pollPage">
        <Loading overlay={false} />
      </div>
    );
  }

  if (notFound || !poll) {
    return (
      <div className="pollPage">
        <div className="pollCard pollCard--empty">
          <p className="pollCard__title">일정 종합을 찾을 수 없어요</p>
          <p className="pollCard__muted">링크가 잘못되었거나 일정 종합이 삭제되었습니다.</p>
          <Link className="pollBtn pollBtn--ghost" to="/club">
            만취 어시스턴트로
          </Link>
        </div>
      </div>
    );
  }

  const shownSlot = activeSlot ?? pinnedSlot;
  const shownIds = shownSlot
    ? (heatmap.slots.get(`${shownSlot.dateKey}|${shownSlot.hour}`) ?? [])
    : [];
  const shownAvailable = shownIds.map((id) => responseById.get(id)).filter(Boolean);
  const shownSet = new Set(shownIds);
  const shownUnavailable = heatmap.respondents.filter((r) => !shownSet.has(r._id));

  const loginFrom = encodeURIComponent(`/club/poll/${poll._id}`);
  const canEdit = Boolean(identity) && !readOnly;

  const groupPanel = (
    <section className="pollPanel" aria-label="모두의 가능 시간">
      {/* 모바일에서 탭이 있으면 탭이 제목 역할 → 제목 숨김(CSS). PC·마감(탭 없음)에선 보임 */}
      <div className={`pollPanel__head${readOnly ? "" : " pollPanel__head--tabbed"}`}>
        <h2 className="pollPanel__title">모두의 가능 시간</h2>
        <span className="pollPanel__meta">{heatmap.total}명 응답</span>
      </div>
      <div className="pollGridScroll">
        <PollGrid
          dates={poll.dates}
          hours={hours}
          mode="view"
          heatmap={heatmap}
          activeSlot={shownSlot}
          onSlotFocus={handleSlotFocus}
          ariaLabel="모두의 가능 시간"
        />
      </div>
      <div className="pollWho" aria-live="polite">
        {shownSlot ? (
          <>
            <p className="pollWho__slot">
              {formatPollDateShort(shownSlot.dateKey)}{" "}
              {formatPollHourRange(shownSlot.hour, shownSlot.hour + 1)}
            </p>
            <div className="pollWho__cols">
              <div>
                <p className="pollWho__label">
                  가능 {shownAvailable.length}
                </p>
                <ul className="pollWho__list">
                  {shownAvailable.map((r) => (
                    <li key={r._id} className="pollChip pollChip--ok">
                      {r.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="pollWho__label">
                  불가 {shownUnavailable.length}
                </p>
                <ul className="pollWho__list">
                  {shownUnavailable.map((r) => (
                    <li key={r._id} className="pollChip pollChip--no">
                      {r.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );

  const minePanel = (
    <section className="pollPanel" aria-label={`${myName}님의 가능 시간`}>
      <div className="pollPanel__head pollPanel__head--mine">
        <h2 className="pollPanel__title pollPanel__title--tabbed">{myName}님의 가능 시간</h2>
        <span
          className={`pollSave pollSave--${saveState}`}
          role="status"
          aria-live="polite"
        >
          {saveState === "saving"
            ? "저장 중…"
            : saveState === "saved"
              ? "저장됨"
              : saveState === "error"
                ? "저장 실패"
                : "자동 저장"}
        </span>
      </div>
      <div className="pollGridScroll">
        <PollGrid
          dates={poll.dates}
          hours={hours}
          mode="edit"
          selected={mySlots}
          onCommit={handleCommit}
          disabled={!canEdit}
          ariaLabel="내 가능 시간"
        />
      </div>
      <div className="pollPanel__foot">
        <button
          type="button"
          className="pollBtn pollBtn--text"
          onClick={handleSwitchIdentity}
        >
          {identity?.kind === "guest" ? "다른 이름으로 입장" : "게스트로 응답하기"}
        </button>
        {mySlots.size > 0 ? (
          <button
            type="button"
            className="pollBtn pollBtn--text"
            onClick={() => handleCommit(new Set())}
          >
            모두 지우기
          </button>
        ) : null}
      </div>
    </section>
  );

  const identityPanel = (
    <section className="pollPanel pollIdentity" aria-label="누구로 응답할까요?">
      <h2 className="pollPanel__title pollPanel__title--tabbed">누구로 응답할까요?</h2>
      {user && !showGuestForm ? (
        <>
          <button
            type="button"
            className="pollBtn pollBtn--primary pollBtn--block"
            onClick={handleUseAccount}
          >
            <IoPersonCircleOutline aria-hidden />
            {user.username}님으로 응답하기
          </button>
          {!viewer?.isMember ? (
            <p className="pollPanel__hint">
              응답하면 <strong>{teamName}</strong> 팀에 자동으로 합류해요.
            </p>
          ) : null}
          <button
            type="button"
            className="pollBtn pollBtn--text"
            onClick={() => setShowGuestForm(true)}
          >
            계정 없이 이름으로 응답하기
          </button>
        </>
      ) : (
        <>
          {!user ? (
            <>
              <button
                type="button"
                className="pollBtn pollBtn--primary pollBtn--block"
                onClick={() => nav(`/club/login?from=${loginFrom}`)}
              >
                만취 계정으로 로그인
              </button>
              <p className="pollPanel__hint">
                계정으로 응답하면 {teamName} 팀에 자동으로 합류해요.
              </p>
              <div className="pollDivider">
                <span>또는 게스트로</span>
              </div>
            </>
          ) : null}
          <form className="pollGuestForm" onSubmit={handleGuestSubmit}>
            <label className="pollField">
              <span className="pollField__label">이름</span>
              <input
                className="pollField__input"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={20}
                autoComplete="nickname"
                placeholder="예: 김만취"
                required
              />
            </label>
            <label className="pollField">
              <span className="pollField__label">비밀번호</span>
              <input
                className="pollField__input"
                type="password"
                value={guestPassword}
                onChange={(e) => setGuestPassword(e.target.value)}
                minLength={4}
                maxLength={64}
                autoComplete="off"
                placeholder="4자 이상"
                required
              />
            </label>
            {guestError ? <p className="pollError">{guestError}</p> : null}
            <button
              type="submit"
              className="pollBtn pollBtn--secondary pollBtn--block"
              disabled={guestSubmitting || !guestName.trim() || guestPassword.length < 4}
            >
              {guestSubmitting ? "확인 중…" : "입장하기"}
            </button>
          </form>
          {user ? (
            <button
              type="button"
              className="pollBtn pollBtn--text"
              onClick={() => setShowGuestForm(false)}
            >
              ← {user.username}님으로 응답하기
            </button>
          ) : null}
        </>
      )}
    </section>
  );

  const leftPanel = readOnly ? null : identity ? minePanel : identityPanel;

  return (
    <div className="pollPage" style={{ "--team-accent": accent }}>
      {viewer?.isMember ? (
        <button
          type="button"
          className="teamPage__back"
          onClick={() => nav(`/club/team/${poll.teamId}`)}
        >
          ← {teamName}
        </button>
      ) : null}

      {/* 머리: 팀 이름만 (+ 마감 표시) · 링크 공유 */}
      <header className="pollHero pollHero--nameOnly">
        <h1 className="pollHero__title">
          {teamName || getPollDisplayTitle(poll)}
          {readOnly ? <span className="pollTag">마감</span> : null}
        </h1>
        <button
          type="button"
          className="pollBtn pollBtn--ghost pollHero__share"
          onClick={() => void sharePollLink(poll, teamName, modal)}
        >
          <IoShareOutline aria-hidden /> 링크 공유
        </button>
      </header>

      {leftPanel ? (
        <div className="pollTabs" role="tablist" aria-label="보기 전환">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "mine"}
            className={`pollTabs__tab${tab === "mine" ? " pollTabs__tab--on" : ""}`}
            onClick={() => setTab("mine")}
          >
            {identity ? "내 시간 입력" : "응답하기"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "group"}
            className={`pollTabs__tab${tab === "group" ? " pollTabs__tab--on" : ""}`}
            onClick={() => setTab("group")}
          >
            모두의 시간 · {heatmap.total}
          </button>
        </div>
      ) : null}

      <div className={`pollColumns pollColumns--${leftPanel ? tab : "group"}`}>
        {leftPanel ? <div className="pollColumns__mine">{leftPanel}</div> : null}
        <div className="pollColumns__group">{groupPanel}</div>
      </div>

      {/* 이 팀에 이미 잡힌 연습 전체 (어느 일정 요청에서 잡혔든) */}
      <section className="pollPractices" aria-labelledby="poll-practices-title">
        <div className="pollPractices__head">
          <h2 id="poll-practices-title" className="pollPractices__title">
            {teamName ? `${teamName} 연습 일정` : "팀 연습 일정"}
          </h2>
          <span className="pollPractices__meta">
            {upcomingPractices.length > 0 ? `앞으로 ${upcomingPractices.length}개` : ""}
          </span>
        </div>
        {upcomingPractices.length === 0 ? (
          <p className="pollPractices__empty">아직 잡힌 연습이 없어요.</p>
        ) : (
          <>
            <ul className="pollPractices__list">
              {(showAllPractices
                ? upcomingPractices
                : upcomingPractices.slice(0, PRACTICE_PREVIEW_COUNT)
              ).map((practice) => {
                const place = String(practice.place ?? "").trim();
                const inPoll = pollDateSet.has(practice.dateKey);
                return (
                  <li
                    key={practice._id}
                    className={`pollPractices__item${inPoll ? " pollPractices__item--inPoll" : ""}`}
                  >
                    <span className="pollPractices__date">
                      {formatPracticeDate(practice.dateKey)}
                    </span>
                    <span className="pollPractices__time">
                      {formatPracticeTimeShort(practice.time)}
                    </span>
                    <span className="pollPractices__place">
                      {place && place !== "미확정" ? place : "장소 미정"}
                    </span>
                  </li>
                );
              })}
            </ul>
            {upcomingPractices.length > PRACTICE_PREVIEW_COUNT ? (
              <button
                type="button"
                className="pollPractices__more"
                onClick={() => setShowAllPractices((prev) => !prev)}
                aria-expanded={showAllPractices}
              >
                {showAllPractices
                  ? "접기"
                  : `${upcomingPractices.length - PRACTICE_PREVIEW_COUNT}개 더 보기`}
              </button>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
};

export default PollRespond;
