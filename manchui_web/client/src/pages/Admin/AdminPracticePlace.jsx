import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  IoCheckmark,
  IoClipboardOutline,
  IoLocationOutline,
  IoWarningOutline,
} from "react-icons/io5";
import apiClient, { serverUrl } from "../../api/apiClient";
import { authRequestConfig } from "../../api/tokenStorage";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import {
  formatDateKey,
  formatPracticeTimeShort,
  normalizeDateKey,
} from "../ClubRoom/Team/teamCalendarUtils";
import { parsePracticeHourRange } from "../ClubRoom/Team/practiceAvailabilityUtils";
import { toVisibleTeamColor } from "../ClubRoom/Team/teamColorPresets";
import AdminPracticeRecords from "./AdminPracticeRecords";
import "./adminList.css";
import "./AdminPracticePlace.css";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const UNSET = "미확정";

const isUnset = (place) => {
  const value = String(place ?? "").trim();
  return !value || value === UNSET;
};

function formatDateHead(dateKey, todayKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const diff = Math.round((date - new Date(todayKey + "T00:00")) / 86400000);
  const rel =
    diff === 0 ? "오늘" : diff === 1 ? "내일" : diff === 2 ? "모레" : "";
  return {
    label: `${m}월 ${d}일 (${WEEK[date.getDay()]})`,
    rel,
    weekend: date.getDay() === 0 || date.getDay() === 6,
  };
}

function rangesOverlap(a, b) {
  return a && b && a.startHour <= b.endHour && b.startHour <= a.endHour;
}

/**
 * 장소 고르기: 이 팀 지난번 장소 → 자주 쓴 장소 칩, 직접 입력, Enter 로 적용
 */
