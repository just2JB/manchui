import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { IoAddOutline, IoCloseOutline } from "react-icons/io5";
import ArchiveCatalog from "./ArchiveCatalog.jsx";
import ArchiveBody from "./ArchiveBody.jsx";
import { noticeTagsOf } from "./archiveNoticeTags.js";
import { readArchiveLocation, archiveSearchParams } from "./archiveNavigation.js";
import { CATEGORIES, PERFORMANCE_GROUPS, UNCLASSIFIED_PERFORMANCE, categoryOf, groupOf, generationKey, generationGroups } from "./archiveCatalogData.js";
import apiClient, { serverUrl } from "../../api/apiClient";
import { authRequestConfig } from "../../api/tokenStorage";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import "./adminList.css";
import "./AdminArchive.css";

/**
 * 아카이브: 행사별로 그때 쓴 공지글을 묶어 보관 → 다음 임원진이 검색해서 참고.
 * 분류 카드 → 같은 행사 → 기수별 기록 → 상세 일정과 내용.
 */

const authConfig = authRequestConfig;
/** 태그는 '공지'만. 나머지(일정·할 일·회의)는 태그 없는 일반 항목. 종류가 비어 있는 예전 항목은 공지 */
const isNoticeKind = (n) => Array.isArray(n?.tags) ? n.tags.includes("공지") : !n?.kind || n.kind === "공지";

/** 행사 카테고리 */
const EMPTY_EVENT = { title: "", category: "공연", eventGroup: "", startDate: "", endDate: "", generation: "", tags: "", summary: "" };

const pad2 = (n) => String(n).padStart(2, "0");
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const keyOf = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
/** 예전 단일 날짜(eventDate)도 기간으로 읽기 */
const startOf = (ev) => ev?.startDate || ev?.eventDate || "";
const endOf = (ev) => ev?.endDate || startOf(ev);
const noticeDate = (n) => n.date || keyOf(n.createdAt);
const dayDiff = (a, b) => {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y1, m1 - 1, d1) - Date.UTC(y2, m2 - 1, d2)) / 86400000);
};
/** 행사 기준 상대 표시: D-21 · D-day · 행사 중 · D+2 */
const relLabel = (date, start, end) => {
  if (!date || !start) return "";
  if (date < start) return `D-${dayDiff(start, date)}`;
  if (date === start) return "D-day";
  if (date <= end) return "행사 중";
  return `D+${dayDiff(date, end)}`;
};

const formatEventDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return `${y}. ${m}. ${day}.`;
};
const formatShort = (d) => {
  if (!d) return "";
  const [, m, day] = d.split("-").map(Number);
  return `${m}. ${day}.`;
};
/** 2026. 8. 22. – 8. 23. (해가 바뀌면 끝도 연도까지) */
const formatPeriod = (start, end) => {
  if (!start) return "";
  if (!end || end === start) return formatEventDate(start);
  return `${formatEventDate(start)} – ${end.slice(0, 4) === start.slice(0, 4) ? formatShort(end) : formatEventDate(end)}`;
};
const formatPeriodShort = (start, end) => {
  if (!start) return "";
  return !end || end === start ? formatShort(start) : `${formatShort(start)}–${formatShort(end)}`;
};
const periodDays = (start, end) => (start && end ? dayDiff(end, start) + 1 : 0);

/** 검색어를 <mark>로 */
const Highlight = ({ text, query }) => {
  const q = query.trim();
  if (!q || !text) return text || null;
  const parts = String(text).split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? <mark key={i}>{part}</mark> : <React.Fragment key={i}>{part}</React.Fragment>,
  );
};

