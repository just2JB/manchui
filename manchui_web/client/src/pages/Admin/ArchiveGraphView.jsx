import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoArrowBackOutline, IoChevronForward, IoCloseOutline, IoOptionsOutline, IoRefreshOutline } from "react-icons/io5";
import ArchiveGraph from "./ArchiveGraph.jsx";
import { DEFAULT_GRAPH_SETTINGS, GRAPH_COLORS, buildArchiveGraph, localGraph } from "./archiveGraphData.js";

/** 설정을 브라우저에 기억 */
const useGraphSettings = (storageKey, overrides = {}) => {
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULT_GRAPH_SETTINGS, ...overrides, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
    } catch {
      return { ...DEFAULT_GRAPH_SETTINGS, ...overrides };
    }
  });
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* 저장 못 해도 괜찮음 */ }
  }, [storageKey, settings]);
  const reset = () => setSettings({ ...DEFAULT_GRAPH_SETTINGS, ...overrides, query: settings.query });
  return [settings, setSettings, reset];
};

const Toggle = ({ label, checked, onChange }) => (
  <label className="graphPanel__row">
    <span>{label}</span>
    <button type="button" role="switch" aria-checked={checked} className="graphPanel__switch" onClick={() => onChange(!checked)} />
  </label>
);
const Slider = ({ label, value, min, max, step, onChange }) => (
  <label className="graphPanel__row graphPanel__row--slider">
    <span>{label}</span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
  </label>
);
const Section = ({ title, open, onToggle, children }) => (
  <section className="graphPanel__section">
    <button type="button" className="graphPanel__sectionHead" aria-expanded={open} onClick={onToggle}>
      <IoChevronForward aria-hidden />{title}
    </button>
    {open ? <div className="graphPanel__sectionBody">{children}</div> : null}
  </section>
);

/** 옵시디언 그래프 설정 패널: 필터 · 그룹 · 표시 · 힘 */
export const GraphSettingsPanel = ({ settings, onChange, onReset, onAnimate, local = false, onClose }) => {
  const [open, setOpen] = useState(() => ({ filters: true, groups: !local, display: !local, forces: false }));
  const set = (key) => (value) => onChange((cur) => ({ ...cur, [key]: value }));
  const toggle = (key) => () => setOpen((cur) => ({ ...cur, [key]: !cur[key] }));
  return (
    <div className="graphPanel" role="region" aria-label="그래프 설정">
      <div className="graphPanel__top">
        <button type="button" className="graphPanel__icon" onClick={onReset} aria-label="기본값으로" title="기본값으로">
          <IoRefreshOutline aria-hidden />
        </button>
        {onClose ? <button type="button" className="graphPanel__icon" onClick={onClose} aria-label="설정 닫기">
          <IoCloseOutline aria-hidden />
        </button> : null}
      </div>
      <Section title="필터" open={open.filters} onToggle={toggle("filters")}>
        {!local ? <input type="search" className="graphPanel__search" value={settings.query} placeholder="노드 이름 검색…"
          aria-label="그래프 검색" onChange={(e) => set("query")(e.target.value)} /> : null}
        {local ? <Slider label={`깊이 ${settings.depth}`} value={settings.depth} min={1} max={4} step={1} onChange={set("depth")} /> : null}
        <Toggle label="항목" checked={settings.showNotices} onChange={set("showNotices")} />
        <Toggle label="갈래 (공연진 · 곡장 …)" checked={settings.showBranches} onChange={set("showBranches")} />
        <Toggle label="갈래 안 날짜순으로 잇기" checked={settings.chainBranches} onChange={set("chainBranches")} />
        <Toggle label="태그" checked={settings.showTags} onChange={set("showTags")} />
        <Toggle label="행사 묶음" checked={settings.showGroups} onChange={set("showGroups")} />
        <Toggle label="없는 링크 대상" checked={settings.showGhosts} onChange={set("showGhosts")} />
        {!local ? <Toggle label="고아 노드" checked={settings.showOrphans} onChange={set("showOrphans")} /> : null}
      </Section>
      <Section title="그룹" open={open.groups} onToggle={toggle("groups")}>
        <Toggle label="분류별 색" checked={settings.colorGroups} onChange={set("colorGroups")} />
        <ul className="graphPanel__legend">
          {Object.entries(GRAPH_COLORS).map(([name, color]) => (
            <li key={name}><span style={{ background: settings.colorGroups ? color : undefined }} />{name}</li>
          ))}
          <li><span className="graphPanel__legendBranch" />갈래</li>
          <li><span className="graphPanel__legendTag" />태그</li>
          <li><span className="graphPanel__legendGhost" />없는 링크</li>
        </ul>
      </Section>
      <Section title="표시" open={open.display} onToggle={toggle("display")}>
        <Toggle label="화살표" checked={settings.arrows} onChange={set("arrows")} />
        <Slider label="텍스트 페이드 임계값" value={settings.textFade} min={0.3} max={3} step={0.05} onChange={set("textFade")} />
        <Slider label="노드 크기" value={settings.nodeSize} min={0.4} max={3} step={0.05} onChange={set("nodeSize")} />
        <Slider label="링크 두께" value={settings.linkWidth} min={0.2} max={4} step={0.05} onChange={set("linkWidth")} />
        {onAnimate ? <button type="button" className="graphPanel__animate" onClick={onAnimate}>애니메이션</button> : null}
      </Section>
      <Section title="힘" open={open.forces} onToggle={toggle("forces")}>
        <Slider label="중심력" value={settings.centerForce} min={0} max={0.3} step={0.005} onChange={set("centerForce")} />
        <Slider label="반발력" value={settings.repelForce} min={0} max={600} step={5} onChange={set("repelForce")} />
        <Slider label="링크 힘" value={settings.linkForce} min={0} max={1} step={0.01} onChange={set("linkForce")} />
        <Slider label="링크 거리" value={settings.linkDistance} min={10} max={300} step={1} onChange={set("linkDistance")} />
      </Section>
    </div>
  );
};