function PlacePicker({
  suggestions,
  initial = "",
  onApply,
  onCancel,
  busy,
  applyLabel = "적용",
  autoFocus = true,
}) {
  const [draft, setDraft] = useState(initial);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <div className="aPlace__picker">
      {suggestions.length > 0 ? (
        <div className="aPlace__chips">
          {suggestions.map(({ place, hint }) => (
            <button
              key={place}
              type="button"
              className="aPlace__chip"
              onClick={() => onApply(place)}
              disabled={busy}
              title={`${place}(으)로 바로 지정`}
            >
              {place}
              {hint ? <span className="aPlace__chipHint">{hint}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div className="aPlace__inputRow">
        <input
          ref={inputRef}
          type="text"
          className="aPlace__input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.nativeEvent.isComposing &&
              draft.trim()
            ) {
              event.preventDefault();
              onApply(draft.trim());
            }
            if (event.key === "Escape") onCancel?.();
          }}
          placeholder="장소 직접 입력 후 Enter"
          maxLength={40}
          disabled={busy}
        />
        <button
          type="button"
          className="aPlace__apply"
          onClick={() => onApply(draft.trim())}
          disabled={busy || !draft.trim()}
        >
          {applyLabel}
        </button>
      </div>
      <div className="aPlace__pickerFoot">
        <button
          type="button"
          className="aPlace__textBtn"
          onClick={() => onApply("")}
          disabled={busy}
        >
          미정으로 되돌리기
        </button>
        {onCancel ? (
          <button
            type="button"
            className="aPlace__textBtn"
            onClick={onCancel}
            disabled={busy}
          >
            닫기
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** embedded: 팀 관리 안에 들어갈 때 (큰 제목 없이) */
const AdminPracticePlace = ({ embedded = false }) => {
  const modal = useManchuiModal();
  const [practices, setPractices] = useState([]);
  const [places, setPlaces] = useState([]);
  /** 장소별 시간당 요금 [{ place, hourlyRate }] */
  const [placeRates, setPlaceRates] = useState([]);
  const [pinnedTeamIds, setPinnedTeamIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending");
  const [teamFilter, setTeamFilter] = useState("all");
  const [selected, setSelected] = useState(() => new Set());
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [flashIds, setFlashIds] = useState(() => new Set());
  /** 배정(앞으로 연습에 장소 정하기) / 기록(달별 표·시트) */
  const [view, setView] = useState("assign");

  const todayKey = formatDateKey(new Date());

  const load = useCallback(async () => {
    if (!serverUrl) {
      setError("서버 URL이 설정되지 않았습니다.");
      setLoading(false);
      return;
    }
    setError("");
    try {
      const res = await apiClient.get(
        "/api/team/admin/practices",
        authRequestConfig(),
      );
      setPractices(
        Array.isArray(res.data?.practices) ? res.data.practices : [],
      );
      setPlaces(Array.isArray(res.data?.places) ? res.data.places : []);
      setPlaceRates(Array.isArray(res.data?.placeRates) ? res.data.placeRates : []);
      setPinnedTeamIds(Array.isArray(res.data?.pinnedTeamIds) ? res.data.pinnedTeamIds : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "연습 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 날짜·시간 정리
  const enriched = useMemo(
    () =>
      practices
        .map((practice) => ({
          ...practice,
          dateKey: normalizeDateKey(practice.date),
          range: parsePracticeHourRange(practice.time),
          color: toVisibleTeamColor(practice.teamColor),
        }))
        .filter((practice) => practice.dateKey),
    [practices],
  );

  const upcoming = useMemo(
    () =>
      enriched
        .filter((practice) => practice.dateKey >= todayKey)
        .sort((a, b) =>
          a.dateKey !== b.dateKey
            ? a.dateKey.localeCompare(b.dateKey)
            : (a.range?.startHour ?? 0) - (b.range?.startHour ?? 0),
        ),
    [enriched, todayKey],
  );

  // 팀마다 지난번(오늘 이전) 연습 장소. 지난 기록이 없으면 이미 잡힌 앞으로의 장소라도
  const lastPlaceByTeam = useMemo(() => {
    const map = new Map();
    const withPlace = enriched.filter((practice) => !isUnset(practice.place));
    const past = withPlace
      .filter((practice) => practice.dateKey < todayKey)
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    const future = withPlace
      .filter((practice) => practice.dateKey >= todayKey)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    for (const practice of [...past, ...future]) {
      if (!map.has(practice.teamId)) map.set(practice.teamId, String(practice.place).trim());
    }
    return map;
  }, [enriched, todayKey]);

  // 같은 날 같은 장소, 시간이 겹치는 연습
  const conflictsById = useMemo(() => {
    const map = new Map();
    const byDate = new Map();
    for (const practice of upcoming) {
      if (isUnset(practice.place)) continue;
      const list = byDate.get(practice.dateKey) ?? [];
      list.push(practice);
      byDate.set(practice.dateKey, list);
    }
    for (const list of byDate.values()) {
      for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
          const a = list[i];
          const b = list[j];
          if (String(a.place).trim() !== String(b.place).trim()) continue;
          if (!rangesOverlap(a.range, b.range)) continue;
          map.set(a._id, [...(map.get(a._id) ?? []), b.teamName]);
          map.set(b._id, [...(map.get(b._id) ?? []), a.teamName]);
        }
      }
    }
    return map;
  }, [upcoming]);

  const teams = useMemo(() => {
    const map = new Map();
    for (const practice of upcoming) {
      if (!map.has(practice.teamId))
        map.set(practice.teamId, {
          id: practice.teamId,
          name: practice.teamName,
          color: practice.color,
        });
    }
    const rank = (team) => {
      const index = pinnedTeamIds.indexOf(team.id);
      return index === -1 ? Infinity : index;
    };
    return [...map.values()]
      .map((team) => ({ ...team, pinned: pinnedTeamIds.includes(team.id) }))
      .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "ko"));
  }, [upcoming, pinnedTeamIds]);

  const pendingCount = upcoming.filter((practice) =>
    isUnset(practice.place),
  ).length;
  const conflictCount = upcoming.filter((practice) =>
    conflictsById.has(practice._id),
  ).length;

  const visible = useMemo(
    () =>
      upcoming.filter((practice) => {
        if (teamFilter !== "all" && practice.teamId !== teamFilter)
          return false;
        if (filter === "pending") return isUnset(practice.place);
        if (filter === "conflict") return conflictsById.has(practice._id);
        return true;
      }),
    [upcoming, filter, teamFilter, conflictsById],
  );

  const groups = useMemo(() => {
    const list = [];
    for (const practice of visible) {
      let group = list[list.length - 1];
      if (!group || group.dateKey !== practice.dateKey) {
        group = { dateKey: practice.dateKey, items: [] };
        list.push(group);
      }
      group.items.push(practice);
    }
    return list;
  }, [visible]);

  // 칩 순서: 이 팀 지난번 장소(있으면 맨 앞) → 자주 쓴 장소
  const suggestionsFor = (teamId) => {
    const last = teamId ? lastPlaceByTeam.get(teamId) : null;
    const list = [];
    if (last) list.push({ place: last, hint: "지난번" });
    for (const { place } of places) {
      if (place !== last) list.push({ place, hint: "" });
    }
    return list.slice(0, 10);
  };

  /** 지정하면 생길 겹침 미리 확인 */
  const findNewConflicts = (ids, place) => {
    if (isUnset(place)) return [];
    const targets = upcoming.filter((practice) => ids.includes(practice._id));
    const others = upcoming.filter(
      (practice) =>
        !ids.includes(practice._id) &&
        String(practice.place ?? "").trim() === place,
    );
    const hits = [];
    for (const target of targets) {
      for (const other of [
        ...others,
        ...targets.filter((t) => t._id !== target._id),
      ]) {
        if (
          other.dateKey === target.dateKey &&
          rangesOverlap(other.range, target.range)
        ) {
          hits.push(
            `${formatDateHead(target.dateKey, todayKey).label} ${target.teamName} ↔ ${other.teamName}`,
          );
        }
      }
    }
    return [...new Set(hits)];
  };

  const assign = async (ids, rawPlace) => {
    const place = String(rawPlace ?? "").trim();
    if (ids.length === 0 || busy) return;
    const conflicts = findNewConflicts(ids, place);
    if (
      conflicts.length > 0 &&
      !(await modal(
        `같은 시간에 '${place}'을(를) 쓰는 연습이 있어요.\n\n${conflicts.slice(0, 5).join("\n")}${conflicts.length > 5 ? `\n외 ${conflicts.length - 5}건` : ""}\n\n그래도 지정할까요?`,
        "confirm",
      ))
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await apiClient.post(
        "/api/team/admin/practices/place",
        { practiceIds: ids, place },
        authRequestConfig(),
      );
      const saved = res.data?.place ?? (place || UNSET);
      const assignedAt = res.data?.placeAssignedAt ?? null;
      const assignedBy = res.data?.placeAssignedBy ?? null;
      setPractices((prev) =>
        prev.map((practice) =>
          ids.includes(practice._id)
            ? {
                ...practice,
                place: saved,
                placeAssignedAt: assignedAt,
                placeAssignedBy: assignedBy,
              }
            : practice,
        ),
      );
      if (!isUnset(saved) && !places.some((item) => item.place === saved)) {
        setPlaces((prev) => [...prev, { place: saved, count: ids.length }]);
      }
      setEditingId(null);
      setSelected(new Set());
      setFlashIds(new Set(ids));
      window.setTimeout(() => setFlashIds(new Set()), 1400);
    } catch (err) {
      await modal(err.response?.data?.message || "장소 지정에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (items) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = items.every((item) => next.has(item._id));
      for (const item of items) {
        if (allOn) next.delete(item._id);
        else next.add(item._id);
      }
      return next;
    });
  };

  // 단체방 공지용: 팀별로 묶고, 연습마다 "11/25(화) 19-21 동방" 한 줄
  const copyNotice = async () => {
    const byTeam = new Map();
    for (const practice of visible) {
      const list = byTeam.get(practice.teamId) ?? { name: practice.teamName, items: [] };
      list.items.push(practice);
      byTeam.set(practice.teamId, list);
    }
    const lines = [];
    for (const { name, items } of byTeam.values()) {
      lines.push(`[${name}]`);
      for (const practice of items) {
        const [, m, d] = practice.dateKey.split("-").map(Number);
        const week = WEEK[new Date(practice.dateKey + "T00:00").getDay()];
        const place = isUnset(practice.place) ? "장소 미정" : String(practice.place).trim();
        lines.push(`${m}/${d}(${week}) ${formatPracticeTimeShort(practice.time)} ${place}`);
      }
      lines.push("");
    }
    const text = lines.join("\n").trim();
    if (!text) {
      await modal("복사할 연습이 없습니다.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      await modal("연습실 예약 공지를 복사했어요.");
    } catch {
      await modal(text);
    }
  };

  const selectedIds = [...selected].filter((id) =>
    visible.some((practice) => practice._id === id),
  );
  const selectedTeamIds = new Set(
    upcoming.filter((p) => selected.has(p._id)).map((p) => p.teamId),
  );
  const bulkSuggestions = suggestionsFor(
    selectedTeamIds.size === 1 ? [...selectedTeamIds][0] : null,
  );

  return (
    <div className="aPlace">
      <div className={`aPlace__head${embedded ? " aPlace__head--embedded" : ""}`}>
        {embedded ? <span /> : <h1 className="admin-page-heading">연습실 예약</h1>}
        <div className="aPlace__headTools">
          <div
            className="aPlace__views"
            role="tablist"
            aria-label="화면 바꾸기"
          >
            {[
              ["assign", "배정"],
              ["records", "기록"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={view === value}
                className="aPlace__view"
                onClick={() => {
                  setView(value);
                  setSelected(new Set());
                  setEditingId(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {view === "assign" ? (
            <button
              type="button"
              className="aPlace__copy"
              onClick={() => void copyNotice()}
            >
              <IoClipboardOutline aria-hidden />
              공지용 복사
            </button>
          ) : null}
        </div>
      </div>

      {view === "records" ? (
        loading ? (
          <p className="aPlace__status">불러오는 중…</p>
        ) : error ? (
          <p className="aPlace__status aPlace__status--error">{error}</p>
        ) : (
          <AdminPracticeRecords
            practices={enriched}
            placeRates={placeRates}
            onRatesSaved={setPlaceRates}
            onCostSaved={(ids, cost) =>
              setPractices((prev) =>
                prev.map((practice) =>
                  ids.includes(practice._id) ? { ...practice, placeCost: cost } : practice,
                ),
              )
            }
          />
        )
      ) : (
        <>
          <div className="aList__tabs" role="tablist" aria-label="연습 보기">
            {[
              ["pending", "연습실 미정", pendingCount],
              ["conflict", "시간 겹침", conflictCount],
              ["all", "전체", upcoming.length],
            ].map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                className="aList__tab"
                data-alert={
                  value === "conflict" && count > 0 ? true : undefined
                }
                onClick={() => {
                  setFilter(value);
                  setSelected(new Set());
                  setEditingId(null);
                }}
              >
                {label}
                <span>{count}</span>
              </button>
            ))}
          </div>

          {teams.length > 1 ? (
            <div
              className="aPlace__teams"
              role="group"
              aria-label="팀으로 거르기"
            >
              <button
                type="button"
                className={`aPlace__teamChip${teamFilter === "all" ? " aPlace__teamChip--on" : ""}`}
                onClick={() => {
              setTeamFilter("all");
              setSelected(new Set());
            }}
              >
                모든 팀
              </button>
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  className={`aPlace__teamChip${teamFilter === team.id ? " aPlace__teamChip--on" : ""}`}
                  style={{ "--team": team.color }}
                  onClick={() => {
                    setTeamFilter(teamFilter === team.id ? "all" : team.id);
                    setSelected(new Set());
                  }}
                >
                  <i aria-hidden />
                  {team.pinned ? "📌 " : ""}
                  {team.name}
                </button>
              ))}
            </div>
          ) : null}

          {loading ? (
            <p className="aPlace__status">불러오는 중…</p>
          ) : error ? (
            <p className="aPlace__status aPlace__status--error">{error}</p>
          ) : groups.length === 0 ? (
            <div className="aPlace__done">
              <IoCheckmark aria-hidden />
              <p>
                {filter === "pending"
                  ? "장소를 정할 연습이 없어요. 모두 배정됐어요."
                  : filter === "conflict"
                    ? "겹치는 연습이 없어요."
                    : "다가오는 연습이 없어요."}
              </p>
            </div>
          ) : (
            <div className="aPlace__flat">
              {/* 한 줄에 날짜 · 시간 · 팀 · 장소, 날짜·시간 순 */}
              <div className="aPlace__listHead" aria-hidden="true">
                <span />
                <span>날짜</span>
                <span>시간</span>
                <span>팀</span>
                <span>장소</span>
              </div>
              <ul className="aPlace__list">
                <li className="aPlace__selectAll">
                  <label className="aPlace__check">
                    <input
                      type="checkbox"
                      checked={visible.length > 0 && visible.every((item) => selected.has(item._id))}
                      onChange={() => toggleGroup(visible)}
                      aria-label="보이는 연습 모두 선택"
                    />
                    <span aria-hidden />
                  </label>
                  <span>보이는 {visible.length}개 모두 선택</span>
                </li>
                {visible.map((practice, index) => {
                  const unset = isUnset(practice.place);
                  const conflict = conflictsById.get(practice._id);
                  const editing = editingId === practice._id;
                  const [, m, d] = practice.dateKey.split("-").map(Number);
                  const head = formatDateHead(practice.dateKey, todayKey);
                  const newDay = index > 0 && visible[index - 1].dateKey !== practice.dateKey;
                  return (
                    <li
                      key={practice._id}
                      className="aPlace__row"
                      data-newday={newDay || undefined}
                      data-selected={selected.has(practice._id) || undefined}
                      data-flash={flashIds.has(practice._id) || undefined}
                      style={{ "--team": practice.color }}
                    >
                      <div className="aPlace__rowMain">
                        <label className="aPlace__check">
                          <input
                            type="checkbox"
                            checked={selected.has(practice._id)}
                            onChange={() => toggleSelect(practice._id)}
                            aria-label={`${head.label} ${practice.teamName} ${formatPracticeTimeShort(practice.time)} 선택`}
                          />
                          <span aria-hidden />
                        </label>
                        <span className="aPlace__date" data-weekend={head.weekend || undefined}>
                          {m}/{d}
                          <small>({WEEK[new Date(practice.dateKey + "T00:00").getDay()]})</small>
                          {head.rel ? <span className="aPlace__rel">{head.rel}</span> : null}
                        </span>
                        <span className="aPlace__time">{formatPracticeTimeShort(practice.time)}</span>
                        <span className="aPlace__team">
                          <i aria-hidden />
                          <span>{practice.teamName}</span>
                          <small>{practice.memberCount}명</small>
                        </span>
                        <button
                          type="button"
                          className="aPlace__placeBtn"
                          data-unset={unset || undefined}
                          data-conflict={conflict ? true : undefined}
                          data-by-team={(!unset && !practice.placeAssignedAt) || undefined}
                          onClick={() => setEditingId(editing ? null : practice._id)}
                          aria-expanded={editing}
                        >
                          {conflict ? <IoWarningOutline aria-hidden /> : <IoLocationOutline aria-hidden />}
                          <span>{unset ? "연습실 정하기" : String(practice.place).trim()}</span>
                          {!unset && !practice.placeAssignedAt ? (
                            <em className="aPlace__byTeam" title="팀(곡장)이 직접 정한 연습실">팀</em>
                          ) : null}
                        </button>
                      </div>
                      {conflict ? (
                        <p className="aPlace__conflict">
                          같은 시간 같은 장소: {[...new Set(conflict)].join(", ")}
                        </p>
                      ) : null}
                      {editing ? (
                        <PlacePicker
                          suggestions={suggestionsFor(practice.teamId)}
                          initial={unset ? "" : String(practice.place).trim()}
                          busy={busy}
                          onApply={(place) => void assign([practice._id], place)}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}

      {/* 여러 개 고르면 아래에 한 번에 지정하는 바 */}
      {view === "assign" && selectedIds.length > 0 ? (
        <div
          className="aPlace__bulk"
          role="region"
          aria-label="선택한 연습에 연습실 한 번에 지정"
        >
          <div className="aPlace__bulkHead">
            <strong>{selectedIds.length}개 선택</strong>
            <button
              type="button"
              className="aPlace__textBtn"
              onClick={() => setSelected(new Set())}
            >
              선택 해제
            </button>
          </div>
          <PlacePicker
            key={selectedIds.join(",")}
            suggestions={bulkSuggestions}
            busy={busy}
            applyLabel={`${selectedIds.length}개에 지정`}
            autoFocus={false}
            onApply={(place) => void assign(selectedIds, place)}
          />
        </div>
      ) : null}
    </div>
  );
};

export default AdminPracticePlace;