const ArchiveSheet = ({ title, fields, value, onChange, onClose, onSubmit, submitting, submitLabel }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="archiveSheet" role="presentation">
      <button type="button" className="archiveSheet__backdrop" aria-label="닫기" tabIndex={-1} onClick={onClose} />
      <form
        className="archiveSheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="archiveSheet__head">
          <h2 className="archiveSheet__title">{title}</h2>
          <button type="button" className="archiveSheet__close" onClick={onClose} aria-label="닫기">
            <IoCloseOutline aria-hidden />
          </button>
        </div>
        <div className="archiveSheet__body">
          {fields.map((f) => (
            <label key={f.name} className={`archiveSheet__field${f.half ? " archiveSheet__field--half" : ""}`}>
              <span className="archiveSheet__label">{f.label}</span>
              {f.tagOptions ? (
                <span className="archiveTagEditor">
                  {f.tagOptions.map((tag) => <button type="button" key={tag}
                    aria-pressed={(value[f.name] || []).includes(tag)}
                    onClick={() => onChange({ ...value, [f.name]: (value[f.name] || []).includes(tag)
                      ? value[f.name].filter((item) => item !== tag) : [...(value[f.name] || []), tag] })}>{tag}</button>)}
                </span>
              ) : f.checkbox ? (
                <span className="archiveSheet__check">
                  <input
                    type="checkbox"
                    checked={value[f.name] === "공지"}
                    onChange={(e) => onChange({ ...value, [f.name]: e.target.checked ? "공지" : "일정" })}
                  />
                  <span>공지</span>
                </span>
              ) : f.options ? (
                <select
                  className="archiveSheet__input"
                  value={value[f.name]}
                  onChange={(e) => onChange({ ...value, [f.name]: e.target.value })}
                >
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o || "선택해 주세요"}
                    </option>
                  ))}
                </select>
              ) : f.multiline ? (
                <textarea
                  className="archiveSheet__input archiveSheet__input--area"
                  rows={f.rows ?? 4}
                  value={value[f.name]}
                  placeholder={f.placeholder}
                  maxLength={f.maxLength}
                  onChange={(e) => onChange({ ...value, [f.name]: e.target.value })}
                />
              ) : (
                <input
                  className="archiveSheet__input"
                  type={f.type ?? "text"}
                  value={value[f.name]}
                  placeholder={f.placeholder}
                  maxLength={f.maxLength}
                  inputMode={f.inputMode}
                  autoFocus={f.autoFocus}
                  onChange={(e) => onChange({ ...value, [f.name]: e.target.value })}
                />
              )}
            </label>
          ))}
        </div>
        <div className="archiveSheet__foot">
          <button type="button" className="aList__btn" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="aBar__save" disabled={submitting}>
            {submitting ? "저장 중…" : submitLabel}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};

const EVENT_FIELDS = [
  { name: "title", label: "기록 이름", placeholder: "예: 14기 봄 축제", maxLength: 80, autoFocus: true },
  { name: "category", label: "카테고리", options: CATEGORIES, half: true },
  { name: "eventGroup", label: "행사 묶음", placeholder: "예: MT, 개강총회 — 같은 이름끼리 기수별로 모아요", maxLength: 80 },
  { name: "startDate", label: "시작일", type: "date", half: true },
  { name: "endDate", label: "종료일 (하루면 비워 두기)", type: "date", half: true },
  { name: "generation", label: "진행 기수", placeholder: "예: 31", inputMode: "decimal", half: true },
  { name: "tags", label: "태그 (쉼표로 구분)", placeholder: "공연, 대관, 뒤풀이", maxLength: 200 },
  { name: "summary", label: "메모", placeholder: "장소·예산·준비 일정 등 다음 임원진이 알면 좋은 것", multiline: true, rows: 4, maxLength: 2000 },
];
const NOTICE_FIELDS = [
  { name: "title", label: "제목", placeholder: "예: 정기공연 참가 신청 공지", maxLength: 120, autoFocus: true },
  { name: "date", label: "날짜 (타임라인 위치)", type: "date", half: true },
  { name: "endDate", label: "끝 날짜 (기간이면)", type: "date", half: true },
  { name: "body", label: "본문", placeholder: "단톡방·인스타에 올렸던 공지 내용을 그대로 붙여넣기", multiline: true, rows: 12, maxLength: 20000 },
];

