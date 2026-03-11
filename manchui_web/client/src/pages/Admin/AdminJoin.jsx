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

/** CSV 필드 이스케이프 (쉼표·줄바꿈·따옴표 포함 시 따옴표로 감싸기) */
const escapeCsvField = (val) => {
  const s = String(val ?? "");
  if (
    s.includes(",") ||
    s.includes('"') ||
    s.includes("\n") ||
    s.includes("\r")
  ) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

/** 전화번호 형식 여부 (숫자만 10~11자리, 01x로 시작) */
const isValidPhone = (contact) => {
  if (!contact || typeof contact !== "string") return false;
  const digits = contact.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return false;
  return /^01[0-9]/.test(digits);
};

/**
 * 구글 연락처 내보내기와 동일한 CSV 구조 (컬럼 순서·이름 일치해야 가져오기 시 전화번호 필드에 매핑됨)
 * @see https://support.google.com/contacts/answer/7199294
 */
const buildContactsCsv = (list, generation) => {
  const BOM = "\uFEFF";
  const headers = [
    "Name",
    "Given Name",
    "Additional Name",
    "Family Name",
    "Yomi Name",
    "Given Name Yomi",
    "Additional Name Yomi",
    "Family Name Yomi",
    "Name Prefix",
    "Name Suffix",
    "Initials",
    "Nickname",
    "Short Name",
    "Maiden Name",
    "Birthday",
    "Gender",
    "Location",
    "Billing Information",
    "Directory Server",
    "Mileage",
    "Occupation",
    "Hobby",
    "Sensitivity",
    "Priority",
    "Subject",
    "Notes",
    "Group Membership",
    "E-mail 1 - Type",
    "E-mail 1 - Value",
    "E-mail 2 - Type",
    "E-mail 2 - Value",
    "Phone 1 - Type",
    "Phone 1 - Value",
  ];
  const genLabel = generation != null ? `${generation}기가두모집` : "";
  const empty = (n) => Array(n).fill("").map(escapeCsvField).join(",");

  const rows = list.map((d) => {
    const rawName = (d.name || "").trim();
    const name = genLabel ? `${genLabel} ${rawName}` : rawName;
    const given = rawName.slice(1) || "";
    const family = rawName.slice(0, 1) || "";
    const contact = normalizePhoneForGoogle(d.contact || "");
    const notes = `만취 ${d.generation ?? generation ?? ""}기 / 학번: ${d.studentId ?? ""} / ${d.major ?? ""}`;
    return [
      escapeCsvField(name),
      escapeCsvField(given),
      "",
      escapeCsvField(family),
      empty(9),
      empty(9),
      escapeCsvField(notes),
      "",
      empty(4),
      "Mobile",
      escapeCsvField(contact),
    ].join(",");
  });

  return BOM + [headers.join(","), ...rows].join("\r\n");
};

/** 구글 연락처용 전화번호 (숫자만 또는 +82 형식) */
const normalizePhoneForGoogle = (contact) => {
  const digits = String(contact || "").replace(/\D/g, "");
  if (digits.length < 10) return contact;
  if (digits.startsWith("01")) {
    const rest = digits.slice(1);
    const formatted = rest.replace(/^(\d{2})(\d{4})(\d{4})$/, "$1-$2-$3");
    return formatted ? "+82 " + formatted : contact;
  }
  return contact;
};

const downloadCsv = (content, filename) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
      manchuiModal(
        err.response?.data?.message || "목록을 불러오지 못했습니다.",
      );
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
    const gen = Number(currentGeneration);
    const roundedGen = gen >= 1 ? Math.round(gen * 2) / 2 : 1;
    try {
      await axios.put(`${serverUrl}/api/join/config`, {
        userId: user._id,
        formOpen,
        currentGeneration: roundedGen,
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
        { withCredentials: true },
      );
      setJoinData((prev) =>
        prev.map((d) =>
          d._id === id ? { ...d, status: res.data.join.status } : d,
        ),
      );
      if (detailData?._id === id) {
        setDetailData((prev) =>
          prev ? { ...prev, status: res.data.join.status } : null,
        );
      }
    } catch (err) {
      manchuiModal(err.response?.data?.message || "상태 변경에 실패했습니다.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportContactsCsv = () => {
    if (!sortedList.length) {
      manchuiModal("내보낼 연락처가 없습니다.");
      return;
    }
    const validPhoneList = sortedList.filter((d) => isValidPhone(d.contact));
    const invalidPhoneList = sortedList.filter((d) => !isValidPhone(d.contact));
    const dateStr = new Date().toISOString().slice(0, 10);

    if (validPhoneList.length > 0) {
      const csv = buildContactsCsv(validPhoneList, currentGeneration);
      downloadCsv(csv, `만취_${currentGeneration}기_연락처_${dateStr}.csv`);
    }
    if (invalidPhoneList.length > 0) {
      const csvInvalid = buildContactsCsv(invalidPhoneList, currentGeneration);
      downloadCsv(
        csvInvalid,
        `만취_${currentGeneration}기_연락처_전화번호형식아님_${dateStr}.csv`,
      );
    }

    let msg = "";
    if (validPhoneList.length > 0) {
      msg += `연락처 ${validPhoneList.length}명이 CSV로 저장되었습니다. 구글 연락처에서 '가져오기'로 불러올 수 있습니다.`;
    }
    if (invalidPhoneList.length > 0) {
      if (msg) msg += "\n\n";
      msg += `전화번호 형식이 아닌 연락처 ${invalidPhoneList.length}명은 별도 CSV 파일로 저장되었습니다.`;
    }
    manchuiModal(msg);
  };

  const baseList = useMemo(
    () =>
      joinData.filter(
        (d) =>
          d.generation === currentGeneration ||
          (d.generation == null && currentGeneration === 1),
      ),
    [joinData, currentGeneration],
  );

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return baseList;
    const q = searchQuery.trim().toLowerCase();
    return baseList.filter(
      (d) =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        String(d.studentId || "").includes(q) ||
        (d.contact && d.contact.toLowerCase().includes(q)),
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
            step={0.5}
            value={currentGeneration}
            onChange={(e) => {
              const v = Number(e.target.value);
              const rounded = v >= 1 ? Math.round(v * 2) / 2 : 1;
              setCurrentGeneration(rounded);
            }}
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
            {currentGeneration}기 신청 목록 ({sortedList.length}명){" "}
            <button
              type="button"
              className="configSave"
              onClick={handleExportContactsCsv}
              disabled={!sortedList.length}
              title="현재 목록을 구글 연락처 가져오기용 CSV로 저장"
            >
              연락처 CSV 내보내기
            </button>
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
              onClick={() =>
                setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
              }
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
              <span
                className={`dataStatus status-${(data.status || "신청").replace(/ /g, "")}`}
              >
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
                onClick={() =>
                  setDetailData(detailData?._id === data._id ? null : data)
                }
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
