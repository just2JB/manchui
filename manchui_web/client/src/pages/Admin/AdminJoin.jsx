import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import axios from "axios";
import "./AdminJoin.css";
import { useManchuiModal } from "../../hooks/ManchuiModal";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const STATUS_OPTIONS = ["신청", "입금확인", "톡방초대완료"];
const SORT_OPTIONS = [
  { value: "applyAt", label: "신청일" },
  { value: "name", label: "이름" },
  { value: "status", label: "상태" },
];

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminJoin = () => {
  const { user } = useOutletContext();
  const manchuiModal = useManchuiModal();
  const [joinData, setJoinData] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(1);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("applyAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [detailData, setDetailData] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchConfig = async () => {
    if (!serverUrl) return;
    try {
      const res = await axios.get(`${serverUrl}/api/join/config`);
      setFormOpen(Boolean(res.data.formOpen));
      setCurrentGeneration(Number(res.data.currentGeneration) || 1);
    } catch {
      // 설정 로드 실패해도 페이지는 표시
    }
  };

  const fetchJoin = async () => {
    if (!user?._id || !serverUrl) return;
    try {
      const res = await axios.get(`${serverUrl}/api/join/${user._id}`, {
        withCredentials: true,
      });
      setJoinData(Array.isArray(res.data.joinData) ? res.data.joinData : []);
    } catch (err) {
      manchuiModal(err.response?.data?.message || "목록을 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (user?._id) fetchJoin();
  }, [user?._id]);

  const handleSaveConfig = async () => {
    if (!serverUrl || !user?._id) return;
    setSaving(true);
    try {
      await axios.put(`${serverUrl}/api/join/config`, {
        userId: user._id,
        formOpen,
        currentGeneration: Number(currentGeneration) || 1,
      });
      manchuiModal("설정이 저장되었습니다.");
      fetchConfig();
    } catch (err) {
      manchuiModal(err.response?.data?.message || "설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 신청을 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${serverUrl}/api/join/${id}`);
      manchuiModal("삭제되었습니다.");
      setDetailData(null);
      fetchJoin();
    } catch (err) {
      manchuiModal(err.response?.data?.message || "삭제에 실패했습니다.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!serverUrl || !user?._id) return;
    setUpdatingId(id);
    try {
      const res = await axios.patch(
        `${serverUrl}/api/join/${id}`,
        { userId: user._id, status: newStatus },
        { withCredentials: true }
      );
      setJoinData((prev) =>
        prev.map((d) => (d._id === id ? { ...d, status: res.data.join.status } : d))
      );
      if (detailData?._id === id) {
        setDetailData((prev) => (prev ? { ...prev, status: res.data.join.status } : null));
      }
      manchuiModal("상태가 변경되었습니다.");
    } catch (err) {
      manchuiModal(err.response?.data?.message || "상태 변경에 실패했습니다.");
    } finally {
      setUpdatingId(null);
    }
  };

  const baseList = useMemo(
    () =>
      joinData.filter(
        (d) =>
          d.generation === currentGeneration ||
          (d.generation == null && currentGeneration === 1)
      ),
    [joinData, currentGeneration]
  );

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return baseList;
    const q = searchQuery.trim().toLowerCase();
    return baseList.filter(
      (d) =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        String(d.studentId || "").includes(q) ||
        (d.contact && d.contact.toLowerCase().includes(q))
    );
  }, [baseList, searchQuery]);

  const sortedList = useMemo(() => {
    const list = [...filteredList];
    const a = sortOrder === "asc" ? 1 : -1;
    list.sort((x, y) => {
      let vx = x[sortBy];
      let vy = y[sortBy];
      if (sortBy === "applyAt") {
        vx = new Date(vx || 0).getTime();
        vy = new Date(vy || 0).getTime();
        return a * (vx - vy);
      }
      if (sortBy === "status") {
        const ix = STATUS_OPTIONS.indexOf(vx || "신청");
        const iy = STATUS_OPTIONS.indexOf(vy || "신청");
        return a * (ix - iy);
      }
      vx = String(vx ?? "").localeCompare(vy ?? "", "ko");
      return a * vx;
    });
    return list;
  }, [filteredList, sortBy, sortOrder]);

  return (
    <div className="adminJoin">
      <div className="topMenu">
        <div className="menu">
          <Link to="../">돌아가기</Link>
          <div className="title">가입 신청 관리</div>
        </div>
      </div>

      <div className="adminJoinConfig">
        <h3 className="configTitle">가입 폼 설정</h3>
        <div className="configRow">
          <span className="configLabel">가입 신청 폼</span>
          <button
            type="button"
            className={`configToggle ${formOpen ? "on" : "off"}`}
            onClick={() => setFormOpen((p) => !p)}
          >
            {formOpen ? "열림" : "닫힘"}
          </button>
        </div>
        <div className="configRow">
          <span className="configLabel">모집 기수</span>
          <input
            type="number"
            min={1}
            value={currentGeneration}
            onChange={(e) => setCurrentGeneration(Number(e.target.value) || 1)}
          />
          <span className="configUnit">기</span>
        </div>
        <button
          type="button"
          className="configSave"
          onClick={handleSaveConfig}
          disabled={saving}
        >
          {saving ? "저장 중…" : "설정 저장"}
        </button>
      </div>

      <div className="joinSection">
        <div className="sectionHeader">
          <h3 className="sectionTitle">
            {currentGeneration}기 신청 목록 ({sortedList.length}명)
          </h3>
          <div className="toolbar">
            <select
              className="sortSelect"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="sortOrderBtn"
              onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
            >
              {sortOrder === "asc" ? "↑ 오름차순" : "↓ 내림차순"}
            </button>
            <div className="searchBox">
              <input
                type="text"
                placeholder="이름, 학번, 연락처 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="joinDatas">
          {sortedList.map((data) => (
            <div
              key={data._id}
              className={`data ${detailData?._id === data._id ? "selected" : ""}`}
            >
              <span className="dataName">{data.name}</span>
              <span className="dataInfo">
                {data.college} · {data.major} · {data.studentId}
              </span>
              <span className={`dataStatus status-${(data.status || "신청").replace(/ /g, "")}`}>
                {data.status || "신청"}
              </span>
              <select
                className="dataStatusSelect"
                value={data.status || "신청"}
                onChange={(e) => handleStatusChange(data._id, e.target.value)}
                disabled={updatingId === data._id}
                onClick={(e) => e.stopPropagation()}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="dataDetail"
                onClick={() => setDetailData(detailData?._id === data._id ? null : data)}
              >
                상세
              </button>
              <button
                type="button"
                className="dataDelete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(data._id);
                }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>

      {detailData && (
        <div
          className="detailOverlay"
          onClick={() => setDetailData(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setDetailData(null)}
          aria-label="닫기"
        >
          <div className="detailModal" onClick={(e) => e.stopPropagation()}>
            <div className="detailHeader">
              <h3>신청 상세</h3>
              <button
                type="button"
                className="detailClose"
                onClick={() => setDetailData(null)}
              >
                ✕
              </button>
            </div>
            <div className="detailBody">
              <div className="detailRow">
                <span className="detailLabel">이름</span>
                <span>{detailData.name}</span>
              </div>
              <div className="detailRow">
                <span className="detailLabel">학번</span>
                <span>{detailData.studentId}</span>
              </div>
              <div className="detailRow">
                <span className="detailLabel">학적상태</span>
                <span>{detailData.academicState}</span>
              </div>
              <div className="detailRow">
                <span className="detailLabel">학년</span>
                <span>{detailData.grade}</span>
              </div>
              <div className="detailRow">
                <span className="detailLabel">단과대학</span>
                <span>{detailData.college}</span>
              </div>
              <div className="detailRow">
                <span className="detailLabel">전공</span>
                <span>{detailData.major}</span>
              </div>
              <div className="detailRow">
                <span className="detailLabel">연락처</span>
                <span>{detailData.contact}</span>
              </div>
              <div className="detailRow">
                <span className="detailLabel">상태</span>
                <select
                  value={detailData.status || "신청"}
                  onChange={(e) =>
                    handleStatusChange(detailData._id, e.target.value)
                  }
                  disabled={updatingId === detailData._id}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="detailRow">
                <span className="detailLabel">신청일</span>
                <span>{formatDate(detailData.applyAt)}</span>
              </div>
              {detailData.wish && (
                <div className="detailRow detailRowFull">
                  <span className="detailLabel">하고 싶은 활동</span>
                  <p className="detailWish">{detailData.wish}</p>
                </div>
              )}
            </div>
            <div className="detailFooter">
              <button
                type="button"
                className="detailDelete"
                onClick={() => {
                  if (window.confirm("이 신청을 삭제하시겠습니까?")) {
                    handleDelete(detailData._id);
                    setDetailData(null);
                  }
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJoin;
