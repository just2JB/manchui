import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  createLightingRow,
  deleteLightingRow,
  deleteLightingTeam,
  fetchLightingTeam,
  updateLightingRow,
  updateLightingTeam,
} from "../../api/lightingApi";
import { ChannelModal, PresetModal, PresetThumb } from "./PresetPicker";
import LightingTour from "./LightingTour";
import { EXAMPLE_AUDIO, EXAMPLE_ID, exampleTeamFor, makeExampleRows } from "./lightingExample";
import { useLightingI18n } from "./lightingI18n";
import LangSwitch from "./LangSwitch";
import {
  CHANNELS,
  CHANNEL_COLORS,
  DEFAULT_CHANNEL,
  formatTime,
  getPresetColor,
  getPresetImage,
  getPresetName,
  maskTime,
  normalizeTime,
  parseTime,
} from "./lightingPresets";
import "./Lighting.css";

const ROW_FIELDS = ["start", "end", "preset", "note"];
const TEAM_FIELDS = ["order", "name", "channel", "length"];

const changedFields = (fields, current, prev) => {
  const out = {};
  fields.forEach((f) => {
    if (String(current[f] ?? "") !== String(prev[f] ?? "")) out[f] = current[f];
  });
  return out;
};

/** 구간 = 시작 시간으로 나눈 조각. 시작 시간 순 (비어 있으면 00:00). 끝은 다음 구간 시작 또는 곡 끝 */
const sortRowIds = (rows) =>
  [...rows]
    .sort(
      (a, b) =>
        (parseTime(a.start) ?? 0) - (parseTime(b.start) ?? 0) ||
        String(a.createdAt).localeCompare(String(b.createdAt)),
    )
    .map((r) => r._id);
/* ───────── 플레이어 (음원 없이 곡 길이만큼 시간이 흐르는 타이머) ───────── */

/** 조명 타임라인 = 재생 바. 누르거나 끌면 시간만 이동 (조명 편집은 아래 구간 목록에서) */
function Timeline({ segments, channel, duration, time, currentId, onSeek }) {
  const { t } = useLightingI18n();
  const pct = (sec) => `${(Math.min(Math.max(sec, 0), duration) / duration) * 100}%`;
  const seekAt = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * duration);
  };
  return (
    <div
      className="ltTimeline"
      role="slider"
      tabIndex={0}
      aria-label={t("timeline")}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(time)}
      aria-valuetext={formatTime(Math.floor(time))}
      onPointerDown={(e) => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* 캡처 못 해도 누른 위치로는 이동 */
        }
        seekAt(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) seekAt(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") onSeek(time - 1);
        if (e.key === "ArrowRight") onSeek(time + 1);
      }}
    >
      {segments.map((s) => (
        <span
          key={s.id}
          className={`ltSeg${s.id === currentId ? " is-current" : ""}`}
          style={{
            left: pct(s.start),
            width: `calc(${pct(s.end)} - ${pct(s.start)})`,
            backgroundImage: `url(${getPresetImage(channel, s.preset)}), linear-gradient(${getPresetColor(s.preset)}, #0b0b0b)`,
          }}
          title={`${formatTime(s.start)}~${formatTime(s.end)} · ${getPresetName(channel, s.preset)}`}
        >
          <span>{s.preset}</span>
        </span>
      ))}
      <span className="ltTimeline__head" style={{ left: pct(time) }} />
    </div>
  );
}

/** 재생 컨트롤 한 줄 (재생 바는 타임라인이 대신함) */
function Controls({ playing, onToggle, onSeek, time, duration }) {
  const { t } = useLightingI18n();
  const ready = duration > 0;
  return (
    <div className="ltControls">
      <button
        type="button"
        className="ltPlayBtn ltPlayBtn--main"
        onClick={onToggle}
        disabled={!ready}
        aria-label={playing ? t("pause") : t("play")}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <span className="ltControls__time">
        <strong>{formatTime(Math.floor(time))}</strong>
        <span> / {ready ? formatTime(duration) : "-:--"}</span>
      </span>
      <button type="button" className="ltPlayBtn" onClick={() => onSeek(time - 5)} disabled={!ready}>
        −5
      </button>
      <button type="button" className="ltPlayBtn" onClick={() => onSeek(time + 5)} disabled={!ready}>
        +5
      </button>
    </div>
  );
}