/** 전체 그래프 화면: 화면 전체를 덮는다. Esc 로 목록으로 */
export const ArchiveGraphView = ({ events, loading, error, onOpen, onExit }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // 시트·모달이 열려 있으면 그쪽이 먼저 닫힌다
      if (document.querySelector("[aria-modal='true']")) return;
      onExit?.();
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onExit]);
  const [settings, setSettings, reset] = useGraphSettings("manchui.archiveGraph.global");
  const [panelOpen, setPanelOpen] = useState(() => window.matchMedia?.("(min-width: 760px)").matches ?? true);
  const [timelapse, setTimelapse] = useState(0);
  const { query, showNotices, showBranches, chainBranches, showTags, showGroups, showGhosts, showOrphans } = settings;
  const graph = useMemo(() => buildArchiveGraph(events, { query, showNotices, showBranches, chainBranches, showTags, showGroups, showGhosts, showOrphans }),
    [events, query, showNotices, showBranches, chainBranches, showTags, showGroups, showGhosts, showOrphans]);
  const graphRef = useRef(null);
  return (
    <section className="archiveGraphView" aria-label="그래프 보기">
      <ArchiveGraph ref={graphRef} graph={graph} settings={settings} onOpen={onOpen} timelapse={timelapse} layoutKey="global" />
      <div className="archiveGraphView__bar">
        <button type="button" className="archiveGraphView__back" onClick={onExit} title="목록으로 (Esc)">
          <IoArrowBackOutline aria-hidden /> 목록
        </button>
        <h2 className="archiveGraphView__title">아카이브 그래프</h2>
        <p className="archiveGraphView__stats">
          {loading ? "불러오는 중…" : error ? error : `노드 ${graph.nodes.length} · 연결 ${graph.links.length}`}
        </p>
      </div>
      {panelOpen ? (
        <GraphSettingsPanel settings={settings} onChange={setSettings} onReset={reset}
          onAnimate={() => setTimelapse(Date.now())} onClose={() => setPanelOpen(false)} />
      ) : (
        <button type="button" className="archiveGraphView__settings" onClick={() => setPanelOpen(true)} aria-label="그래프 설정 열기">
          <IoOptionsOutline aria-hidden />
        </button>
      )}
      <p className="archiveGraphView__hint">드래그로 이동 · 휠/두 손가락으로 확대 · 노드를 누르면 열려요 · 본문에 [[기록 이름]]을 쓰면 연결돼요</p>
    </section>
  );
};

/** 기록 상세의 로컬 그래프 */
export const ArchiveLocalGraph = ({ events, recordId, activeNoticeId, onOpen }) => {
  const [settings, setSettings, reset] = useGraphSettings("manchui.archiveGraph.local", { depth: 2, linkDistance: 50, repelForce: 120 });
  const [panelOpen, setPanelOpen] = useState(false);
  const [open, setOpen] = useState(() => localStorage.getItem("manchui.archiveGraph.localOpen") !== "0");
  useEffect(() => { try { localStorage.setItem("manchui.archiveGraph.localOpen", open ? "1" : "0"); } catch { /* 무시 */ } }, [open]);
  const { showNotices, showBranches, chainBranches, showTags, showGroups, showGhosts } = settings;
  const full = useMemo(() => buildArchiveGraph(events, { showNotices, showBranches, chainBranches, showTags, showGroups, showGhosts, query: "", showOrphans: true }),
    [events, showNotices, showBranches, chainBranches, showTags, showGroups, showGhosts]);
  const graph = useMemo(() => localGraph(full, `r:${recordId}`, settings.depth), [full, recordId, settings.depth]);
  const focusId = activeNoticeId && showNotices ? `n:${activeNoticeId}` : `r:${recordId}`;
  return (
    <section className="archiveLocalGraph" aria-label="연관 그래프">
      <div className="archiveLocalGraph__head">
        <button type="button" className="archiveLocalGraph__title" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <IoChevronForward aria-hidden />연관 그래프
          <span>{graph.nodes.length ? `${graph.nodes.length - 1}개 연결` : ""}</span>
        </button>
        {open ? <button type="button" className="graphPanel__icon" aria-label="로컬 그래프 설정" aria-pressed={panelOpen}
          onClick={() => setPanelOpen((v) => !v)}><IoOptionsOutline aria-hidden /></button> : null}
      </div>
      {open ? <div className="archiveLocalGraph__body">
        <ArchiveGraph graph={graph} settings={settings} onOpen={onOpen} focusId={focusId}
          layoutKey={`local:${recordId}`} label="연관 그래프" key={recordId} />
        {panelOpen ? <GraphSettingsPanel local settings={settings} onChange={setSettings} onReset={reset}
          onClose={() => setPanelOpen(false)} /> : null}
      </div> : null}
    </section>
  );
};
