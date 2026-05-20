import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import apiClient, { serverUrl } from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { IoInformationCircleOutline } from "react-icons/io5";
import "./AdminMember.css";
import { useManchuiModal } from "../../hooks/ManchuiModal";


const authConfig = () => {
  const token = localStorage.getItem("token");
  return {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

const positionLabel = (p) => {
  if (p === "임원진") return "임원진";
  if (p === "댄서") return "일반(댄서)";
  return p || "—";
};

/** 서버 joinedAt/createdAt 또는 ObjectId 기준 시각 */
const memberJoinedDate = (m) => {
  const raw = m.joinedAt || m.createdAt;
  if (raw) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const id = m._id;
  if (id != null && String(id).length === 24) {
    const sec = parseInt(String(id).slice(0, 8), 16);
    if (!Number.isNaN(sec)) return new Date(sec * 1000);
  }
  return null;
};

const formatDateTimeKo = (d) =>
  d
    ? d.toLocaleString("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

/** 이름·아이디·이메일·직책·표시용 직책 라벨에서 부분 검색 */
const memberMatchesQuery = (m, rawQ) => {
  const q = rawQ.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    m.username,
    m.Identification,
    m.email,
    m.position,
    positionLabel(m.position),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
};

const AdminMember = () => {
  const { user: adminUser } = useAuth();
  const manchuiModal = useManchuiModal();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailMember, setDetailMember] = useState(null);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => memberMatchesQuery(m, searchQuery));
  }, [members, searchQuery]);

  const fetchMembers = useCallback(async () => {
    if (!serverUrl) {
      setLoading(false);
      setError("서버 URL이 설정되지 않았습니다.");
      return;
    }
    setError("");
    try {
      const res = await apiClient.get(
        "/api/auth/admin/members",
        authConfig(),
      );
      setMembers(Array.isArray(res.data.members) ? res.data.members : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "회원 목록을 불러오지 못했습니다.",
      );
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (!detailMember) return;
    const onKey = (e) => {
      if (e.key === "Escape") setDetailMember(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailMember]);

  const setPosition = async (memberId, position) => {
    const label = position === "임원진" ? "임원진" : "일반 멤버(댄서)";
    if (
      !(await manchuiModal(`이 회원을 ${label}(으)로 변경할까요?`, "confirm"))
    ) {
      return;
    }
    setBusyId(memberId);
    try {
      await apiClient.patch(
        `/api/auth/admin/members/${memberId}/position`,
        { position },
        authConfig(),
      );
      await manchuiModal("직책이 변경되었습니다.");
      await fetchMembers();
    } catch (err) {
      await manchuiModal(
        err.response?.data?.message || "직책 변경에 실패했습니다.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const selectValueForMember = (m) =>
    m.position === "임원진" ? "임원진" : "댄서";

  const handleRoleSelectChange = (m, next) => {
    if (
      (m.position === "임원진" || m.position === "댄서") &&
      next === m.position
    ) {
      return;
    }
    void setPosition(m._id, next);
  };

  const removeMember = async (memberId, memberName) => {
    if (
      !(await manchuiModal(
        `「${memberName}」회원을 탈퇴(삭제) 처리할까요? 이 작업은 되돌릴 수 없습니다.`,
        "confirm",
      ))
    ) {
      return;
    }
    setBusyId(memberId);
    try {
      await apiClient.delete(
        `/api/auth/admin/members/${memberId}`,
        authConfig(),
      );
      await manchuiModal("회원이 삭제되었습니다.");
      await fetchMembers();
    } catch (err) {
      await manchuiModal(
        err.response?.data?.message || "삭제에 실패했습니다.",
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="adminMember">
        <h1 className="admin-page-heading">부원 관리</h1>
        <p className="adminMember__empty">불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="adminMember">
      <h1 className="admin-page-heading">부원 관리</h1>

      <div className="adminMember__toolbar">
        <div className="adminMember__toolbarLeft">
          <span className="adminMember__count">
            전체 {members.length}명
            {searchQuery.trim() ? (
              <>
                {" "}
                · 검색 결과 {filteredMembers.length}명
              </>
            ) : null}
          </span>
        </div>
        <div className="adminMember__toolbarRight">
          <label className="adminMember__searchLabel" htmlFor="admin-member-search">
            <span className="adminMember__searchLabelText">검색</span>
            <input
              id="admin-member-search"
              type="search"
              className="adminMember__search"
              placeholder="이름, 아이디, 이메일, 직책"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="adminMember__refresh"
            onClick={() => {
              setLoading(true);
              fetchMembers();
            }}
            disabled={!serverUrl}
          >
            새로고침
          </button>
        </div>
      </div>

      {error ? <p className="adminMember__error">{error}</p> : null}

      {!error && members.length === 0 ? (
        <p className="adminMember__empty">등록된 회원이 없습니다.</p>
      ) : null}

      {!error && members.length > 0 && filteredMembers.length === 0 ? (
        <p className="adminMember__empty">
          검색 조건에 맞는 회원이 없습니다.
        </p>
      ) : null}

      {!error && members.length > 0 && filteredMembers.length > 0 ? (
        <div className="adminMember__tableWrap">
          <table className="adminMember__table">
            <thead>
              <tr>
                <th>이름</th>
                <th>아이디</th>
                <th>직책</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => {
                const isSelf =
                  adminUser?._id &&
                  String(m._id) === String(adminUser._id);
                const isExec = m.position === "임원진";
                const disabled = busyId === m._id;
                return (
                  <tr key={m._id}>
                    <td>
                      <div className="adminMember__nameCell">
                        <span className="adminMember__nameText">
                          {m.username ?? "—"}
                          {isSelf ? (
                            <span className="adminMember__self">(나)</span>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          className="adminMember__detailIconBtn"
                          onClick={() => setDetailMember(m)}
                          aria-label={`${m.username ?? "회원"} 상세정보`}
                          title="상세정보"
                        >
                          <IoInformationCircleOutline
                            className="adminMember__detailIcon"
                            aria-hidden
                          />
                        </button>
                      </div>
                    </td>
                    <td>{m.Identification ?? "—"}</td>
                    <td>
                      <span
                        className={`adminMember__badge ${isExec ? "adminMember__badge--exec" : "adminMember__badge--member"}`}
                      >
                        {positionLabel(m.position)}
                      </span>
                    </td>
                    <td>
                      <div className="adminMember__manageCol">
                        <div className="adminMember__roleChange">
                          <span className="adminMember__roleLabel">직책</span>
                          <select
                            className="adminMember__select"
                            value={selectValueForMember(m)}
                            disabled={disabled}
                            onChange={(e) =>
                              handleRoleSelectChange(m, e.target.value)
                            }
                            aria-label={`${m.username ?? ""} 직책 선택`}
                          >
                            <option
                              value="댄서"
                              disabled={Boolean(isSelf && isExec)}
                            >
                              일반(댄서)
                            </option>
                            <option value="임원진">임원진</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          className="adminMember__btn adminMember__btn--danger"
                          disabled={disabled || isSelf}
                          title={
                            isSelf ? "본인 계정은 삭제할 수 없습니다" : undefined
                          }
                          onClick={() =>
                            removeMember(m._id, m.username || m.email || "해당")
                          }
                        >
                          탈퇴 처리
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {detailMember
        ? createPortal(
            <div
              className="adminMember__detailBackdrop"
              role="presentation"
              onClick={() => setDetailMember(null)}
            >
              <div
                className="adminMember__detailPanel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-member-detail-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="adminMember__detailHead">
                  <h2
                    id="admin-member-detail-title"
                    className="adminMember__detailTitle"
                  >
                    회원 상세
                  </h2>
                  <button
                    type="button"
                    className="adminMember__detailClose"
                    onClick={() => setDetailMember(null)}
                    aria-label="닫기"
                  >
                    ×
                  </button>
                </div>
                <dl className="adminMember__detailDl">
                  <div className="adminMember__detailRow">
                    <dt>이름</dt>
                    <dd>{detailMember.username ?? "—"}</dd>
                  </div>
                  <div className="adminMember__detailRow">
                    <dt>아이디</dt>
                    <dd>{detailMember.Identification ?? "—"}</dd>
                  </div>
                  <div className="adminMember__detailRow">
                    <dt>이메일</dt>
                    <dd>{detailMember.email ?? "—"}</dd>
                  </div>
                  <div className="adminMember__detailRow">
                    <dt>직책</dt>
                    <dd>{positionLabel(detailMember.position)}</dd>
                  </div>
                  <div className="adminMember__detailRow">
                    <dt>가입 일시</dt>
                    <dd>
                      {formatDateTimeKo(memberJoinedDate(detailMember))}
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="adminMember__btn adminMember__detailOk"
                  onClick={() => setDetailMember(null)}
                >
                  확인
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

export default AdminMember;
