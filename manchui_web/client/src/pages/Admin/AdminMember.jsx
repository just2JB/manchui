import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import apiClient, { serverUrl } from "../../api/apiClient";
import { authRequestConfig } from "../../api/tokenStorage";
import { useAuth } from "../../context/AuthContext";
import "./adminList.css";
import "./AdminMember.css";
import { useManchuiModal } from "../../hooks/ManchuiModal";


const authConfig = authRequestConfig;

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
  /** all | exec | member */
  const [roleFilter, setRoleFilter] = useState("all");

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

  const roleCounts = {
    all: members.length,
    exec: members.filter((m) => m.position === "임원진").length,
    member: members.filter((m) => m.position !== "임원진").length,
  };
  /** 임원진 먼저, 그다음 이름순 */
  const shownMembers = filteredMembers
    .filter((m) => {
      if (roleFilter === "exec") return m.position === "임원진";
      if (roleFilter === "member") return m.position !== "임원진";
      return true;
    })
    .sort(
      (a, b) =>
        (b.position === "임원진") - (a.position === "임원진") ||
        String(a.username ?? "").localeCompare(String(b.username ?? ""), "ko"),
    );

  return (
    <div className="adminMember">
      <h1 className="admin-page-heading">부원 관리</h1>

      <div className="aList">
        <div className="aList__tabs" role="tablist" aria-label="직책으로 보기">
          {[
            ["all", "전체"],
            ["exec", "임원진"],
            ["member", "일반"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={roleFilter === value}
              className="aList__tab"
              onClick={() => setRoleFilter(value)}
            >
              {label}
              <span>{roleCounts[value]}</span>
            </button>
          ))}
        </div>

        <div className="aList__tools">
          <input
            id="admin-member-search"
            type="search"
            className="aList__search"
            placeholder="이름, 아이디, 이메일, 직책"
            aria-label="회원 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          <button
            type="button"
            className="aList__ghost"
            onClick={() => {
              setLoading(true);
              fetchMembers();
            }}
            disabled={!serverUrl || loading}
          >
            새로고침
          </button>
        </div>

        {error ? <p className="aList__error">{error}</p> : null}

        {loading ? (
          <p className="aList__empty" aria-live="polite">
            불러오는 중…
          </p>
        ) : !error && shownMembers.length === 0 ? (
          <p className="aList__empty">
            {members.length === 0 ? "등록된 회원이 없어요." : "조건에 맞는 회원이 없어요."}
          </p>
        ) : !error ? (
          <div className="aList__table adminMember__table" role="table" aria-label="회원 목록">
            <div className="aList__row aList__row--head" role="row">
              <span role="columnheader">이름</span>
              <span role="columnheader">아이디</span>
              <span role="columnheader">이메일</span>
              <span role="columnheader">직책</span>
              <span role="columnheader" aria-label="관리" />
            </div>
            {shownMembers.map((m) => {
              const isSelf = adminUser?._id && String(m._id) === String(adminUser._id);
              const isExec = m.position === "임원진";
              const disabled = busyId === m._id;
              return (
                <div key={m._id} role="row" className="aList__row">
                  <span role="cell" className="aList__ellipsis aList__strong">
                    {m.username ?? "—"}
                    {isSelf ? <span className="aList__tag">나</span> : null}
                  </span>
                  <span role="cell" className="aList__ellipsis aList__muted">
                    {m.Identification ?? "—"}
                  </span>
                  <span role="cell" className="aList__ellipsis aList__muted adminMember__email">
                    {m.email ?? "—"}
                  </span>
                  <span role="cell">
                    <span className="aSegment" role="radiogroup" aria-label={`${m.username ?? ""} 직책`}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={!isExec}
                        disabled={disabled || Boolean(isSelf && isExec)}
                        title={isSelf && isExec ? "본인을 일반으로 바꿀 수 없어요" : undefined}
                        onClick={() => handleRoleSelectChange(m, "댄서")}
                      >
                        일반
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isExec}
                        disabled={disabled}
                        onClick={() => handleRoleSelectChange(m, "임원진")}
                      >
                        임원진
                      </button>
                    </span>
                  </span>
                  <span role="cell" className="aList__actions">
                    <button type="button" className="aList__btn" onClick={() => setDetailMember(m)}>
                      상세
                    </button>
                    <button
                      type="button"
                      className="aList__btn aList__btn--danger"
                      disabled={disabled || isSelf}
                      title={isSelf ? "본인 계정은 삭제할 수 없어요" : undefined}
                      onClick={() => removeMember(m._id, m.username || m.email || "해당")}
                    >
                      탈퇴
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

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
