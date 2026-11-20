import { IoArrowForwardOutline, IoMusicalNotesOutline, IoPeopleOutline, IoFolderOpenOutline, IoDocumentTextOutline, IoSettingsOutline, IoChevronForward, IoSearchOutline } from "react-icons/io5";
import { CATEGORIES, categoryOf, categoryExamples, catalogGroups, generationGroups, generationKey, generationLabel, groupOf, yearTimeline } from "./archiveCatalogData.js";

const CATEGORY_INFO = {
  공연: { icon: IoMusicalNotesOutline, text: "무대에 오른 공연과 준비 과정" },
  활동: { icon: IoPeopleOutline, text: "총회·MT·클래스 같은 동아리 활동" },
  운영: { icon: IoSettingsOutline, text: "임원진 인수인계와 동아리 행정" },
  기타: { icon: IoFolderOpenOutline, text: "단체복·굿즈 등 그 밖의 기록" },
  자료: { icon: IoDocumentTextOutline, text: "회칙·양식처럼 두고 보는 자료" },
};
const dateLabel = (record) => (record.startDate || record.eventDate || "").replaceAll("-", ". ") || "날짜 미지정";

const MAX_HITS = 40;
const md = (date) => { const [, m, d] = date.split("-"); return `${Number(m)}. ${Number(d)}.`; };
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
const weekday = (date) => WEEKDAY[new Date(`${date}T00:00:00`).getDay()];

/** 검색어 부분을 <mark>로 */
const Mark = ({ text, query }) => {
  const q = query.trim();
  if (!q) return text;
  const parts = String(text).split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((part, i) => (part.toLowerCase() === q.toLowerCase() ? <mark key={i}>{part}</mark> : part));
};

