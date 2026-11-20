import React, { useEffect, useRef, useState } from "react";
import { IoAddOutline, IoTrashOutline } from "react-icons/io5";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { DEFAULT_ICON, SECTION_ICONS, parseSections, serializeSections } from "./archiveSections.js";

const Highlight = ({ text, query }) => {
  const q = (query || "").trim();
  if (!q || !text) return text || null;
  const parts = String(text).split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? <mark key={i}>{part}</mark> : <React.Fragment key={i}>{part}</React.Fragment>,
  );
};

const autosize = (el) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.max(44, el.scrollHeight) + "px";
};

/** 읽기 화면: 머리말은 평범한 글, 섹션은 노션 콜아웃처럼 */
const ReadView = ({ value, query, readRef }) => {
  const sections = parseSections(value);
  const empty = sections.every((s) => !s.text);
  return <div ref={readRef} className="archiveBody">
    {empty ? <p className="archiveBody__empty">아직 내용이 없어요. ‘수정하기’를 눌러 작성하세요.</p> : null}
    {sections.map((s, i) => !s.text && (s.icon === null || empty) ? null : s.icon === null
      ? <div key={i} className="archiveBody__text"><Highlight text={s.text} query={query} /></div>
      : <div key={i} className="archiveCallout">
          <span className="archiveCallout__icon" aria-hidden>{s.icon}</span>
          <div className="archiveCallout__text">
            {s.title ? <strong className="archiveCallout__title"><Highlight text={s.title} query={query} /></strong> : null}
            <Highlight text={s.text} query={query} />
          </div>
        </div>)}
  </div>;
};

/**
 * 편집 화면. 열릴 때 본문을 섹션으로 나눠 따로 들고 있다가 바뀔 때마다 문자열로 합쳐 초안에 넘긴다
 * (입력할 때마다 다시 나누면 끝 줄바꿈이 사라지기 때문).
 */
const SectionEditor = ({ initial, value, onDraft, onSave, onCancel, onSplitNotice, onMergeNotice, mergeLabel }) => {
  const modal = useManchuiModal();
  const [sections, setSections] = useState(() => parseSections(initial));
  const [status, setStatus] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const areas = useRef([]);
  const busy = useRef(false);
  const text = serializeSections(sections);

  useEffect(() => { areas.current.forEach(autosize); }, [sections]);
  useEffect(() => {
    const el = areas.current[focusIndex];
    if (el) { el.focus({ preventScroll: focusIndex === 0 }); el.setSelectionRange(0, 0); }
  }, [focusIndex]);

  const update = (next) => { setSections(next); onDraft(serializeSections(next)); setStatus(""); };
  const setText = (i, t) => update(sections.map((s, k) => (k === i ? { ...s, text: t } : s)));
  const setTitle = (i, t) => update(sections.map((s, k) => (k === i ? { ...s, title: t.replace(/[\r\n]+/g, " ") } : s)));
  const cycleIcon = (i) => update(sections.map((s, k) => k === i
    ? { ...s, icon: SECTION_ICONS[(SECTION_ICONS.indexOf(s.icon) + 1) % SECTION_ICONS.length] } : s));
  /** 커서 위치에서 잘라 뒷부분을 새 콜아웃 섹션으로 */
  const splitAt = (i) => {
    const el = areas.current[i];
    const at = el?.selectionStart ?? sections[i].text.length;
    const before = sections[i].text.slice(0, at).replace(/\n+$/, "");
    const after = sections[i].text.slice(at).replace(/^\n+/, "");
    const next = [...sections];
    next.splice(i, 1, { ...sections[i], text: before }, { icon: DEFAULT_ICON, title: "", text: after });
    update(next);
    setFocusIndex(i + 1);
  };
  const addSection = () => { update([...sections, { icon: DEFAULT_ICON, title: "", text: "" }]); setFocusIndex(sections.length); };
  /** 섹션 지우기: 내용은 앞 섹션 끝에 붙인다 (내용이 날아가지 않게) */
  const removeSection = (i) => {
    const next = [...sections];
    const prev = next[i - 1];
    const joined = [prev.text, sections[i].text].filter(Boolean).join("\n\n");
    next.splice(i - 1, 2, { ...prev, text: joined });
    update(next);
    setFocusIndex(i - 1);
  };

  const run = async (action) => {
    if (busy.current) { setStatus("처리 중이에요. 잠시 후 다시 눌러 주세요."); return false; }
    busy.current = true;
    setStatus("저장 중…");
    try { await action(); setStatus(""); return true; }
    catch { setStatus("저장하지 못했어요. 작성한 내용은 유지됩니다. 다시 저장해 주세요."); return false; }
    finally { busy.current = false; }
  };
  const save = () => (text === value ? onCancel() : run(() => onSave(text)));
  const cancel = async () => {
    if (text !== value && !(await modal("저장하지 않은 수정 내용을 버릴까요?", "confirm"))) return;
    onCancel(true);
  };
  /** 이 섹션부터 뒤를 별도 항목(타임라인의 다른 공지)으로 떼어낸다 */
  const detach = (i) => {
    const at = serializeSections(sections.slice(0, i)).length;
    if (!at) { setStatus("앞에 내용이 있어야 따로 떼어낼 수 있어요."); return; }
    void run(() => onSplitNotice(text, at));
  };
  const keys = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); void save(); }
    if (e.key === "Escape") { e.preventDefault(); void cancel(); }
  };

  return <div className="archiveBody archiveBody--editing">
    {sections.map((s, i) => {
      const area = <textarea ref={(el) => { areas.current[i] = el; }} className="archiveEditor__body"
        aria-label={s.icon === null ? "머리말" : `섹션 ${i}`} maxLength={20000} value={s.text}
        placeholder={s.icon === null ? "내용을 작성하세요…" : "섹션 내용…"}
        onChange={(e) => setText(i, e.target.value)} onKeyDown={keys} />;
      const tools = <div className="archiveSectionTools">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => splitAt(i)}
          title="커서 뒤 내용을 새 섹션으로 나눕니다">커서에서 나누기</button>
        {s.icon !== null ? <>
          {onSplitNotice ? <button type="button" onClick={() => detach(i)} title="이 섹션부터 뒤를 별도 항목으로 떼어냅니다">따로 항목으로</button> : null}
          <button type="button" className="archiveSectionTools__danger" onClick={() => removeSection(i)}
            title="섹션 상자를 없애고 내용은 앞에 붙입니다" aria-label="섹션 해제"><IoTrashOutline aria-hidden /></button>
        </> : null}
      </div>;
      return s.icon === null
        ? <div key={i} className="archiveBody__lead">{area}{tools}</div>
        : <div key={i} className="archiveCallout archiveCallout--edit">
            <button type="button" className="archiveCallout__icon" onClick={() => cycleIcon(i)} title="아이콘 바꾸기">{s.icon}</button>
            <div className="archiveCallout__text">
              <input className="archiveCallout__titleInput" value={s.title} maxLength={80} placeholder="섹션 제목 (선택)"
                aria-label={`섹션 ${i} 제목`} onChange={(e) => setTitle(i, e.target.value)} onKeyDown={keys} />
              {area}{tools}
            </div>
          </div>;
    })}
    <button type="button" className="archiveBody__add" onClick={addSection}><IoAddOutline aria-hidden />섹션 추가</button>
    <div className="archiveEditor__foot">
      <span role="status">{status || (text !== value ? "저장하지 않은 변경사항 · Ctrl+Enter 저장 · Esc 취소" : "수정 중")}</span>
      <div className="archiveEditor__actions">
        {onMergeNotice ? <button type="button" className="aList__btn" title={mergeLabel} onClick={() => void run(() => onMergeNotice(text))}>앞 항목과 합치기</button> : null}
        <button type="button" className="aList__btn" onClick={() => void cancel()}>취소</button>
        <button type="button" className="aBar__save archiveEditor__saveBtn" onClick={() => void save()}>저장</button>
      </div>
    </div>
  </div>;
};

