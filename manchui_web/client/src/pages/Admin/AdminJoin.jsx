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

/** 전화번호가 있는지 (phone 또는 레거시 contact가 숫자로 시작하면 전화번호로 간주) */
const hasPhone = (d) => {
  const p = (d.phone || d.contact || "").trim();
  if (!p) return false;
  return /^0\d/.test(p.replace(/\D/g, ""));
};

/** 010- 형식으로 깔끔하게 (구글 주소록이 +82 대신 이걸 휴대폰 번호로 잘 인식) */
const toDomesticPhone = (phone) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 0) return phone || "";
  if (digits[0] !== "0" || digits.length < 9) return phone || "";
  if (digits.startsWith("010")) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.match(/^0[3-9]\d/)) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length <= 10)
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  return phone || "";
};

/**
 * 구글 주소록 가져오기용 CSV. 헤더는 'Mobile' 하나로 줄여서 구글이 휴대폰 번호로 인식하게 함. 010- 형식 사용.
 */
const buildPhoneContactsCsv = (list, generation) => {
  const BOM = "\uFEFF";
  const headers = ["Name", "Given Name", "Family Name", "Mobile", "Notes"];
  const genLabel = `${generation ?? ""}기 가두모집`;
  const rows = list
    .filter(hasPhone)
    .map((d) => {
      const rawName = (d.name || "").trim();
      const name = rawName ? `${rawName} (${genLabel})` : genLabel;
      const phone = d.phone || d.contact || "";
      const givenName = rawName.length > 1 ? rawName.slice(1) : "";
      const familyName = rawName.length > 0 ? rawName.slice(0, 1) : "";
      const notes = `만취 ${d.generation ?? generation ?? ""}기 / 학번: ${d.studentId ?? ""} / ${d.major ?? ""}`;
      return [
        escapeCsvField(name),
        escapeCsvField(givenName),
        escapeCsvField(familyName),
        escapeCsvField(toDomesticPhone(phone)),
        escapeCsvField(notes),
      ].join(",");
    });
  return BOM + [headers.join(","), ...rows].join("\r\n");
};

/** 카카오ID 연락처 CSV - 카카오ID 있는 사람만 (이름, 카카오ID, 학번, 전공 등) */
const buildKakaoIdCsv = (list, generation) => {
  const BOM = "\uFEFF";
  const headers = ["이름", "카카오ID", "학번", "전공", "비고"];
  const genLabel = `${generation ?? ""}기 가두모집`;
  const rows = list
    .filter((d) => (d.kakaoId || "").trim())
    .map((d) => {
      const rawName = (d.name || "").trim();
      const name = rawName ? `${rawName} (${genLabel})` : genLabel;
      const kakaoId = (d.kakaoId || "").trim();
      const notes = `만취 ${d.generation ?? generation ?? ""}기`;
      return [
        escapeCsvField(name),
        escapeCsvField(kakaoId),
        escapeCsvField(String(d.studentId ?? "")),
        escapeCsvField(d.major ?? ""),
        escapeCsvField(notes),
      ].join(",");
    });
  return BOM + [headers.join(","), ...rows].join("\r\n");
};

const downloadCsv = (content, filename) => {
  if (!content || content.length < 10) return;
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
};

const AdminJoin = () => {
  const { user } = useOutletContext();
  const manchuiModal = useManchuiModal();
  const [joinData, setJoinData] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(1);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactFilter, setContactFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const handleExportPhoneCsv = () => {
    const withPhone = sortedList.filter(hasPhone);
    if (!withPhone.length) {
      manchuiModal("전화번호가 있는 신청자가 없습니다.");
      return;
    }
    const csv = buildPhoneContactsCsv(sortedList, currentGeneration);
    const filename = `${currentGeneration}기 가두모집_만취_${currentGeneration}기_전화번호_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(csv, filename);
    manchuiModal(
      `전화번호 연락처 ${withPhone.length}명이 CSV로 저장되었습니다. 구글 주소록에서 '가져오기'로 불러와 연동할 수 있습니다.`,
    );
  };

  const handleExportKakaoIdCsv = () => {
    const listWithKakao = sortedList.filter((d) => (d.kakaoId || "").trim());
    if (!listWithKakao.length) {
      manchuiModal("카카오ID가 있는 신청자가 없습니다.");
      return;
    }
    const csv =
      "\uFEFF" +
      ["이름", "카카오ID", "학번", "전공", "비고"].join(",") +
      "\r\n" +
      listWithKakao
        .map((d) => {
          const genLabel = `${currentGeneration ?? ""}기 가두모집`;
          const rawName = (d.name || "").trim();
          const name = rawName ? `${rawName} (${genLabel})` : genLabel;
          const notes = `만취 ${d.generation ?? currentGeneration ?? ""}기`;
          return [
            escapeCsvField(name),
            escapeCsvField((d.kakaoId || "").trim()),
            escapeCsvField(String(d.studentId ?? "")),
            escapeCsvField(d.major ?? ""),
            escapeCsvField(notes),
          ].join(",");
        })
        .join("\r\n");
    const filename = `${currentGeneration}기_가두모집_카카오ID_${new Date().toISOString().slice(0, 10)}.csv`;
    try {
      downloadCsv(csv, filename);
      manchuiModal(
        `카카오ID 연락처 ${listWithKakao.length}명이 CSV로 저장되었습니다.`,
      );
    } catch (e) {
      manchuiModal("CSV 저장에 실패했습니다.");
    }
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
    let list = baseList;
    if (contactFilter === "kakao") {
      list = list.filter((d) => (d.kakaoId || "").trim());
    } else if (contactFilter === "phone") {
      list = list.filter(hasPhone);
    }
    if (statusFilter !== "all") {
      list = list.filter((d) => (d.status || "신청") === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (d) =>
          (d.name && d.name.toLowerCase().includes(q)) ||
          String(d.studentId || "").includes(q) ||
          (d.phone && d.phone.toLowerCase().includes(q)) ||
          (d.kakaoId && d.kakaoId.toLowerCase().includes(q)) ||
          (d.contact && d.contact.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [baseList, searchQuery, contactFilter, statusFilter]);

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
              onClick={handleExportPhoneCsv}
              disabled={!sortedList.filter(hasPhone).length}
              title="전화번호가 있는 신청만 구글 주소록 가져오기용 CSV로 저장 (010- 형식, Mobile 열)"
            >
              전화번호 CSV (구글 주소록)
            </button>
            <button
              type="button"
              className="configSave"
              onClick={handleExportKakaoIdCsv}
              disabled={!sortedList.filter((d) => (d.kakaoId || "").trim()).length}
              title="카카오ID가 있는 신청만 CSV로 저장"
            >
              카카오ID CSV
            </button>
          </h3>
          <div className="toolbar">
            <select
              className="sortSelect"
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value)}
              title="연락처로 필터"
            >
              <option value="all">연락처: 전체</option>
              <option value="kakao">카카오ID 있음</option>
              <option value="phone">전화번호 있음</option>
            </select>
            <select
              className="sortSelect"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="상태로 필터"
            >
              <option value="all">상태: 전체</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
                placeholder="이름, 학번, 전화번호, 카카오ID 검색"
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
