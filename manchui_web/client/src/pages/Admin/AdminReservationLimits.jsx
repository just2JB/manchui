import React, { useCallback, useEffect, useMemo, useState } from "react";
import apiClient, { serverUrl } from "../../api/apiClient";
import { authRequestConfig } from "../../api/tokenStorage";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import "./adminList.css";
import "./AdminReservationLimits.css";
import { LOADING_TEXT } from "../../constants/loadingText";

const authConfig = authRequestConfig;

const memberMatchesQuery = (u, rawQ) => {
  const q = rawQ.trim().toLowerCase();
  if (!q) return true;
  const hay = [u.username, u.Identification, u.email]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
};

const AdminReservationLimits = () => {
  const modal = useManchuiModal();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [defaultLimit, setDefaultLimit] = useState("3");
  const [savedDefaultLimit, setSavedDefaultLimit] = useState("3");
  /** all | full(한도 도달) | custom(개별 설정) */
  const [limitFilter, setLimitFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [draftByUser, setDraftByUser] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [savingDefault, setSavingDefault] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);

  const loadLimits = useCallback(async () => {
    if (!serverUrl) {
      setError("서버 URL이 설정되지 않았습니다.");
      setLoading(false);
      return;
    }
    setError("");
    try {
      const res = await apiClient.get(
        "/api/reservation/admin/limits",
        authConfig(),
      );
      const def = res.data?.defaultLimit ?? 3;
      const list = Array.isArray(res.data?.users) ? res.data.users : [];
      setDefaultLimit(String(def));
      setSavedDefaultLimit(String(def));
      setUsers(list);
      const drafts = {};
      for (const u of list) {
        drafts[String(u._id)] =
          u.customLimit === null || u.customLimit === undefined
            ? ""
            : String(u.customLimit);
      }
      setDraftByUser(drafts);
    } catch (e) {
      setError(
        e.response?.data?.message || "예약 제한 설정을 불러오지 못했습니다.",
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLimits();
  }, [loadLimits]);

  const filteredUsers = useMemo(
    () => users.filter((u) => memberMatchesQuery(u, searchQuery)),
    [users, searchQuery],
  );

  const handleSaveDefault = async () => {
    const n = Number(defaultLimit);
    if (!Number.isFinite(n) || n < 0 || n > 99 || !Number.isInteger(n)) {
      await modal("기본 제한은 0~99 사이 정수로 입력해 주세요.", "alert");
      return;
    }
    setSavingDefault(true);
    try {
      await apiClient.put(
        "/api/reservation/admin/limits/default",
        { limit: n },
        authConfig(),
      );
      await modal("기본 예약 제한이 저장되었습니다.", "alert");
      await loadLimits();
    } catch (e) {
      await modal(
        e.response?.data?.message || "저장에 실패했습니다.",
        "alert",
      );
    } finally {
      setSavingDefault(false);
    }
  };

  const handleSaveUser = async (userId) => {
    const raw = draftByUser[String(userId)] ?? "";
    const trimmed = String(raw).trim();
    if (trimmed !== "" && (!Number.isFinite(Number(trimmed)) || Number(trimmed) < 0 || Number(trimmed) > 99)) {
      await modal("개별 제한은 0~99 정수이거나 비워 두세요.", "alert");
      return;
    }
    setBusyUserId(userId);
    try {
      const body =
        trimmed === "" ? { limit: null } : { limit: Number(trimmed) };
      await apiClient.patch(
        `/api/reservation/admin/limits/users/${userId}`,
        body,
        authConfig(),
      );
      await loadLimits();
    } catch (e) {
      await modal(
        e.response?.data?.message || "저장에 실패했습니다.",
        "alert",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const defaultNum = Number(defaultLimit);
  const defaultDirty = String(defaultLimit) !== String(savedDefaultLimit);

  const counts = {
    all: users.length,
    full: users.filter((u) => u.currentCount >= u.effectiveLimit).length,
    custom: users.filter((u) => u.customLimit !== null && u.customLimit !== undefined).length,
  };
  const shownUsers = filteredUsers.filter((u) => {
    if (limitFilter === "full") return u.currentCount >= u.effectiveLimit;
    if (limitFilter === "custom") return u.customLimit !== null && u.customLimit !== undefined;
    return true;
  });

  const savedDraftOf = (u) =>
    u.customLimit === null || u.customLimit === undefined ? "" : String(u.customLimit);
  const stepDraft = (id, base, delta) => {
    setDraftByUser((prev) => {
      const cur = prev[id];
      const n = cur === "" || cur === undefined ? Number(base) : Number(cur);
      const next = Math.max(0, Math.min(99, (Number.isFinite(n) ? n : 0) + delta));
      return { ...prev, [id]: String(next) };
    });
  };

  return (
    <section className="admin-res-limits" aria-label="예약 건수 제한 설정">
      {loading ? (
        <p className="aList__empty" aria-live="polite">
          {LOADING_TEXT}
        </p>
      ) : (
        <>
          {/* 기본 제한: 한 줄 */}
          <div className="aBar">
            <div className="aBar__state">
              <span className="aBar__title">기본 제한 · 계정당</span>
              <span className="aBar__hint">
                동아리방 일반 예약에만 적용 · 관리자 예약은 제외
              </span>
            </div>
            <div className="aBar__controls">
              <div className="aStepper" aria-label="기본 예약 제한">
                <button
                  type="button"
                  aria-label="기본 제한 1 줄이기"
                  disabled={!(defaultNum > 0)}
                  onClick={() => setDefaultLimit((v) => String(Math.max(0, (Number(v) || 0) - 1)))}
                >
                  −
                </button>
                <input
                  id="res-default-limit"
                  type="number"
                  min={0}
                  max={99}
                  inputMode="numeric"
                  aria-label="기본 예약 제한"
                  value={defaultLimit}
                  onChange={(e) => setDefaultLimit(e.target.value)}
                />
                <button
                  type="button"
                  aria-label="기본 제한 1 늘리기"
                  disabled={defaultNum >= 99}
                  onClick={() => setDefaultLimit((v) => String(Math.min(99, (Number(v) || 0) + 1)))}
                >
                  +
                </button>
                <span className="aStepper__unit">건</span>
              </div>
              <button
                type="button"
                className="aBar__save"
                disabled={savingDefault || !defaultDirty}
                onClick={() => void handleSaveDefault()}
              >
                {savingDefault ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>

          {error ? (
            <p className="aList__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="aList">
            <div className="aList__tabs" role="tablist" aria-label="회원 보기">
              {[
                ["all", "전체"],
                ["full", "한도 도달"],
                ["custom", "개별 설정"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={limitFilter === value}
                  className="aList__tab"
                  onClick={() => setLimitFilter(value)}
                >
                  {label}
                  <span>{counts[value]}</span>
                </button>
              ))}
            </div>

            <div className="aList__tools">
              <input
                id="res-limit-search"
                type="search"
                className="aList__search"
                placeholder="이름, 아이디, 이메일"
                aria-label="회원 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {shownUsers.length === 0 ? (
              <p className="aList__empty">표시할 회원이 없어요.</p>
            ) : (
              <div className="aList__table admin-res-limits__table" role="table" aria-label="회원별 예약 제한">
                <div className="aList__row aList__row--head" role="row">
                  <span role="columnheader">회원</span>
                  <span role="columnheader">사용 중</span>
                  <span role="columnheader">개별 제한</span>
                  <span role="columnheader" aria-label="저장" />
                </div>
                {shownUsers.map((u) => {
                  const id = String(u._id);
                  const draft = draftByUser[id] ?? "";
                  const dirty = draft.trim() !== savedDraftOf(u);
                  const isDefault = u.customLimit === null || u.customLimit === undefined;
                  const atLimit = u.currentCount >= u.effectiveLimit;
                  const ratio = u.effectiveLimit > 0 ? Math.min(1, u.currentCount / u.effectiveLimit) : 1;
                  return (
                    <div key={id} role="row" className="aList__row">
                      <span role="cell" className="aList__ellipsis">
                        <span className="aList__strong">{u.username}</span>
                        {u.Identification ? (
                          <span className="aList__muted"> {u.Identification}</span>
                        ) : null}
                      </span>
                      <span role="cell" className="admin-res-limits__usage">
                        <span
                          className={`admin-res-limits__meter${atLimit ? " admin-res-limits__meter--full" : ""}`}
                          aria-hidden
                        >
                          <i style={{ width: `${ratio * 100}%` }} />
                        </span>
                        <span className="aList__num">
                          {u.currentCount} / {u.effectiveLimit}건
                        </span>
                        {isDefault ? <span className="aList__tag">기본</span> : null}
                      </span>
                      <span role="cell">
                        <span className="aStepper">
                          <button
                            type="button"
                            aria-label={`${u.username} 제한 1 줄이기`}
                            disabled={draft !== "" && Number(draft) <= 0}
                            onClick={() => stepDraft(id, u.effectiveLimit, -1)}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            inputMode="numeric"
                            placeholder="기본"
                            aria-label={`${u.username} 개별 예약 제한`}
                            value={draft}
                            onChange={(e) =>
                              setDraftByUser((prev) => ({ ...prev, [id]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            aria-label={`${u.username} 제한 1 늘리기`}
                            disabled={draft !== "" && Number(draft) >= 99}
                            onClick={() => stepDraft(id, u.effectiveLimit, 1)}
                          >
                            +
                          </button>
                        </span>
                      </span>
                      <span role="cell" className="aList__actions">
                        {draft !== "" ? (
                          <button
                            type="button"
                            className="aList__btn"
                            title="개별 제한을 지우고 기본값 따르기"
                            onClick={() => setDraftByUser((prev) => ({ ...prev, [id]: "" }))}
                          >
                            기본으로
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="aList__btn aList__btn--primary"
                          disabled={!dirty || busyUserId === id}
                          onClick={() => void handleSaveUser(id)}
                        >
                          {busyUserId === id ? "…" : "저장"}
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default AdminReservationLimits;