/**
 * 항목 본문. 평소에는 읽기 전용이고 '수정하기'를 눌러야 고친다.
 * 저장하지 않은 초안은 부모가 들고 있어서 다른 항목을 보고 와도 편집 상태로 이어진다.
 */
const ArchiveBody = ({ value, draft, onDraft, onSave, onDelete, onEdit, onSplitNotice, onMergeNotice, mergeLabel,
  query, focusQuery, onFocused, editing, onEditStart, onEditEnd }) => {
  const readRef = useRef(null);
  // 검색 결과에서 왔으면: 본문에서 검색어가 화면 가운데 오게
  useEffect(() => {
    if (!focusQuery) return;
    const frame = requestAnimationFrame(() => {
      const mark = readRef.current?.querySelector("mark");
      (mark ?? readRef.current)?.scrollIntoView({ block: "center", behavior: "smooth" });
      onFocused?.();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusQuery]);

  if (editing) {
    return <div className="archiveEditor">
      <SectionEditor initial={draft ?? value} value={value} onDraft={onDraft} mergeLabel={mergeLabel}
        onSplitNotice={onSplitNotice} onMergeNotice={onMergeNotice}
        onSave={async (text) => { await onSave(text); onEditEnd(); }}
        onCancel={() => onEditEnd()} />
    </div>;
  }
  return <div className="archiveEditor">
    <ReadView value={value} query={query || focusQuery} readRef={readRef} />
    <div className="archiveEditor__foot">
      <span />
      <div className="archiveEditor__actions">
        <button type="button" className="aBar__save archiveEditor__saveBtn" onClick={onEditStart}>수정하기</button>
        {onEdit ? <button type="button" className="aList__btn" onClick={onEdit}>제목·날짜 수정</button> : null}
        <button type="button" className="aList__btn aList__btn--danger" onClick={onDelete}>삭제</button>
      </div>
    </div>
  </div>;
};

export default ArchiveBody;