/* ───────── 저장소: 실제 팀은 서버, 예시 팀은 이 화면 안에서만 ───────── */

const remoteApi = {
  fetchTeam: fetchLightingTeam,
  updateTeam: updateLightingTeam,
  deleteTeam: deleteLightingTeam,
  createRow: createLightingRow,
  updateRow: updateLightingRow,
  deleteRow: deleteLightingRow,
};

/** 예시 팀: 고친 내용은 새로고침하면 처음으로 돌아간다 */
const exampleApi = (() => {
  let team = null;
  let rows = [];
  let seq = 0;
  return {
    async fetchTeam(_id, lang) {
      team = exampleTeamFor(lang);
      rows = makeExampleRows(lang);
      return { team: { ...team }, rows: rows.map((r) => ({ ...r })) };
    },
    async updateTeam(_id, changes) {
      team = { ...team, ...changes };
      return { ...team };
    },
    async deleteTeam() {},
    async createRow(_teamId, fields) {
      seq += 1;
      const row = {
        _id: `example-new-${seq}`,
        teamId: EXAMPLE_ID,
        start: "",
        end: "",
        preset: 1,
        note: "",
        ...fields,
        createdAt: new Date().toISOString(),
      };
      rows.push(row);
      return { ...row };
    },
    async updateRow(rowId, changes) {
      rows = rows.map((r) => (r._id === rowId ? { ...r, ...changes } : r));
      return { ...rows.find((r) => r._id === rowId) };
    },
    async deleteRow(rowId) {
      rows = rows.filter((r) => r._id !== rowId);
    },
  };
})();

/* ───────── 페이지 ───────── */

