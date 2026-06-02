import React, { useCallback, useEffect, useMemo, useState } from "react";
import apiClient, { serverUrl } from "../../api/apiClient";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import "./AdminReservationLimits.css";

const authConfig = () => {
  const token = localStorage.getItem("token");
  return {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

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

  return (
    <section className="admin-res-limits" aria-label="예약 건수 제한 설정">
      <p className="admin-res-limits__lead">
        동아리방 일반 예약(/club/reservation)에만 적용됩니다. 비우면 기본값을
        따르고, 관리자 화면에서 등록하는 예약은 제한에 포함되지 않습니다.
      </p>

      <div className="admin-res-limits__defaultRow">
        <label className="admin-res-limits__defaultLabel" htmlFor="res-default-limit">
          기본 제한 (계정당)
        </label>
        <div className="admin-res-limits__defaultControls">
          <input
            id="res-default-limit"
            type="number"
            min={0}
            max={99}
            className="admin-res-limits__input admin-res-limits__input--narrow"
            value={defaultLimit}
            onChange={(e) => setDefaultLimit(e.target.value)}
          />
          <span className="admin-res-limits__unit">건</span>
          <button
            type="button"
            className="admin-res-limits__btn"
            disabled={savingDefault || loading}
            onClick={() => void handleSaveDefault()}
          >
            {savingDefault ? "저장 중…" : "기본값 저장"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="admin-res-limits__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="admin-res-limits__userToolbar">
        <label className="admin-res-limits__searchLabel" htmlFor="res-limit-search">
          회원 검색
        </label>
        <input
          id="res-limit-search"
          type="search"
          className="admin-res-limits__search"
          placeholder="이름, 아이디, 이메일"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="admin-res-limits__hint">불러오는 중…</p>
      ) : filteredUsers.length === 0 ? (
        <p className="admin-res-limits__hint">표시할 회원이 없습니다.</p>
      ) : (
        <div className="admin-res-limits__tableWrap">
          <table className="admin-res-limits__table">
            <thead>
              <tr>
                <th scope="col">회원</th>
                <th scope="col">현재 일반 예약</th>
                <th scope="col">개별 제한</th>
                <th scope="col">적용 제한</th>
                <th scope="col">저장</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const id = String(u._id);
                const atLimit = u.currentCount >= u.effectiveLimit;
                return (
                  <tr key={id} className={atLimit ? "admin-res-limits__row--full" : undefined}>
                    <td>
                      <span className="admin-res-limits__name">{u.username}</span>
                      {u.Identification ? (
                        <span className="admin-res-limits__id">
                          {" "}
                          ({u.Identification})
                        </span>
                      ) : null}
                    </td>
                    <td>
                      {u.currentCount}건
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        className="admin-res-limits__input admin-res-limits__input--narrow"
                        placeholder="기본값"
                        aria-label={`${u.username} 개별 예약 제한`}
                        value={draftByUser[id] ?? ""}
                        onChange={(e) =>
                          setDraftByUser((prev) => ({
                            ...prev,
                            [id]: e.target.value,
                          }))
                        }
                      />
                    </td>
                    <td>
                      {u.effectiveLimit}건
                      {u.customLimit === null ? (
                        <span className="admin-res-limits__badge">기본</span>
                      ) : null}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-res-limits__btn admin-res-limits__btn--small"
                        disabled={busyUserId === id}
                        onClick={() => void handleSaveUser(id)}
                      >
                        {busyUserId === id ? "…" : "저장"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default AdminReservationLimits;