/* ---------- 날짜 비례 타임라인 ---------- */
const DAY_MS = 86400000;
const dayNum = (d) => {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, day) / DAY_MS;
};
/** 날짜 간격에 비례해서 배치하고 겹치는 일정은 위 행에 표시. */
const DateTimeline = ({ items, activeKey, onSelect, getTags }) => {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, []);
  const dated = items.filter((it) => it.date);
  const min = Math.min(...dated.map((it) => dayNum(it.date)));
  const max = Math.max(...dated.map((it) => dayNum(it.notice.endDate || it.date)));
  const span = Math.max(1, max - min);
  const scale = Math.max(12, (width - 228) / span);
  const lanes = [];
  const placed = dated.map((it) => {
    const left = (dayNum(it.date) - min) * scale;
    const duration = Math.max(0, dayNum(it.notice.endDate || it.date) - dayNum(it.date)) * scale;
    const occupied = Math.max(180, duration + 90);
    let lane = lanes.findIndex((end) => end + 16 <= left);
    if (lane < 0) lane = lanes.length;
    lanes[lane] = left + occupied;
    return { ...it, left, duration, lane };
  });
  useEffect(() => {
    const wrap = wrapRef.current;
    const selected = wrap?.querySelector('[aria-pressed="true"]');
    if (!selected) return;
    wrap.scrollTo({ left: Math.max(0, selected.parentElement.offsetLeft - width / 3), behavior: 'auto' });
  }, [activeKey, width]);
  return (
    <div className="archiveDates" ref={wrapRef}>
      {placed.length > 0 ? <ol className="archiveDates__canvas" aria-label="날짜별 일정"
        style={{ width: Math.max(width, span * scale + 228), height: lanes.length * 82 + 4 }}>
        <li className="archiveDates__connections" aria-hidden="true">
          <svg width="100%" height="100%">
            <path d={`M 8 ${lanes.length * 82 - 46} H ${span * scale + 106}`} />
            {placed.filter((it) => it.lane > 0).map((it) => {
              const x = it.left + 106;
              const y = (lanes.length - it.lane) * 82 - 46;
              const base = lanes.length * 82 - 46;
              return <path key={it.notice._id}
                d={`M ${x - 98} ${base} V ${y + 10} Q ${x - 98} ${y} ${x - 88} ${y} H ${x}`} />;
            })}
          </svg>
        </li>
        {placed.map((it) => (
          <li key={it.notice._id} className="archiveDates__item"
            style={{ left: it.left + 106, bottom: it.lane * 82 + 4, width: 180 }}>
            <button type="button" className="archiveDates__button"
              aria-pressed={activeKey === String(it.notice._id)} onClick={() => onSelect(String(it.notice._id))}
              title={it.notice.title}>
              <span className="archiveDates__date">{formatPeriodShort(it.date, it.notice.endDate)}
                <span>{getTags(it).includes("행사") || getTags(it).includes("공연") ? "" : it.rel}</span>
              </span>
              <span className="archiveDates__mark" aria-hidden="true">
                {it.duration > 0 ? <span className="archiveDates__duration" style={{ width: it.duration }} /> : null}
                {getTags(it).includes("공연")
                  ? <span className="archiveDates__performance" />
                  : <span className="archiveDates__dot" />}
              </span>
              <span className="archiveDates__title">
                {it.notice.title}
              </span>
              {it.duration > 0 ? <span className="archiveDates__days">{periodDays(it.date, it.notice.endDate)}일간</span> : null}
            </button>
          </li>
        ))}
      </ol> : null}
    </div>
  );
};