export default function ArchiveCatalog({ events, category, group, generation, selectedId, query, onQuery, loading, error, onNavigate, onSelect, onGeneration, onOpenNotice }) {
  // 지금 보고 있는 분류·폴더 안에서 본문이 일치한 항목 (최신 기록 먼저)
  const hits = events
    .filter((event) => (category === "all" || categoryOf(event) === category) && (!group || groupOf(event) === group))
    .flatMap((event) => (event.matches ?? []).map((match) => ({ event, match })))
    .slice(0, MAX_HITS);
  const folders = catalogGroups(events, category);
  const year = yearTimeline(events);
  const records = events.filter((event) => categoryOf(event) === category && groupOf(event) === group);
  const generations = generationGroups(records);
  const visible = generations.filter((item) => generation === "all" || item.key === generation);
  return <div className="archiveCatalog">
    <nav className="archiveCatalog__crumbs" aria-label="아카이브 위치">
      <button type="button" onClick={() => onNavigate("all", "")} aria-current={category === "all" ? "page" : undefined}>전체 분류</button>
      {category !== "all" ? <><IoChevronForward aria-hidden /><button type="button" onClick={() => onNavigate(category, "")} aria-current={!group ? "page" : undefined}>{category}</button></> : null}
      {group ? <><IoChevronForward aria-hidden /><button type="button" onClick={() => onNavigate(category, group)} aria-current={!selectedId ? "page" : undefined}>{group}</button></> : null}
      {selectedId ? <><IoChevronForward aria-hidden /><span aria-current="page">{generationLabel(generation)}</span></> : null}
    </nav>

    {!selectedId ? <>
      <div className="archiveCatalog__heading">
        <div><h2>{group || (category === "all" ? "전체 분류" : category)}</h2></div>
        <label className="adminArchive__search"><IoSearchOutline aria-hidden /><input type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="행사·본문 검색" aria-label="아카이브 검색" /></label>
      </div>
      {query.trim() ? <p className="archiveCatalog__searchHint">검색에 맞는 기록만 표시하고 있어요.<button type="button" onClick={() => onQuery("")}>검색 지우기</button></p> : null}
      {query.trim() && hits.length ? <section className="archiveHits" aria-label="본문 검색 결과">
        <h3>본문에서 찾은 항목<span>{hits.length}{hits.length >= MAX_HITS ? "+" : ""}개</span></h3>
        <ul>{hits.map(({ event, match }) => <li key={match._id}>
          <button type="button" className="archiveHits__item" onClick={() => onOpenNotice(event, match._id)}>
            <span className="archiveHits__where">{event.title}{event.generation != null ? ` · ${event.generation}기` : ""}{match.date ? ` · ${match.date.replaceAll("-", ". ")}` : ""}</span>
            <strong><Mark text={match.title} query={query} /></strong>
            {match.snippet ? <span className="archiveHits__snippet"><Mark text={match.snippet} query={query} /></span> : null}
          </button>
        </li>)}</ul>
      </section> : null}
    </> : null}
    {error ? <p className="aList__error" role="alert">{error}</p> : null}
    {loading ? <p className="archiveCatalog__loading" role="status">기록 불러오는 중…</p> : null}

    {category === "all" ? <div className="archiveCatalog__cards">
      {CATEGORIES.map((name) => {
        const { icon: Icon, text } = CATEGORY_INFO[name];
        const count = events.filter((event) => categoryOf(event) === name).length;
        const examples = categoryExamples(events, name);
        return <button type="button" className="archiveCatalog__card" data-category={name} key={name} onClick={() => onNavigate(name, "")}
          aria-label={`${name}, ${count}개 기록`}>
          <Icon className="archiveCatalog__cardMark" aria-hidden />
          <span className="archiveCatalog__cardTop">
            <span className="archiveCatalog__cardIcon"><Icon aria-hidden /></span>
            <span className="archiveCatalog__cardCount"><strong>{loading ? "…" : count}</strong>개 기록</span>
          </span>
          <span className="archiveCatalog__cardName"><strong>{name}</strong><IoArrowForwardOutline aria-hidden /></span>
          <span className="archiveCatalog__cardText">{text}</span>
          {examples.length ? <span className="archiveCatalog__cardExamples">
            {examples.map((example) => <span key={example}>{example}</span>)}
          </span> : null}
        </button>;
      })}
    </div> : !group ? <div className="archiveCatalog__folders">
      {folders.map(({ name, records: entries }, index) => <button type="button" className="archiveCatalog__folder" key={name} onClick={() => onNavigate(category, name)}>
        <span className="archiveCatalog__folderNumber">{String(index + 1).padStart(2, "0")}</span>
        <strong>{name}</strong><span>{entries.length}개 기록 · {new Set(entries.map(generationKey)).size}개 기수</span><IoArrowForwardOutline aria-hidden />
      </button>)}
      {!folders.length && !loading ? <p className="aList__empty">아직 기록이 없어요. ‘새 기록’으로 첫 기록을 남겨 보세요.</p> : null}
    </div> : <>
      {generations.length ? <div className="archiveCatalog__generations" role="group" aria-label="기수 선택">
        {!selectedId ? <button type="button" aria-pressed={generation === "all"} onClick={() => onGeneration("all", records)}>전체 기수</button> : null}
        {generations.map((item) => <button type="button" key={item.key} aria-pressed={generation === item.key} onClick={() => onGeneration(item.key, item.records)}>{item.label}<span>{item.records.length}</span></button>)}
      </div> : null}
      {!selectedId ? visible.map((item) => <section className="archiveCatalog__generation" key={item.key}>
        <h3>{item.label}<span>{item.records.length}개 기록</span></h3>
        <div className="archiveCatalog__records">{item.records.map((record) => <button type="button" className="archiveCatalog__record" key={record._id} onClick={() => onSelect(record)}>
          <span className="archiveCatalog__recordDate">{dateLabel(record)}</span><strong>{record.title}</strong>
          <span className="archiveCatalog__recordSummary">{record.summary || "일정과 내용을 확인하세요."}</span>
          <span className="archiveCatalog__recordFoot">{record.noticeCount ?? record.notices?.length ?? 0}개 항목<IoArrowForwardOutline aria-hidden /></span>
        </button>)}</div>
      </section>) : records.filter((record) => generationKey(record) === generation).length > 1 ? <div className="archiveCatalog__siblings" role="group" aria-label="같은 기수의 기록">
        {records.filter((record) => generationKey(record) === generation).map((record) => <button type="button" key={record._id} aria-pressed={String(record._id) === selectedId} onClick={() => onSelect(record)}>{record.title}</button>)}
      </div> : null}
      {!records.length && !loading ? <p className="aList__empty">{query.trim() ? "검색에 맞는 기록이 없어요." : "아직 이 행사의 기록이 없어요. ‘새 기록’으로 기수별 기록을 추가하세요."}</p> : null}
    </>}
    {category === "all" && !query.trim() && year.months.length ? <section className="archiveYear" aria-labelledby="archiveYearTitle">
      <h3 id="archiveYearTitle">{year.base}기 한 해 타임라인<span>{year.base}기 · {year.base + 0.5}기 공연·활동, 행사 당일 기준</span></h3>
      <ol className="archiveYear__months">
        {year.months.map(({ month, items }) => <li key={month} className="archiveYear__month">
          <h4>{Number(month.slice(5))}월<span>{month.slice(0, 4)}</span></h4>
          <ul>{items.map(({ event, date, endDate }) => <li key={event._id}>
            <button type="button" className="archiveYear__item" data-category={categoryOf(event)} onClick={() => onSelect(event)}>
              <span className="archiveYear__date">{md(date)} ({weekday(date)}){endDate ? ` – ${md(endDate)}` : ""}</span>
              <strong>{event.title}</strong>
              <span className="archiveYear__meta">{categoryOf(event)} · {event.generation}기</span>
            </button>
          </li>)}</ul>
        </li>)}
      </ol>
    </section> : null}
  </div>;
}
