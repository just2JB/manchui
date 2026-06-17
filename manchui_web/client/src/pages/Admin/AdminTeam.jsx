import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import apiClient, { serverUrl } from "../../api/apiClient";
import { authRequestConfig } from "../../api/tokenStorage";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { IoInformationCircleOutline } from "react-icons/io5";
import "./AdminTeam.css";

const authConfig = authRequestConfig;

const formatDateTimeKo = (raw) => {
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const teamMatchesQuery = (team, rawQuery) => {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  const hay = [
    team.name,
    team.leaderName,
    team.comment,
    team.lastPracticeDate,
    team.lastRequestScheduleDate,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
};

const AdminTeam = () => {
  const manchuiModal = useManchuiModal();
  const [tab, setTab] = useState("active");
  const [activeTeams, setActiveTeams] = useState([]);
  const [inactiveTeams, setInactiveTeams] = useState([]);
  const [counts, setCounts] = useState({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailTeamId, setDetailTeamId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailTeam, setDetailTeam] = useState(null);
  const [detailPractices, setDetailPractices] = useState([]);
  const [deleteNameInput, setDeleteNameInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (!serverUrl) {
      setLoading(false);
      setError("서버 URL이 설정되지 않았습니다.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiClient.get("/api/team/admin/list", authConfig());
      setActiveTeams(Array.isArray(res.data?.activeTeams) ? res.data.activeTeams : []);
      setInactiveTeams(
        Array.isArray(res.data?.inactiveTeams) ? res.data.inactiveTeams : [],
      );
      setCounts({
        totalCount: res.data?.totalCount ?? 0,
        activeCount: res.data?.activeCount ?? 0,
        inactiveCount: res.data?.inactiveCount ?? 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || "팀 목록을 불러오지 못했습니다.");
      setActiveTeams([]);
      setInactiveTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTeams();
  }, [fetchTeams]);

  const currentTeams = tab === "active" ? activeTeams : inactiveTeams;

  const filteredTeams = useMemo(
    () => currentTeams.filter((team) => teamMatchesQuery(team, searchQuery)),
    [currentTeams, searchQuery],
  );

  const loadDetail = useCallback(async (teamId) => {
    if (!teamId) return;
    setDetailLoading(true);
    setDetailError("");
    setDetailTeam(null);
    setDetailPractices([]);
    setDeleteNameInput("");
    try {
      const [teamRes, practiceRes] = await Promise.all([
        apiClient.get(`/api/team/admin/${teamId}`, authConfig()),
        apiClient.get(`/api/team/admin/${teamId}/practices`, authConfig()),
      ]);
      setDetailTeam(teamRes.data?.team ?? null);
      setDetailPractices(
        Array.isArray(practiceRes.data?.practices)
          ? practiceRes.data.practices
          : [],
      );
    } catch (err) {
      setDetailError(
        err.response?.data?.message || "팀 정보를 불러오지 못했습니다.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openDetail = (teamId) => {
    setDetailTeamId(teamId);
    void loadDetail(teamId);
  };

  const closeDetail = () => {
    setDetailTeamId(null);
    setDetailTeam(null);
    setDetailPractices([]);
    setDetailError("");
    setDeleteNameInput("");
  };

  useEffect(() => {
    if (!detailTeamId) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailTeamId]);

  const handleDeleteTeam = async () => {
    if (!detailTeam || deleting) return;
    const teamName = String(detailTeam.name ?? "").trim();
    if (deleteNameInput.trim() !== teamName) {
      await manchuiModal("팀 이름을 정확히 입력해 주세요.");
      return;
    }
    if (
      !(await manchuiModal(
        `"${teamName}" 팀과 모든 연습을 삭제합니다. 계속할까요?`,
        "confirm",
      ))
    ) {
      return;
    }

    setDeleting(true);
    try {
      await apiClient.delete(`/api/team/admin/${detailTeam._id}`, {
        ...authConfig(),
        data: { confirmName: deleteNameInput.trim() },
      });
      await manchuiModal("팀이 삭제되었습니다.");
      closeDetail();
      await fetchTeams();
    } catch (err) {
      await manchuiModal(
        err.response?.data?.message || "팀 삭제에 실패했습니다.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const deleteNameMatches =
    detailTeam &&
    deleteNameInput.trim() === String(detailTeam.name ?? "").trim();

  return (
    <div className="adminTeam">
      <div className="adminTeam__header">
        <div>
          <h1 className="adminTeam__title">팀 관리</h1>
          <p className="adminTeam__lead">
            활성 팀: 최근 1개월 내 연습·취합 일정이 있거나 생성된 지 1개월이
            지나지 않은 팀
          </p>
        </div>
        <button
          type="button"
          className="adminTeam__refresh"
          onClick={() => void fetchTeams()}
          disabled={loading}
        >
          새로고침
        </button>
      </div>

      <div className="adminTeam__tabs" role="tablist" aria-label="팀 분류">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "active"}
          className={[
            "adminTeam__tab",
            tab === "active" ? "adminTeam__tab--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => setTab("active")}
        >
          활성 팀 ({counts.activeCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "inactive"}
          className={[
            "adminTeam__tab",
            tab === "inactive" ? "adminTeam__tab--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => setTab("inactive")}
        >
          비활성 팀 ({counts.inactiveCount})
        </button>
      </div>

      <div className="adminTeam__toolbar">
        <p className="adminTeam__count">
          전체 {counts.totalCount}팀 · 표시 {filteredTeams.length}팀
        </p>
        <label className="adminTeam__searchLabel">
          <span className="adminTeam__searchLabelText">검색</span>
          <input
            type="search"
            className="adminTeam__search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="팀 이름, 곡장, 코멘트…"
          />
        </label>
      </div>

      {error ? <p className="adminTeam__error">{error}</p> : null}

      {loading ? (
        <p className="adminTeam__status">불러오는 중…</p>
      ) : filteredTeams.length === 0 ? (
        <p className="adminTeam__status">
          {tab === "active"
            ? "활성 팀이 없습니다."
            : "비활성 팀이 없습니다."}
        </p>
      ) : (
        <div className="adminTeam__tableWrap">
          <table className="adminTeam__table">
            <thead>
              <tr>
                <th>팀 이름</th>
                <th>곡장</th>
                <th>멤버</th>
                <th>연습</th>
                <th>취합</th>
                <th>생성일</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => (
                <tr key={team._id}>
                  <td>
                    <span
                      className="adminTeam__nameSwatch"
                      style={{ background: team.teamColor || "#888" }}
                      aria-hidden
                    />
                    {team.name}
                  </td>
                  <td>{team.leaderName}</td>
                  <td>{team.memberCount}명</td>
                  <td>{team.practiceCount}</td>
                  <td>{team.requestScheduleCount}</td>
                  <td>{formatDateTimeKo(team.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="adminTeam__detailBtn"
                      onClick={() => openDetail(team._id)}
                      aria-label={`${team.name} 상세`}
                    >
                      <IoInformationCircleOutline aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailTeamId
        ? createPortal(
            <div
              className="adminTeam__overlay"
              role="presentation"
              onClick={closeDetail}
            >
              <div
                className="adminTeam__modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-team-detail-title"
                onClick={(event) => event.stopPropagation()}
              >
                {detailLoading ? (
                  <p className="adminTeam__status">상세 정보 불러오는 중…</p>
                ) : detailError ? (
                  <p className="adminTeam__error">{detailError}</p>
                ) : detailTeam ? (
                  <>
                    <div className="adminTeam__modalHead">
                      <div>
                        <h2
                          id="admin-team-detail-title"
                          className="adminTeam__modalTitle"
                        >
                          {detailTeam.name}
                        </h2>
                        <p className="adminTeam__modalMeta">
                          곡장{" "}
                          {detailTeam.leader?.username ||
                            detailTeam.leader?.Identification ||
                            "—"}{" "}
                          · 멤버 {detailTeam.members?.length ?? 0}명 · 생성{" "}
                          {formatDateTimeKo(detailTeam.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="adminTeam__modalClose"
                        onClick={closeDetail}
                      >
                        닫기
                      </button>
                    </div>

                    <section className="adminTeam__section">
                      <h3 className="adminTeam__sectionTitle">팀 정보</h3>
                      <dl className="adminTeam__infoList">
                        <div>
                          <dt>소개</dt>
                          <dd>{detailTeam.comment || "—"}</dd>
                        </div>
                        <div>
                          <dt>팀 색</dt>
                          <dd>
                            <span
                              className="adminTeam__colorChip"
                              style={{
                                background: detailTeam.teamColor || "#888",
                              }}
                            />
                            {detailTeam.teamColor || "—"}
                          </dd>
                        </div>
                        <div>
                          <dt>멤버</dt>
                          <dd>
                            <ul className="adminTeam__memberList">
                              {(detailTeam.members ?? []).map((member) => (
                                <li key={member._id}>
                                  {member.username || member.Identification || "—"}
                                  {String(member._id) ===
                                  String(detailTeam.leaderId) ? (
                                    <span className="adminTeam__leaderBadge">
                                      곡장
                                    </span>
                                  ) : null}
                                  {(detailTeam.coLeaderIds ?? [])
                                    .map(String)
                                    .includes(String(member._id)) ? (
                                    <span className="adminTeam__leaderBadge adminTeam__leaderBadge--co">
                                      부곡장
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                        <div>
                          <dt>취합 요청일</dt>
                          <dd>
                            {(detailTeam.requestSchedules ?? []).length > 0
                              ? detailTeam.requestSchedules.join(", ")
                              : "—"}
                          </dd>
                        </div>
                      </dl>
                    </section>

                    <section className="adminTeam__section">
                      <h3 className="adminTeam__sectionTitle">
                        연습 ({detailPractices.length})
                      </h3>
                      {detailPractices.length === 0 ? (
                        <p className="adminTeam__empty">등록된 연습이 없습니다.</p>
                      ) : (
                        <ul className="adminTeam__practiceList">
                          {detailPractices.map((practice) => (
                            <li
                              key={practice._id}
                              className="adminTeam__practiceItem"
                            >
                              <span className="adminTeam__practiceDate">
                                {practice.date}
                              </span>
                              <span className="adminTeam__practiceTime">
                                {practice.time}
                              </span>
                              <span className="adminTeam__practicePlace">
                                {practice.place || "미확정"}
                              </span>
                              <span className="adminTeam__practiceMembers">
                                참여 {Array.isArray(practice.members)
                                  ? practice.members.length
                                  : 0}
                                명
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    <section className="adminTeam__section adminTeam__section--danger">
                      <h3 className="adminTeam__sectionTitle">팀 삭제</h3>
                      <p className="adminTeam__dangerHint">
                        삭제하려면 아래에 팀 이름{" "}
                        <strong>{detailTeam.name}</strong>을(를) 입력하세요.
                        팀의 모든 연습도 함께 삭제됩니다.
                      </p>
                      <label className="adminTeam__deleteLabel">
                        <span className="adminTeam__deleteLabelText">
                          팀 이름 확인
                        </span>
                        <input
                          type="text"
                          className="adminTeam__deleteInput"
                          value={deleteNameInput}
                          onChange={(event) =>
                            setDeleteNameInput(event.target.value)
                          }
                          placeholder={detailTeam.name}
                          autoComplete="off"
                        />
                      </label>
                      <button
                        type="button"
                        className="adminTeam__deleteBtn"
                        disabled={!deleteNameMatches || deleting}
                        onClick={() => void handleDeleteTeam()}
                      >
                        {deleting ? "삭제 중…" : "팀 삭제"}
                      </button>
                    </section>
                  </>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

export default AdminTeam;