const AdminArchive = () => {
  const modal = useManchuiModal();
  const [events, setEvents] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const { category: catFilter, group: groupFilter, generation: genFilter, record: selectedId } = readArchiveLocation(searchParams);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  /** { kind: "event" | "notice", mode: "create" | "edit", noticeId?, value } */
  const [sheet, setSheet] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const detailRequest = useRef(0);
  const listRequest = useRef(0);

  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 1600);
  };

  const loadList = useCallback(async (q) => {
    const request = ++listRequest.current;
    if (!serverUrl) {
      setListLoading(false);
      setError("서버 URL이 설정되지 않았습니다.");
      return;
    }
    setListLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/api/archive", { ...authConfig(), params: q ? { q } : {} });
      if (request !== listRequest.current) return;
      setEvents(Array.isArray(res.data?.events) ? res.data.events : []);
    } catch (e) {
      if (request !== listRequest.current) return;
      setError(e.response?.data?.message || "아카이브를 불러오지 못했습니다.");
      setEvents([]);
    } finally {
      if (request === listRequest.current) setListLoading(false);
    }
  }, []);

  // 검색: 입력 멈추고 0.25초 뒤
  useEffect(() => {
    const id = setTimeout(() => {
      setAppliedQuery(query.trim());
      void loadList(query.trim());
    }, 250);
    return () => clearTimeout(id);
  }, [query, loadList]);

  const loadDetail = useCallback(async (id) => {
    if (!id) return;
    const request = ++detailRequest.current;
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await apiClient.get(`/api/archive/${id}`, authConfig());
      if (request !== detailRequest.current) return;
      setDetail(res.data?.event ?? null);
    } catch (e) {
      if (request !== detailRequest.current) return;
      setDetail(null);
      await modal(e.response?.data?.message || "행사를 불러오지 못했습니다.");
    } finally {
      if (request === detailRequest.current) setDetailLoading(false);
    }
  }, [modal]);

  useEffect(() => {
    setSheet(null);
    if (selectedId) void loadDetail(selectedId);
    else {
      setDetail(null);
      setDetailLoading(false);
    }
    return () => { detailRequest.current += 1; };
  }, [selectedId, loadDetail]);

  // 분류가 바뀐 기록의 이전 주소도 같은 기록의 새 묶음으로 연결한다.
  useEffect(() => {
    if (!detail || String(detail._id) !== selectedId) return;
    const category = categoryOf(detail);
    const group = groupOf(detail);
    const generation = generationKey(detail);
    if (category === catFilter && group === groupFilter && generation === genFilter) return;
    setSearchParams((current) => archiveSearchParams(current, {
      category, group, generation, record: selectedId,
    }), { replace: true, preventScrollReset: true });
  }, [detail, selectedId, catFilter, groupFilter, genFilter, setSearchParams]);

  const changeLocation = (location, replace = false) => {
    const next = archiveSearchParams(searchParams, location);
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace, preventScrollReset: true });
  };

  const selectEvent = (id) => {
    const event = events.find((item) => String(item._id) === id);
    if (!event) return;
    changeLocation({ category: categoryOf(event), group: groupOf(event), generation: generationKey(event), record: id });
  };

  /** 검색 결과에서 고른 공지: 그 행사를 열고 그 항목 본문의 검색어 위치로 이동 */
  const [jump, setJump] = useState(null);
  const openNotice = (event, noticeId) => {
    const id = String(event._id);
    setJump({ eventId: id, noticeId: String(noticeId), q: query.trim() });
    if (selectedId === id && detail && String(detail._id) === id) setActiveKey(String(noticeId));
    else selectEvent(id);
  };

  const navigateCatalog = (category, group) => {
    if (group) {
      const records = events.filter((event) => categoryOf(event) === category && groupOf(event) === group);
      const generations = generationGroups(records);
      const latest = (generations.filter((item) => item.key !== "none").at(-1) || generations[0])?.records[0];
      if (latest) {
        selectEvent(String(latest._id));
        return;
      }
    }
    changeLocation({ category, group });
  };

  /** 저장 후 해당 분류·행사·기수의 상세를 유지한다. */
  const afterSave = (event) => {
    changeLocation({ category: categoryOf(event), group: groupOf(event), generation: generationKey(event), record: String(event._id) }, selectedId === String(event._id));
    setEvents((current) => {
      const item = { ...event, noticeCount: event.notices?.length ?? 0 };
      return current.some((old) => String(old._id) === String(event._id))
        ? current.map((old) => String(old._id) === String(event._id) ? item : old) : [...current, item];
    });
    setDetail(event);
    void loadList(appliedQuery);
  };

  const submitSheet = async () => {
    if (!sheet) return;
    const v = sheet.value;
    if (sheet.kind === "event" && v.category === "공연" && !v.eventGroup?.trim()) {
      await modal("공연 분류를 선택해 주세요.");
      return;
    }
    if (!String(v.title ?? "").trim()) {
      await modal(sheet.kind === "event" ? "행사 이름을 입력해 주세요." : "제목을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      let res;
      if (sheet.kind === "event") {
        const body = {
          title: v.title,
          startDate: v.startDate,
          endDate: v.endDate || v.startDate,
          generation: v.generation === "" ? null : Number(v.generation),
          category: categoryOf(v),
          eventGroup: v.eventGroup?.trim() || "",
          tags: v.tags,
          summary: v.summary,
        };
        res =
          sheet.mode === "create"
            ? await apiClient.post("/api/archive", body, authConfig())
            : await apiClient.patch(`/api/archive/${detail._id}`, body, authConfig());
      } else {
        const body = {
          title: v.title,
          body: v.body,
          date: v.date,
          endDate: v.endDate && v.date && v.endDate > v.date ? v.endDate : "",
          kind: v.kind === "공지" ? "공지" : "일정",
          tags: v.tags || [],
        };
        // 수정할 때 태그를 건드리지 않았으면 보내지 않는다 (태그를 보내면 서버가 날짜 기준 자동 태그를 고정함).
        if (sheet.mode === "edit" && JSON.stringify(sheet.initialTags ?? null) === JSON.stringify(v.tags ?? null)) {
          delete body.tags;
        }
        res =
          sheet.mode === "create"
            ? await apiClient.post(`/api/archive/${detail._id}/notices`, body, authConfig())
            : await apiClient.patch(`/api/archive/${detail._id}/notices/${sheet.noticeId}`, body, authConfig());
      }
      if (sheet.kind === "notice" && sheet.mode === "edit") clearDraft(sheet.noticeId);
      setSheet(null);
      afterSave(res.data.event);
      showToast("저장됨");
    } catch (e) {
      await modal(e.response?.data?.message || "저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEvent = async () => {
    if (!detail) return;
    const n = detail.notices?.length ?? 0;
    if (!(await modal(`「${detail.title}」${n ? `과 공지 ${n}개를` : "을(를)"} 삭제할까요?`, "confirm"))) return;
    try {
      await apiClient.delete(`/api/archive/${detail._id}`, authConfig());
      setDetail(null);
      changeLocation({ category: catFilter, group: groupFilter }, true);
      void loadList(appliedQuery);
    } catch (e) {
      await modal(e.response?.data?.message || "삭제하지 못했습니다.");
    }
  };

  const deleteNotice = async (notice) => {
    if (!(await modal(`공지 「${notice.title}」를 삭제할까요?`, "confirm"))) return;
    try {
      const res = await apiClient.delete(`/api/archive/${detail._id}/notices/${notice._id}`, authConfig());
      afterSave(res.data.event);
    } catch (e) {
      await modal(e.response?.data?.message || "삭제하지 못했습니다.");
    }
  };

  const eventMeta = (ev) => {
    const days = periodDays(startOf(ev), endOf(ev));
    return [
      formatPeriod(startOf(ev), endOf(ev)),
      days > 1 ? `${days}일` : null,
      ev.generation != null ? `${ev.generation}기` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  /**
   * 상세 타임라인: 항목만 날짜순으로. 행사 기간은 따로 그리지 않고(머리에 이미 있음)
   * 각 항목의 D-표시 기준으로만 씀. 날짜 없는 건 맨 뒤.
   */
  const timeline = useMemo(() => {
    if (!detail) return [];
    const start = startOf(detail);
    const end = endOf(detail);
    const items = (detail.notices ?? []).map((n) => ({ kind: "notice", date: noticeDate(n), notice: n }));
    return items
      .map((it, i) => ({ ...it, i }))
      .sort((a, b) => {
        if (!a.date !== !b.date) return a.date ? -1 : 1;
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return a.i - b.i;
      })
      .map((it) => ({ ...it, rel: relLabel(it.date, start, end) }));
  }, [detail]);

  /** 가로 타임라인에서 고른 항목 ("event" 또는 공지 id) */
  const [activeKey, setActiveKey] = useState(null);
  /** '수정하기'로 연 항목 (저장 안 한 초안이 남은 항목도 편집 상태로 연다) */
  const [editingId, setEditingId] = useState(null);
  const [bodyDrafts, setBodyDrafts] = useState({});
  const hasDrafts = Object.keys(bodyDrafts).length > 0;
  useEffect(() => {
    if (!hasDrafts) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasDrafts]);
  const keyOfItem = (it) => (it.kind === "event" ? "event" : String(it.notice._id));
  // 행사가 바뀌면: 검색어에 맞는 항목 → 첫 공지 → 첫 항목 순으로 기본 선택
  useEffect(() => {
    if (!timeline.length) {
      setActiveKey(null);
      return;
    }
    setActiveKey((cur) => {
      // 검색 결과에서 고른 항목이 있으면 그 항목부터
      if (jump && String(jump.eventId) === String(detail?._id) && timeline.some((it) => keyOfItem(it) === String(jump.noticeId))) {
        return String(jump.noticeId);
      }
      if (cur && timeline.some((it) => keyOfItem(it) === cur)) return cur;
      const q = appliedQuery.toLowerCase();
      const hit =
        (q &&
          timeline.find(
            (it) =>
              it.kind === "notice" &&
              `${it.notice.title} ${it.notice.body ?? ""}`.toLowerCase().includes(q),
          )) ||
        timeline.find((it) => it.kind === "notice" && isNoticeKind(it.notice)) ||
        timeline[0];
      return keyOfItem(hit);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline]);
  const activeItem = timeline.find((it) => keyOfItem(it) === activeKey) ?? null;
  /** 타임라인에서 바로 앞·뒤 항목 (이전/다음 이동, 앞 항목은 합치기 대상) */
  const activeIndex = timeline.findIndex((it) => keyOfItem(it) === activeKey);
  const previousNotice = activeIndex > 0 ? timeline[activeIndex - 1].notice : null;
  const nextNotice = activeIndex >= 0 && activeIndex < timeline.length - 1 ? timeline[activeIndex + 1].notice : null;
  const clearDraft = (noticeId) => setBodyDrafts((prev) => {
    if (!(noticeId in prev)) return prev;
    const next = { ...prev }; delete next[noticeId]; return next;
  });
  const getTags = (item) => noticeTagsOf(item.notice, detail, item.date);
  const isEventDay = (item) => getTags(item).some((tag) => tag === "행사" || tag === "공연");

  return (
    <div className="adminArchive adminArchive--catalog">
      <div className="adminArchive__head">
        <h1 className="admin-page-heading">아카이브</h1>
        <button
          type="button"
          className="aBar__save adminArchive__new"
          onClick={() => setSheet({ kind: "event", mode: "create", value: {
            ...EMPTY_EVENT, category: catFilter === "all" ? "공연" : catFilter,
            eventGroup: groupFilter, generation: genFilter === "all" || genFilter === "none" ? "" : genFilter,
          } })}
        >
          <IoAddOutline aria-hidden /> 새 기록
        </button>
      </div>

      <ArchiveCatalog events={events} category={catFilter} group={groupFilter} generation={genFilter}
        selectedId={selectedId} query={query} onQuery={setQuery} loading={listLoading} error={error}
        onNavigate={navigateCatalog} onSelect={(event) => selectEvent(String(event._id))} onOpenNotice={openNotice}
        onGeneration={(key, records) => {
          if (selectedId && records[0]) selectEvent(String(records[0]._id));
          else changeLocation({ category: catFilter, group: groupFilter, generation: key });
        }} />
      {selectedId ? <div className="adminArchive__detailPage">
        <section className="adminArchive__main" aria-label="행사 상세" aria-busy={detailLoading}>
          {detailLoading || (detail && String(detail._id) !== selectedId) ? (
            <p className="aList__empty">불러오는 중…</p>
          ) : detail ? (
            <>
              <header className="adminArchive__eventHead">
                <div className="adminArchive__eventText">
                  <p className="adminArchive__eventMeta">
                    <span className="adminArchive__catTag">{categoryOf(detail)}</span>
                    {eventMeta(detail)}
                  </p>
                  <h2 className="adminArchive__eventTitle">{detail.title}</h2>
                  {detail.tags?.length ? (
                    <span className="adminArchive__tags">
                      {detail.tags.map((t) => (
                        <span key={t} className="adminArchive__tag">
                          #{t}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </div>
                <div className="aList__actions">
                  <button
                    type="button"
                    className="aList__btn"
                    onClick={() =>
                      setSheet({
                        kind: "event",
                        mode: "edit",
                        value: {
                          title: detail.title ?? "",
                          startDate: startOf(detail),
                          endDate: endOf(detail) === startOf(detail) ? "" : endOf(detail),
                          generation: detail.generation ?? "",
                          category: categoryOf(detail),
                          eventGroup: groupOf(detail),
                          tags: (detail.tags ?? []).join(", "),
                          summary: detail.summary ?? "",
                        },
                      })
                    }
                  >
                    수정
                  </button>
                  <button type="button" className="aList__btn aList__btn--danger" onClick={() => void deleteEvent()}>
                    삭제
                  </button>
                </div>
              </header>

              {detail.summary ? (
                <p className="adminArchive__summary">
                  <Highlight text={detail.summary} query={appliedQuery} />
                </p>
              ) : null}

              <div className="adminArchive__noticesHead">
                <button
                  type="button"
                  className="aList__btn aList__btn--primary"
                  onClick={() => {
                    // 기본 위치: 오늘 (지난 행사면 행사 시작일)
                    const start = startOf(detail);
                    const t = todayKey();
                    setSheet({
                      kind: "notice",
                      mode: "create",
                      value: { title: "", body: "", kind: "일정", tags: [], endDate: "", date: start && t > endOf(detail) ? start : t },
                    });
                  }}
                >
                  항목 추가
                </button>
              </div>

              {timeline.length === 0 ? (
                <p className="aList__empty">아직 항목이 없어요. 그때 올렸던 공지나 일정을 날짜와 함께 넣어 두세요.</p>
              ) : (
                <>
                  {/* 위: 실제 날짜 간격 선 · 아래: 카드 줄 (누르면 아래에 크게) */}
                  <DateTimeline items={timeline} activeKey={activeKey} onSelect={setActiveKey} getTags={getTags} />

                  {timeline.some((it) => !it.date) ? (
                    <div className="scaleTl__undated">
                      <span>날짜 없음</span>
                      {timeline
                        .filter((it) => !it.date)
                        .map((it) => (
                          <button
                            key={keyOfItem(it)}
                            type="button"
                            className="aList__btn"
                            aria-pressed={activeKey === keyOfItem(it)}
                            onClick={() => setActiveKey(keyOfItem(it))}
                          >
                            {it.notice.title}
                          </button>
                        ))}
                    </div>
                  ) : null}

                  {/* 고른 항목 크게 */}
                  {activeItem ? (
                    activeItem.kind === "event" ? (
                      <article className="adminArchive__focus adminArchive__focus--event">
                        <p className="adminArchive__focusWhen">
                          <span className="adminArchive__tlRel">행사</span>
                          {formatPeriod(startOf(detail), endOf(detail))}
                          {periodDays(startOf(detail), endOf(detail)) > 1
                            ? ` · ${periodDays(startOf(detail), endOf(detail))}일간`
                            : ""}
                        </p>
                        <h4 className="adminArchive__focusTitle">{detail.title}</h4>
                        <p className="adminArchive__focusHint">
                          앞뒤 항목에서 행사 전 준비(D-)와 끝난 뒤 정리(D+)를 볼 수 있어요.
                        </p>
                      </article>
                    ) : (
                      <article className="adminArchive__focus">
                        <div className="adminArchive__noticeHead">
                          <div>
                            <p className="adminArchive__focusWhen">
                              {activeItem.rel && !isEventDay(activeItem) ? <span className="adminArchive__tlRel">{activeItem.rel}</span> : null}
                              {activeItem.date
                                ? formatPeriod(activeItem.date, activeItem.notice.endDate || activeItem.date)
                                : "날짜 없음"}
                              {activeItem.notice.endDate
                                ? ` · ${periodDays(activeItem.date, activeItem.notice.endDate)}일간`
                                : ""}
                              {activeItem.notice.authorName ? ` · ${activeItem.notice.authorName}` : ""}
                            </p>
                            <h4 className="adminArchive__focusTitle">
                              <Highlight text={activeItem.notice.title} query={appliedQuery} />
                            </h4>
                          </div>
                        </div>
                        <ArchiveBody
                          key={detail._id + ':' + activeItem.notice._id}
                          focusQuery={jump && String(jump.noticeId) === String(activeItem.notice._id) ? jump.q : ''}
                          onFocused={() => setJump(null)}
                          query={appliedQuery}
                          editing={editingId === String(activeItem.notice._id) || activeItem.notice._id in bodyDrafts}
                          onEditStart={() => setEditingId(String(activeItem.notice._id))}
                          onEditEnd={() => { clearDraft(activeItem.notice._id); setEditingId(null); }}
                          value={activeItem.notice.body ?? ''}
                          draft={bodyDrafts[activeItem.notice._id]}
                          onDelete={() => void deleteNotice(activeItem.notice)}
                          onEdit={() => setSheet({
                            kind: "notice", mode: "edit", noticeId: activeItem.notice._id, initialTags: getTags(activeItem),
                            value: {
                              title: activeItem.notice.title ?? "",
                              body: bodyDrafts[activeItem.notice._id] ?? activeItem.notice.body ?? "",
                              date: activeItem.notice.date ?? "",
                              endDate: activeItem.notice.endDate ?? "",
                              kind: activeItem.notice.kind ?? "일정",
                              tags: getTags(activeItem),
                            },
                          })}
                          onSplitNotice={async (body, at) => {
                            const eventId = detail._id;
                            const noticeId = activeItem.notice._id;
                            const res = await apiClient.post(
                              `/api/archive/${eventId}/notices/${noticeId}/split`, { body, at }, authConfig(),
                            );
                            clearDraft(noticeId);
                            afterSave(res.data.event);
                            setEditingId(null);
                            if (res.data.noticeId) setActiveKey(String(res.data.noticeId));
                            showToast("떼어낸 섹션을 새 항목으로 만들었어요. 제목은 '제목·날짜 수정'에서 바꿀 수 있어요.");
                          }}
                          {...(previousNotice ? {
                            mergeLabel: `앞 항목 「${previousNotice.title}」 뒤에 이 본문을 붙이고 이 항목은 지웁니다`,
                            onMergeNotice: async (body) => {
                              if (previousNotice._id in bodyDrafts) {
                                await modal(`앞 항목 「${previousNotice.title}」에 저장되지 않은 내용이 있어요. 그 항목을 먼저 저장한 뒤 합쳐 주세요.`);
                                return;
                              }
                              const ok = await modal(`이 항목을 앞 항목 「${previousNotice.title}」에 합칠까요?\n이 항목 「${activeItem.notice.title}」은 지워집니다.`, "confirm");
                              if (!ok) return;
                              const eventId = detail._id;
                              const noticeId = activeItem.notice._id;
                              const res = await apiClient.post(
                                `/api/archive/${eventId}/notices/${noticeId}/merge`, { into: previousNotice._id, body }, authConfig(),
                              );
                              clearDraft(noticeId);
                              setEditingId(null);
                              setActiveKey(String(previousNotice._id));
                              afterSave(res.data.event);
                              showToast("합쳤어요.");
                            },
                          } : {})}
                          onDraft={(body) => {
                            const id = activeItem.notice._id;
                            setBodyDrafts((prev) => {
                              const next = { ...prev };
                              if (body === (activeItem.notice.body ?? '')) delete next[id];
                              else next[id] = body;
                              return next;
                            });
                          }}
                          onSave={async (body) => {
                            const eventId = detail._id;
                            const noticeId = activeItem.notice._id;
                            const res = await apiClient.patch(
                              `/api/archive/${eventId}/notices/${noticeId}`, { body }, authConfig(),
                            );
                            const saved = res.data.event.notices.find((n) => String(n._id) === String(noticeId));
                            setDetail((current) => current?._id === eventId ? {
                              ...current, notices: current.notices.map((n) => n._id === noticeId ? { ...n, body: saved.body } : n),
                            } : current);
                            setBodyDrafts((prev) => {
                              if (prev[noticeId] !== body) return prev;
                              const next = { ...prev }; delete next[noticeId]; return next;
                            });
                          }}
                        />
                        <nav className="archiveStep" aria-label="이전·다음 항목">
                          <button type="button" className="archiveStep__btn" disabled={!previousNotice}
                            onClick={() => previousNotice && setActiveKey(String(previousNotice._id))}>
                            <span>이전</span><strong>{previousNotice?.title ?? "첫 항목이에요"}</strong>
                          </button>
                          <span className="archiveStep__count">{activeIndex + 1} / {timeline.length}</span>
                          <button type="button" className="archiveStep__btn archiveStep__btn--next" disabled={!nextNotice}
                            onClick={() => nextNotice && setActiveKey(String(nextNotice._id))}>
                            <span>다음</span><strong>{nextNotice?.title ?? "마지막 항목이에요"}</strong>
                          </button>
                        </nav>
                      </article>
                    )
                  ) : null}
                </>
              )}
            </>
          ) : null}
        </section>
      </div> : null}

      {sheet ? (
        <ArchiveSheet
          title={
            sheet.kind === "event"
              ? sheet.mode === "create"
                ? "새 기록"
                : "기록 수정"
              : sheet.mode === "create"
                ? "항목 추가"
                : "항목 수정"
          }
          fields={sheet.kind === "event" ? EVENT_FIELDS.map((field) => field.name === "eventGroup" && sheet.value.category === "공연" ? {
            ...field, label: "공연 분류", options: ["", ...PERFORMANCE_GROUPS, UNCLASSIFIED_PERFORMANCE,
              ...(sheet.value.eventGroup && ![...PERFORMANCE_GROUPS, UNCLASSIFIED_PERFORMANCE].includes(sheet.value.eventGroup) ? [sheet.value.eventGroup] : [])],
          } : field) : NOTICE_FIELDS}
          value={sheet.value}
          onChange={(value) => setSheet((s) => ({ ...s, value: s.kind === "event" && s.value.category !== value.category ? { ...value, eventGroup: "" } : value }))}
          onClose={() => setSheet(null)}
          onSubmit={() => void submitSheet()}
          submitting={submitting}
          submitLabel={sheet.mode === "create" ? "추가" : "저장"}
        />
      ) : null}

      <p className={`adminArchive__toast${toast ? " adminArchive__toast--on" : ""}`} role="status" aria-live="polite">
        {toast}
      </p>
    </div>
  );
};

export default AdminArchive;