export default function LightingTeam() {
  const { teamId } = useParams();
  const isExample = teamId === EXAMPLE_ID;
  const api = isExample ? exampleApi : remoteApi;
  const nav = useNavigate();
  const { t, lang } = useLightingI18n();
  // 예시는 언어를 바꾸면 예시 문구도 그 언어로 다시 불러온다
  const exampleLang = isExample ? lang : null;

  const [team, setTeam] = useState(null);
  const [rows, setRows] = useState({});
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(""); // 번역 키 또는 [키, 값]
  const statusText = Array.isArray(status) ? t(status[0], status[1]) : status ? t(status) : "";
  const [channelOpen, setChannelOpen] = useState(false);
  const [presetFor, setPresetFor] = useState(null); // row id
  // 팀을 막 만들면 ?tour=1 로 들어와서 사용법 안내가 바로 뜬다
  const [searchParams, setSearchParams] = useSearchParams();
  const [tourOpen, setTourOpen] = useState(() => searchParams.get("tour") === "1");
  const closeTour = useCallback(() => {
    setTourOpen(false);
    if (searchParams.get("tour")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const savedRows = useRef({});
  const savedTeam = useRef({});

  // 플레이어: 테스트 음원을 고르면 음원을 따라가고, 없으면 곡 길이만큼 흐르는 타이머
  // 테스트 음원은 이 기기에서만 재생 (서버에 올리지 않음)
  const audioRef = useRef(null);
  const fileRef = useRef(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  // 예시 팀은 예시 음원이 처음부터 걸려 있다
  const [src, setSrc] = useState(() => (isExample ? EXAMPLE_AUDIO.url : null));
  const [audioName, setAudioName] = useState(() => (isExample ? EXAMPLE_AUDIO.name : ""));
  const [audioDur, setAudioDur] = useState(0);
  const channel = CHANNELS.includes(team?.channel) ? team.channel : DEFAULT_CHANNEL;
  const lengthSec = parseTime(savedTeam.current.length) ?? 0;
  const duration = src ? audioDur || lengthSec : lengthSec;
  const resort = useCallback(() => setOrder(sortRowIds(Object.values(savedRows.current))), []);

  useEffect(() => {
    api
      .fetchTeam(teamId, exampleLang)
      .then(({ team: t, rows: list }) => {
        savedTeam.current = { ...t };
        setTeam({ ...t, length: normalizeTime(t.length) });
        savedRows.current = Object.fromEntries(list.map((r) => [r._id, { ...r }]));
        setRows(
          Object.fromEntries(
            list.map((r) => [
              r._id,
              { ...r, start: normalizeTime(r.start), end: normalizeTime(r.end) },
            ]),
          ),
        );
        resort();
      })
      .catch((e) => {
        console.error(e);
        setStatus(e.response?.status === 404 ? "notFound" : "loadFail");
      })
      .finally(() => setLoading(false));
  }, [teamId, resort, api, exampleLang]);

  useEffect(() => {
    document.title = team ? t("docTitleTeam", { name: team.name || t("teamFallback") }) : t("title");
  }, [team, t]);

  // 재생 중 시간 흐르기: 음원이면 음원 위치를 읽고, 아니면 실제 경과 시간만큼 더한다
  useEffect(() => {
    if (!playing) return undefined;
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      const a = audioRef.current;
      if (src && a) {
        setTime(a.currentTime);
      } else {
        const d = (now - last) / 1000;
        setTime((t) => Math.min(t + d, duration || t + d));
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, src]);

  useEffect(() => {
    if (!src && playing && duration && time >= duration) setPlaying(false);
  }, [src, playing, time, duration]);

  // 음원이 바뀌면 처음부터
  useEffect(() => {
    setPlaying(false);
    setTime(0);
    setAudioDur(0);
  }, [src]);

  // 직접 고른 파일(blob:)만 정리. 예시 음원 주소는 그대로 둔다
  useEffect(() => () => src?.startsWith("blob:") && URL.revokeObjectURL(src), [src]);

  const seek = (sec) => {
    const next = Math.max(0, Math.min(sec, duration || sec));
    const a = audioRef.current;
    if (src && a) a.currentTime = next;
    setTime(next);
  };
  const togglePlay = () => {
    if (!duration) return;
    const a = audioRef.current;
    if (src && a) {
      if (a.paused) void a.play();
      else a.pause();
      return;
    }
    if (!playing && time >= duration) setTime(0);
    setPlaying((p) => !p);
  };

  /* 테스트 음원: 이 기기에서만 재생 */
  const pickAudio = (file) => {
    setSrc(URL.createObjectURL(file));
    setAudioName(file.name);
  };
  const clearAudio = () => {
    setSrc(null);
    setAudioName("");
  };
  /* 팀 정보 저장 */
  const commitTeam = async (patchNow) => {
    const current = { ...team, ...patchNow };
    current.length = normalizeTime(current.length);
    setTeam(current);
    const changes = changedFields(TEAM_FIELDS, current, savedTeam.current);
    if (!Object.keys(changes).length) return;
    setStatus("saving");
    try {
      const t = await api.updateTeam(teamId, changes);
      savedTeam.current = { ...t };
      setStatus("saved");
    } catch (e) {
      console.error(e);
      setStatus("saveFail");
    }
  };

  const removeTeam = async () => {
    if (!window.confirm(t("confirmDeleteWholeTeam", { name: team.name || t("thisTeam") }))) return;
    await api.deleteTeam(teamId);
    nav("/lighting");
  };

  /* 구간 저장 */
  const editRow = (id, field, value) =>
    setRows((m) => ({ ...m, [id]: { ...m[id], [field]: value } }));

  const commitRow = async (id, patchNow) => {
    const current = { ...rows[id], ...patchNow };
    // "130" → "1:30", "5" → "0:05" 처럼 시간 표기를 맞춘다
    ["start", "end"].forEach((f) => {
      const sec = parseTime(current[f]);
      if (sec !== null) current[f] = formatTime(sec);
    });
    setRows((m) => ({ ...m, [id]: current }));
    const changes = changedFields(ROW_FIELDS, current, savedRows.current[id] || {});
    if (!Object.keys(changes).length) return;
    setStatus("saving");
    try {
      const row = await api.updateRow(id, changes);
      savedRows.current[id] = { ...row };
      resort();
      setStatus("saved");
    } catch (e) {
      console.error(e);
      setStatus("saveFail");
    }
  };

  /** 지금 재생 위치에서 새 조명 시작. 그 위치가 들어 있던 구간은 거기서 끝나고,
   *  새 구간은 다음 구간 시작(없으면 곡 끝)까지 채워진다. 첫 구간은 00:00 부터. */
  const addRow = async () => {
    const at = order.length ? Math.floor(time) : 0;
    const same = spans.find((s) => s.start === at);
    if (same) {
      setStatus(["alreadyAt", { t: formatTime(at) }]);
      setPresetFor(same.id);
      return;
    }
    const containing = spans.filter((s) => s.start <= at).pop();
    const preset = (containing && rows[containing.id]?.preset) || 1;
    try {
      const row = await api.createRow(teamId, { start: formatTime(at), preset });
      savedRows.current[row._id] = { ...row };
      setRows((m) => ({ ...m, [row._id]: row }));
      resort();
      setStatus(["newLightFrom", { t: formatTime(at) }]);
      setPresetFor(row._id); // 바로 조명 고르기
    } catch (e) {
      console.error(e);
      setStatus("addFail");
    }
  };
  const removeRow = async (id) => {
    if (!window.confirm(t("confirmDeleteCue"))) return;
    try {
      await api.deleteRow(id);
      delete savedRows.current[id];
      setRows((m) => {
        const next = { ...m };
        delete next[id];
        return next;
      });
      resort();
    } catch (e) {
      console.error(e);
      setStatus("deleteFail");
    }
  };

  /** 각 구간의 시작과 끝(=다음 구간 시작, 마지막은 null → 곡 끝). 저장된 값 기준 */
  const spans = useMemo(() => {
    const starts = order.map((id) => ({ id, start: parseTime(savedRows.current[id]?.start) ?? 0 }));
    return starts.map((s, i) => ({ ...s, end: starts[i + 1] ? starts[i + 1].start : null }));
  }, [order]);  const spanById = useMemo(() => Object.fromEntries(spans.map((s) => [s.id, s])), [spans]);

  /** 타임라인 블록 */
  const segments = useMemo(() => {
    if (!duration) return [];
    return spans
      .map((s) => ({
        id: s.id,
        start: s.start,
        end: Math.min(s.end ?? duration, duration),
        preset: rows[s.id]?.preset ?? 1,
      }))
      .filter((s) => s.start < duration && s.end > s.start);
  }, [spans, rows, duration]);

  /** 지금 재생 중인 구간 */
  const currentId = useMemo(() => {
    if (!duration) return null;
    const hit = spans.find((s) => s.start <= time && time < (s.end ?? duration));
    return hit ? hit.id : null;
  }, [spans, time, duration]);
  // 사이트 전역의 overflow-x: hidden 이 있으면 모바일에서 무대(sticky)가 위에 붙지 않는다.
  // 이 페이지에 있는 동안만 clip 으로 바꿔 둔다 (clip 은 스크롤 영역을 만들지 않음).
  useEffect(() => {
    const els = [document.documentElement, document.body, document.getElementById("root")].filter(Boolean);
    const prev = els.map((el) => el.style.overflowX);
    els.forEach((el) => {
      el.style.overflowX = "clip";
    });
    return () => {
      els.forEach((el, i) => {
        el.style.overflowX = prev[i];
      });
    };
  }, []);


  if (loading) {
    return (
      <div className="ltPage ltPage--team">
        <LangSwitch compact />
        <p className="ltEmpty">{t("loading")}</p>
      </div>
    );
  }
  if (!team) {
    return (
      <div className="ltPage ltPage--team">
        <Link to="/lighting" className="ltBack">
          {t("back")}
        </Link>
        <p className="ltEmpty">{statusText}</p>
      </div>
    );
  }

  const cur = currentId ? rows[currentId] : null;
  const endLabel = (id) => {
    const end = spanById[id]?.end;
    if (end !== null && end !== undefined) return formatTime(end);
    return duration ? formatTime(Math.round(duration)) : t("end");
  };

  const timeInput = (r, field) => (
    <input
      className="ltTimeIn"
      value={r[field] ?? ""}
      placeholder="00:00"
      inputMode="numeric"
      aria-label={t("startAria")}
      onChange={(e) => editRow(r._id, field, maskTime(e.target.value))}
      onBlur={() => commitRow(r._id)}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );

  return (
    <div className="ltPage ltPage--team" style={{ "--ch": CHANNEL_COLORS[channel] }}>
      {/* 상단 바: 언어 · 뒤로 · 도움말 (PC 에서도 전체 폭) */}
      <div className="ltTeamBar">
      <LangSwitch compact />
      <div className="ltTopBar">
        <Link to="/lighting" className="ltBack">
          {t("back")}
        </Link>
        <span className="ltTopBar__right">
          <span className="ltStatus" aria-live="polite">
            {statusText}
          </span>
          <button
            type="button"
            className="ltHelp noPrint"
            onClick={() => setTourOpen(true)}
            aria-label={t("help")}
            title={t("help")}
          >
            ?
          </button>
        </span>
      </div>

      </div>

      {/* 팀 정보: 안내 · 팀 이름 · 채널/곡 길이/음원 (PC 에서는 왼쪽 칸) */}
      <div className="ltTeamTop">
      {isExample ? (
        <p className="ltNotice">
          <strong>{t("noticeStrong")}</strong> {t("noticeRest")}
        </p>
      ) : null}

      {/* 팀 제목: 순서 + 이름 (폼 대신 제목처럼) */}
      <header className="ltTitle">
        <input
          className="ltTitle__order"
          inputMode="numeric"
          aria-label={t("orderAria")}
          placeholder="-"
          value={team.order ?? ""}
          onChange={(e) =>
            setTeam({ ...team, order: e.target.value.replace(/\D/g, "").slice(0, 3) })
          }
          onBlur={() => commitTeam()}
        />
        <input
          className="ltTitle__name"
          aria-label={t("teamNameAria")}
          placeholder={t("teamNamePh")}
          value={team.name}
          onChange={(e) => setTeam({ ...team, name: e.target.value })}
          onBlur={() => commitTeam()}
          maxLength={60}
        />
      </header>

      <div className="ltChips">
        <button
          type="button"
          className="ltChip ltChip--ch"
          data-tour="channel"
          onClick={() => setChannelOpen(true)}
        >
          <span className="ltChDot" />
          {t("channelChip", { n: channel })}
          <span className="ltChip__hint">{t("change")}</span>
        </button>
        <label className="ltChip" data-tour="length">
          {t("songLength")}
          <input
            className="ltChip__input"
            inputMode="numeric"
            placeholder="03:45"
            value={team.length ?? ""}
            onChange={(e) => setTeam({ ...team, length: maskTime(e.target.value) })}
            onBlur={() => commitTeam()}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
        </label>
        <span className={`ltChip ltChip--audio${src ? " has-audio" : ""}`}>
          <button
            type="button"
            className="ltChip__btn"
            onClick={() => fileRef.current?.click()}
            title={t("testAudioTitle")}
          >
            ♪ {src ? audioName : t("testAudio")}
          </button>
          {src ? (
            <button type="button" className="ltChip__x" onClick={clearAudio} aria-label={t("removeAudio")}>
              ✕
            </button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) pickAudio(f);
            }}
          />
        </span>
      </div>

      </div>

      {src ? (
        <audio
          ref={audioRef}
          src={src}
          preload="auto"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (!Number.isFinite(d)) return;
            setAudioDur(d);
            // 곡 길이를 안 적어 두었으면 음원 길이로 채운다
            if (!parseTime(savedTeam.current.length)) {
              void commitTeam({ length: formatTime(Math.round(d)) });
            }
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onSeeked={(e) => setTime(e.currentTarget.currentTime)}
        />
      ) : null}

      {/* 무대: 지금 켜져 있는 조명 + 가사 자막 → 타임라인 → 컨트롤 */}
      <section className="ltDeck" data-tour="player">
        <div className={`ltStage${cur ? "" : " is-dark"}`}>
          {cur ? (
            <>
              <PresetThumb channel={channel} preset={cur.preset} className="ltStage__img" />
              <div className="ltStage__over">
                <span className="ltStage__tag">
                  {getPresetName(channel, cur.preset)}
                  <em>
                    {formatTime(spanById[currentId]?.start ?? 0)}–{endLabel(currentId)}
                  </em>
                </span>
                {cur.note ? <p className="ltStage__lyric">{cur.note}</p> : null}
              </div>
            </>
          ) : (
            <p className="ltStage__empty">
              {duration ? t("stageNoLight") : t("stageNoLength")}
            </p>
          )}
        </div>
        {duration ? (
          <Timeline
            segments={segments}
            channel={channel}
            duration={duration}
            time={time}
            currentId={currentId}
            onSeek={seek}
          />
        ) : null}
        <Controls
          playing={playing}
          onToggle={togglePlay}
          onSeek={seek}
          time={time}
          duration={duration}
        />
        {/* 재생 위치에서 새 조명: 무대와 함께 위에 고정 */}
        <button type="button" className="ltAdd noPrint" data-tour="add" onClick={addRow}>
          {order.length ? t("addAt", { t: formatTime(Math.floor(time)) }) : t("addFirst")}
        </button>
      </section>

      {/* 구간 목록 (PC에서는 이 칸만 따로 스크롤) */}
      <div className="ltSide">
      <ol className="ltCues">
        {order.map((id, i) => {
          const r = rows[id];
          if (!r) return null;
          const isCur = id === currentId;
          return (
            <li
              key={id}
              data-tour={i === 0 ? "cue" : undefined}
              className={`ltCue${isCur ? " is-current" : ""}`}
            >
              <div className="ltCue__time">
                <div className="ltCue__range">
                  {timeInput(r, "start")}
                  <span aria-hidden>~</span>
                  <span className="ltCue__to">{endLabel(id)}</span>
                </div>
              </div>
              <button
                type="button"
                className="ltCue__light"
                onClick={() => setPresetFor(id)}
                aria-label={t("changeLightAria", { name: getPresetName(channel, r.preset) })}
              >
                <PresetThumb channel={channel} preset={r.preset} />
              </button>
              <textarea
                className="ltCue__note"
                value={r.note ?? ""}
                placeholder={t("notePh")}
                onChange={(e) => editRow(id, "note", e.target.value)}
                onBlur={() => commitRow(id)}
              />
              <button
                type="button"
                className="ltCue__del noPrint"
                aria-label={t("deleteCue")}
                onClick={() => removeRow(id)}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ol>
      {!order.length ? (
        <p className="ltEmpty">{t("emptyCues")}</p>
      ) : null}

      <div className="ltFooter noPrint">
        <button type="button" className="ltLinkBtn" onClick={() => window.print()}>
          {t("print")}
        </button>
        {isExample ? null : (
          <button type="button" className="ltLinkBtn ltLinkBtn--dim" onClick={removeTeam}>
            {t("deleteTeam")}
          </button>
        )}
      </div>
      </div>

      {tourOpen && !loading ? <LightingTour onClose={closeTour} /> : null}
      {channelOpen ? (
        <ChannelModal
          value={channel}
          onSelect={(c) => commitTeam({ channel: c })}
          onClose={() => setChannelOpen(false)}
        />
      ) : null}
      {presetFor && rows[presetFor] ? (
        <PresetModal
          channel={channel}
          value={rows[presetFor].preset}
          onSelect={(p) => commitRow(presetFor, { preset: p })}
          onClose={() => setPresetFor(null)}
        />
      ) : null}
    </div>
  );
}
