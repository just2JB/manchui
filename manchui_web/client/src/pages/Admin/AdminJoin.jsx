import React, { useState, useEffect, useMemo, useRef } from "react";
import "./AdminJoin.css";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import apiClient, { serverUrl } from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useAppSettings } from "../../context/AppSettingsContext";
import { LOADING_TEXT } from "../../constants/loadingText";

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

/** 목록용 짧은 날짜: 11.18 19:00 (전체 일시는 title로) */
const formatShortDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** 시트(구글 시트·엑셀)에 붙여넣기용: 조작(상세·삭제) 없이 정보만 */
const SHEET_HEADERS = ["이름", "학번", "단과대", "전공", "연락처"];
const toSheetCells = (d) => [
  d.name || "",
  d.studentId || "",
  d.college || "",
  d.major || "",
  d.phone || d.kakaoId || d.contact || "",
];
const toTsv = (rows) =>
  rows
    .map((cells) => cells.map((c) => String(c).replace(/[\t\r\n]+/g, " ")).join("\t"))
    .join("\n");

const writeClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
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

/** 카카오ID 있음: kakaoId 필드가 있거나, 레거시 contact가 전화번호 형식이 아닐 때(카카오ID로 입력했을 가능성) */
const hasKakaoId = (d) => {
  if ((d.kakaoId || "").trim()) return true;
  const c = (d.contact || "").trim();
  return c.length >= 2 && !/^0\d/.test(c.replace(/\D/g, ""));
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
  const rows = list.filter(hasPhone).map((d) => {
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
  const { user } = useAuth();
  const { refreshJoinConfig } = useAppSettings();
  const manchuiModal = useManchuiModal();
  const [joinData, setJoinData] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(1);
  /** 서버에 저장된 값 (변경 여부·현재 상태 표시용) */
  const [savedConfig, setSavedConfig] = useState({ formOpen: false, generation: 1 });
  const [configLoading, setConfigLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactFilter, setContactFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("applyAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [detailData, setDetailData] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchConfig = async () => {
    if (!serverUrl) {
      setConfigLoading(false);
      return;
    }
    setConfigLoading(true);
    try {
      const res = await apiClient.get("/api/join/config");
      const open = Boolean(res.data.formOpen);
      const gen = Number(res.data.currentGeneration) || 1;
      setFormOpen(open);
      setCurrentGeneration(gen);
      setSavedConfig({ formOpen: open, generation: gen });
    } catch {
      // 설정 로드 실패해도 페이지는 표시
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchJoin = async () => {
    if (!user?._id || !serverUrl) {
      setListLoading(false);
      return;
    }
    setListLoading(true);
    try {
      const res = await apiClient.get(`/api/join/${user._id}`, {
        withCredentials: true,
      });
      setJoinData(Array.isArray(res.data.joinData) ? res.data.joinData : []);
    } catch (err) {
      manchuiModal(
        err.response?.data?.message || "목록을 불러오지 못했습니다.",
      );
    } finally {
      setListLoading(false);
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
      await apiClient.put("/api/join/config", {
        userId: user._id,
        formOpen,
        currentGeneration: roundedGen,
      });
      manchuiModal("설정이 저장되었습니다.");
      fetchConfig();
      void refreshJoinConfig();
    } catch (err) {
      manchuiModal(err.response?.data?.message || "설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 신청을 삭제하시겠습니까?")) return;
    try {
      await apiClient.delete(`/api/join/${id}`);
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
      const res = await apiClient.patch(
        `/api/join/${id}`,
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
    const listWithKakao = sortedList.filter(hasKakaoId);
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
          const kakaoValue = (d.kakaoId || d.contact || "").trim();
          const notes = `만취 ${d.generation ?? currentGeneration ?? ""}기`;
          return [
            escapeCsvField(name),
            escapeCsvField(kakaoValue),
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
      list = list.filter(hasKakaoId);
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

  /** 복사 알림 */
  const [copyNotice, setCopyNotice] = useState("");
  const copyTimer = useRef(null);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const copyText = async (text, notice) => {
    if (!text) return;
    const ok = await writeClipboard(text);
    clearTimeout(copyTimer.current);
    setCopyNotice(ok ? notice : "복사하지 못했어요");
    copyTimer.current = setTimeout(() => setCopyNotice(""), 1600);
  };
  /** 칸 클릭 = 그 칸 텍스트 복사 (드래그로 고르는 중이면 건너뜀) */
  const copyCell = (text) => {
    if (window.getSelection()?.toString()) return;
    void copyText(text, `복사됨 · ${text}`);
  };
  /** 클릭 복사용 속성 (칸 안의 텍스트 하나 단위) */
  const copyProps = (text) => ({
    role: "button",
    tabIndex: 0,
    className: "joinList__copy",
    title: `클릭해서 복사: ${text}`,
    onClick: () => copyCell(String(text)),
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        copyCell(String(text));
      }
    },
  });
  const copySheet = () => {
    void copyText(
      toTsv([SHEET_HEADERS, ...sortedList.map(toSheetCells)]),
      `${sortedList.length}명 복사됨 · 시트에 붙여넣기`,
    );
  };
  /** 여러 줄·칸을 드래그해서 복사하면 정보 칸만 시트 형태(탭 구분)로 */
  const handleTableCopy = (e) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const cellOf = (n) => (n?.nodeType === 1 ? n : n?.parentElement)?.closest?.("[role=cell]");
    const rowsEl = [...e.currentTarget.querySelectorAll("[data-row-id]")].filter((el) =>
      sel.containsNode(el, true),
    );
    if (rowsEl.length <= 1 && cellOf(sel.anchorNode) === cellOf(sel.focusNode)) return;
    const byId = new Map(sortedList.map((d) => [String(d._id), d]));
    const rows = rowsEl.map((el) => byId.get(el.dataset.rowId)).filter(Boolean).map(toSheetCells);
    const head = e.currentTarget.querySelector(".joinList__row--head");
    if (head && sel.containsNode(head, true)) rows.unshift(SHEET_HEADERS);
    if (!rows.length) return;
    e.preventDefault();
    e.clipboardData.setData("text/plain", toTsv(rows));
    clearTimeout(copyTimer.current);
    setCopyNotice(`${rowsEl.length}줄 복사됨 · 시트 형태`);
    copyTimer.current = setTimeout(() => setCopyNotice(""), 1600);
  };

  return (
    <div className="adminJoin">
      <h1 className="admin-page-heading">가입 신청 관리</h1>

      {/* 가입 폼 상태: 한 줄 (상태 · 열기/닫기 · 모집 기수 · 저장). 모바일은 두 줄 */}
      <section className="joinConfigBar" aria-label="가입 폼 설정">
        {configLoading ? (
          <p className="adminJoin__loading" aria-live="polite">
            {LOADING_TEXT}
          </p>
        ) : (
          <>
            <div className="joinConfigBar__state">
              <span className="joinConfigBar__title">가입 폼</span>
              <span
                className={`joinConfigBar__status${savedConfig.formOpen ? " joinConfigBar__status--on" : ""}`}
              >
                <i aria-hidden="true" />
                {savedConfig.formOpen ? `${savedConfig.generation}기 모집 중` : "모집 닫힘"}
              </span>
            </div>

            <div className="joinConfigBar__controls">
              <div className="joinConfigBar__segment" role="radiogroup" aria-label="신청 폼">
                <button
                  type="button"
                  role="radio"
                  aria-checked={formOpen}
                  onClick={() => setFormOpen(true)}
                >
                  열기
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!formOpen}
                  onClick={() => setFormOpen(false)}
                >
                  닫기
                </button>
              </div>

              <div className="joinConfigBar__stepper" aria-label="모집 기수">
                <button
                  type="button"
                  aria-label="기수 0.5 줄이기"
                  disabled={Number(currentGeneration) <= 1}
                  onClick={() =>
                    setCurrentGeneration((g) => Math.max(1, Math.round((Number(g) - 0.5) * 2) / 2))
                  }
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  inputMode="decimal"
                  aria-label="모집 기수"
                  value={currentGeneration}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    const rounded = v >= 1 ? Math.round(v * 2) / 2 : 1;
                    setCurrentGeneration(rounded);
                  }}
                />
                <button
                  type="button"
                  aria-label="기수 0.5 늘리기"
                  onClick={() =>
                    setCurrentGeneration((g) => Math.round((Number(g) + 0.5) * 2) / 2)
                  }
                >
                  +
                </button>
                <span className="joinConfigBar__unit">기</span>
              </div>

              <button
                type="button"
                className="joinConfigBar__save"
                onClick={handleSaveConfig}
                disabled={
                  saving ||
                  (formOpen === savedConfig.formOpen &&
                    Number(currentGeneration) === savedConfig.generation)
                }
                title={
                  formOpen !== savedConfig.formOpen ||
                  Number(currentGeneration) !== savedConfig.generation
                    ? "저장되지 않은 변경이 있어요"
                    : "변경 사항 없음"
                }
              >
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
          </>
        )}
      </section>

      <div className="joinSection joinList">
        {/* 머리: 제목·인원 + CSV 내보내기 */}
        <div className="joinList__head">
          <h3 className="joinList__title">
            {currentGeneration}기 신청 <span>{baseList.length}명</span>
          </h3>
          <div className="joinList__exports">
            <button
              type="button"
              className="joinList__sheetBtn"
              onClick={copySheet}
              disabled={!sortedList.length}
              title="보이는 목록을 이름·학번·단과대·전공·연락처로 복사 (시트에 바로 붙여넣기)"
            >
              시트로 복사
            </button>
            <button
              type="button"
              onClick={handleExportPhoneCsv}
              disabled={!sortedList.filter(hasPhone).length}
              title="전화번호가 있는 신청만 구글 주소록 가져오기용 CSV로 저장 (010- 형식, Mobile 열)"
            >
              전화번호 CSV
            </button>
            <button
              type="button"
              onClick={handleExportKakaoIdCsv}
              disabled={!sortedList.filter(hasKakaoId).length}
              title="카카오ID가 있는 신청만 CSV로 저장"
            >
              카카오ID CSV
            </button>
          </div>
        </div>

        {/* 상태별 개수 = 상태 필터 */}
        <div className="joinList__tabs" role="tablist" aria-label="상태로 보기">
          {[["all", "전체"], ...STATUS_OPTIONS.map((st) => [st, st])].map(([value, label]) => {
            const count =
              value === "all"
                ? baseList.length
                : baseList.filter((d) => (d.status || "신청") === value).length;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={statusFilter === value}
                className="joinList__tab"
                onClick={() => setStatusFilter(value)}
              >
                {label}
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        {/* 검색 · 연락처 · 정렬 한 줄 */}
        <div className="joinList__tools">
          <input
            type="search"
            className="joinList__search"
            placeholder="이름, 학번, 전화번호, 카카오ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            value={contactFilter}
            onChange={(e) => setContactFilter(e.target.value)}
            title="연락처로 필터"
          >
            <option value="all">연락처 전체</option>
            <option value="kakao">카카오ID 있음</option>
            <option value="phone">전화번호 있음</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} title="정렬 기준">
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}순
              </option>
            ))}
          </select>
          <button
            type="button"
            className="joinList__order"
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
            aria-label={sortOrder === "asc" ? "오름차순" : "내림차순"}
            title={sortOrder === "asc" ? "오름차순" : "내림차순"}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>

        {listLoading ? (
          <p className="adminJoin__loading" aria-live="polite">
            {LOADING_TEXT}
          </p>
        ) : sortedList.length === 0 ? (
          <p className="joinList__empty">조건에 맞는 신청이 없어요.</p>
        ) : (
          <div
            className="joinList__table"
            role="table"
            aria-label="신청 목록"
            onCopy={handleTableCopy}
          >
            <div className="joinList__row joinList__row--head" role="row">
              <span role="columnheader">이름</span>
              <span role="columnheader">학번</span>
              <span role="columnheader">단과대 · 전공</span>
              <span role="columnheader">연락처</span>
              <span role="columnheader">신청일</span>
              <span role="columnheader">상태</span>
              <span role="columnheader" aria-label="관리" />
            </div>
            {sortedList.map((data) => {
              const status = data.status || "신청";
              return (
                <div
                  key={data._id}
                  data-row-id={String(data._id)}
                  role="row"
                  className={`joinList__row${detailData?._id === data._id ? " joinList__row--selected" : ""}`}
                >
                  <span role="cell" className="joinList__name">
                    <span {...copyProps(data.name)}>{data.name}</span>
                  </span>
                  <span role="cell" className="joinList__num">
                    <span {...copyProps(data.studentId)}>{data.studentId}</span>
                  </span>
                  {/* 단과대 · 전공은 따로 눌러 복사 */}
                  <span role="cell" className="joinList__muted">
                    {data.college ? <span {...copyProps(data.college)}>{data.college}</span> : null}
                    {data.college && data.major ? <span aria-hidden> · </span> : null}
                    {data.major ? <span {...copyProps(data.major)}>{data.major}</span> : null}
                  </span>
                  <span role="cell" className="joinList__muted">
                    {data.phone || data.kakaoId || data.contact ? (
                      <span {...copyProps(data.phone || data.kakaoId || data.contact)}>
                        {data.phone || data.kakaoId || data.contact}
                      </span>
                    ) : (
                      "—"
                    )}
                  </span>
                  <span role="cell" className="joinList__num joinList__muted" title={formatDate(data.applyAt)}>
                    {formatShortDate(data.applyAt)}
                  </span>
                  <span role="cell">
                    <select
                      className={`joinList__status status-${status.replace(/ /g, "")}`}
                      value={status}
                      onChange={(e) => handleStatusChange(data._id, e.target.value)}
                      disabled={updatingId === data._id}
                      aria-label={`${data.name} 상태`}
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </span>
                  <span role="cell" className="joinList__actions">
                    <button
                      type="button"
                      onClick={() => setDetailData(detailData?._id === data._id ? null : data)}
                    >
                      상세
                    </button>
                    <button
                      type="button"
                      className="joinList__delete"
                      onClick={() => handleDelete(data._id)}
                    >
                      삭제
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p
        className={`joinList__toast${copyNotice ? " joinList__toast--on" : ""}`}
        role="status"
        aria-live="polite"
      >
        {copyNotice}
      </p>

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
