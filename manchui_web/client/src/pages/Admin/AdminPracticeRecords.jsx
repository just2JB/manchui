import React, { useEffect, useMemo, useState } from "react";
import {
  IoChevronBack,
  IoChevronForward,
  IoDownloadOutline,
} from "react-icons/io5";
import apiClient from "../../api/apiClient";
import { authRequestConfig } from "../../api/tokenStorage";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { downloadCsv } from "../Lighting/lightingSheet";
import AdminPlaceCell from "./AdminPlaceCell";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const UNSET = "미확정";

const isUnset = (place) => {
  const value = String(place ?? "").trim();
  return !value || value === UNSET;
};

const won = (value) =>
  value == null ? "—" : `${Math.round(value).toLocaleString("ko-KR")}원`;

/** "14:00–17:00" → 3 (분까지 계산, 30분 = 0.5) */
function practiceDurationHours(time) {
  const match = String(time ?? "").match(
    /(\d{1,2}):(\d{2})\s*[-–~]\s*(\d{1,2}):(\d{2})/,
  );
  if (!match) return 0;
  const start = Number(match[1]) * 60 + Number(match[2]);
  let end = Number(match[3]) * 60 + Number(match[4]);
  if (end <= start) end += 24 * 60;
  return Math.round(((end - start) / 60) * 100) / 100;
}

/** "14:00–17:00" → ["14:00", "17:00"] */
function splitTime(time) {
  const match = String(time ?? "").match(
    /(\d{1,2}:\d{2})\s*[-–~]\s*(\d{1,2}:\d{2})/,
  );
  return match
    ? [match[1].padStart(5, "0"), match[2].padStart(5, "0")]
    : [String(time ?? ""), ""];
}

function formatAssignedAt(raw) {
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** CSV 칸: 쉼표·따옴표·줄바꿈이 있으면 따옴표로 감싼다 */
function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function summarize(rows, keyOf) {
  const map = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    const item = map.get(key) ?? {
      key,
      count: 0,
      hours: 0,
      cost: 0,
      unpriced: 0,
    };
    item.count += 1;
    item.hours += row.hours;
    if (row.cost == null) item.unpriced += 1;
    else item.cost += row.cost;
    map.set(key, item);
  }
  return [...map.values()]
    .map((item) => ({ ...item, hours: Math.round(item.hours * 100) / 100 }))
    .sort(
      (a, b) =>
        b.cost - a.cost ||
        b.hours - a.hours ||
        a.key.localeCompare(b.key, "ko"),
    );
}

const pad2 = (n) => String(n).padStart(2, "0");
const monthStart = (y, m) => `${y}-${pad2(m)}-01`;
const monthEnd = (y, m) =>
  `${y}-${pad2(m)}-${pad2(new Date(y, m, 0).getDate())}`;

/** 장소별 시간당 요금 편집 */
function RateEditor({ placeNames, rates, onSaved }) {
  const modal = useManchuiModal();
  const [draft, setDraft] = useState({});
  const [newPlace, setNewPlace] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(
      Object.fromEntries(
        rates.map((item) => [item.place, String(item.hourlyRate)]),
      ),
    );
  }, [rates]);

  const names = [
    ...new Set([
      ...rates.map((item) => item.place),
      ...placeNames,
      ...Object.keys(draft),
    ]),
  ]
    .filter((name) => name && name !== UNSET && name !== "미정")
    .sort((a, b) => a.localeCompare(b, "ko"));

  const changed = names.some(
    (name) =>
      (draft[name] ?? "") !==
      String(rates.find((item) => item.place === name)?.hourlyRate ?? ""),
  );

  const save = async () => {
    setSaving(true);
    try {
      const payload = names
        .filter((name) => String(draft[name] ?? "").trim() !== "")
        .map((name) => ({ place: name, hourlyRate: Number(draft[name]) || 0 }));
      const res = await apiClient.put(
        "/api/team/admin/place-rates",
        { rates: payload },
        authRequestConfig(),
      );
      onSaved(
        Array.isArray(res.data?.placeRates) ? res.data.placeRates : payload,
      );
    } catch (err) {
      await modal(err.response?.data?.message || "요금을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="aRate">
      <p className="aRate__hint">
        시간당 요금을 넣으면 연습마다 요금 × 시간으로 계산돼요. 비워 두면 요금
        미정이에요.
      </p>
      <ul className="aRate__list">
        {names.map((name) => (
          <li key={name} className="aRate__row">
            <span className="aRate__place">{name}</span>
            <label className="aRate__field">
              <input
                type="text"
                inputMode="numeric"
                className="aRate__input"
                value={draft[name] ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    [name]: event.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 8),
                  }))
                }
                placeholder="0"
                aria-label={`${name} 시간당 요금`}
              />
              <span>원 / 시간</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="aRate__foot">
        <input
          type="text"
          className="aRate__input aRate__newPlace"
          value={newPlace}
          onChange={(event) => setNewPlace(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.nativeEvent.isComposing &&
              newPlace.trim()
            ) {
              setDraft((prev) => ({
                ...prev,
                [newPlace.trim()]: prev[newPlace.trim()] ?? "",
              }));
              setNewPlace("");
            }
          }}
          placeholder="장소 추가 후 Enter"
          maxLength={40}
        />
        <button
          type="button"
          className="aRecord__download"
          onClick={() => void save()}
          disabled={!changed || saving}
        >
          {saving ? "저장 중…" : "요금 저장"}
        </button>
      </div>
    </div>
  );
}

/** 금액 칸: 누르면 이 연습만 금액 직접 입력, 비우고 저장하면 자동 계산으로 */
function CostCell({ row, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (!editing) {
    return (
      <button
        type="button"
        className="aRecord__costBtn"
        data-manual={row.costManual || undefined}
        data-none={row.cost == null || undefined}
        onClick={() => {
          setDraft(row.costManual ? String(row.cost) : "");
          setEditing(true);
        }}
        title={
          row.costManual
            ? "직접 정한 금액 · 눌러서 바꾸기"
            : "자동 계산 · 눌러서 이 연습만 바꾸기"
        }
      >
        {row.cost == null ? (
          <>
            <b className="aRecord__bang" aria-hidden>
              !
            </b>
            요금 미정
          </>
        ) : (
          won(row.cost)
        )}
        {row.costManual ? <span className="aRecord__costTag">직접</span> : null}
      </button>
    );
  }

  const commit = (value) => {
    setEditing(false);
    onSave(value === "" ? null : Number(value));
  };

  return (
    <span className="aRecord__costEdit">
      <input
        type="text"
        inputMode="numeric"
        className="aRate__input"
        value={draft}
        autoFocus
        onChange={(event) =>
          setDraft(event.target.value.replace(/[^0-9]/g, "").slice(0, 8))
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") commit(draft);
          if (event.key === "Escape") setEditing(false);
        }}
        placeholder={row.autoCost != null ? String(row.autoCost) : "금액"}
        aria-label="이 연습 금액"
      />
      <button
        type="button"
        className="aRecord__costOk"
        onClick={() => commit(draft)}
      >
        {draft === "" ? "자동" : "저장"}
      </button>
    </span>
  );
}

/**
 * 연습실 예약 기록: 기간별 표 + 연습마다 금액, 팀별·장소별 합계, CSV(시트) 내려받기
 */
const AdminPracticeRecords = ({
  practices,
  placeRates,
  onRatesSaved,
  onCostSaved,
  /** 연습실 바꾸기 (배정 화면과 같은 저장) */
  onAssignPlace,
  placeSuggestionsFor,
  assignBusy = false,
}) => {
  const modal = useManchuiModal();
  const now = new Date();
  const [mode, setMode] = useState("month");
  const [month, setMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [range, setRange] = useState(() => ({
    from: monthStart(now.getFullYear(), now.getMonth() + 1),
    to: monthEnd(now.getFullYear(), now.getMonth() + 1),
  }));
  const [onlyAssigned, setOnlyAssigned] = useState(true);
  const [showRates, setShowRates] = useState(false);
  /** 고른 팀 id (비어 있으면 모든 팀) */
  const [teamFilter, setTeamFilter] = useState(() => new Set());
  /** 요금 미정인 연습만 보기 */
  const [onlyUnpriced, setOnlyUnpriced] = useState(false);
  /** 연습실을 바꾸는 중인 줄 */
  const [editingPlaceId, setEditingPlaceId] = useState(null);

  const period =
    mode === "month"
      ? {
          from: monthStart(month.year, month.month),
          to: monthEnd(month.year, month.month),
          label: `${month.year}년 ${month.month}월`,
        }
      : {
          from: range.from,
          to: range.to,
          label: `${range.from} ~ ${range.to}`,
        };

  const rateByPlace = useMemo(
    () =>
      new Map(
        placeRates.map((item) => [item.place, Number(item.hourlyRate) || 0]),
      ),
    [placeRates],
  );

  // 기간 안의 모든 연습 (팀·요금 거르기 전)
  const periodRows = useMemo(
    () =>
      practices
        .filter(
          (practice) =>
            practice.dateKey &&
            practice.dateKey >= period.from &&
            practice.dateKey <= period.to,
        )
        .filter((practice) => !onlyAssigned || !isUnset(practice.place))
        .map((practice) => {
          const [y, m, d] = practice.dateKey.split("-").map(Number);
          const [start, end] = splitTime(practice.time);
          const hours = practiceDurationHours(practice.time);
          const place = isUnset(practice.place)
            ? "미정"
            : String(practice.place).trim();
          const rate = rateByPlace.has(place) ? rateByPlace.get(place) : null;
          const autoCost = rate == null ? null : Math.round(rate * hours);
          const costManual = typeof practice.placeCost === "number";
          return {
            id: practice._id,
            teamId: practice.teamId,
            teamColor: practice.color,
            dateKey: practice.dateKey,
            week: WEEK[new Date(y, m - 1, d).getDay()],
            start,
            end,
            hours,
            teamName: practice.teamName,
            memberCount: practice.memberCount ?? 0,
            place,
            rate,
            autoCost,
            cost: costManual ? practice.placeCost : autoCost,
            costManual,
            assignedAt: formatAssignedAt(practice.placeAssignedAt),
            assignedBy: practice.placeAssignedBy ?? "",
            // 연습실은 있는데 임원진 배정 기록이 없으면 팀(곡장)이 직접 정한 것
            byTeam: !isUnset(practice.place) && !practice.placeAssignedAt,
            teamDeleted: Boolean(practice.teamDeleted),
          };
        })
        .sort(
          (a, b) =>
            a.dateKey.localeCompare(b.dateKey) ||
            a.start.localeCompare(b.start),
        ),
    [practices, period.from, period.to, onlyAssigned, rateByPlace],
  );

  // 이 기간에 연습한 팀 (칩 목록)
  const periodTeams = useMemo(() => {
    const map = new Map();
    for (const row of periodRows) {
      const item = map.get(row.teamId) ?? {
        id: row.teamId,
        name: row.teamName,
        color: row.teamColor,
        count: 0,
      };
      item.count += 1;
      map.set(row.teamId, item);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [periodRows]);

  // 다른 기간에서 고른 팀이 이 기간에 없으면 그 팀은 빼고 본다 (다 없으면 모든 팀)
  const activeTeamIds = useMemo(
    () =>
      new Set(
        periodTeams
          .filter((team) => teamFilter.has(team.id))
          .map((team) => team.id),
      ),
    [periodTeams, teamFilter],
  );
  const teamRows = useMemo(
    () =>
      activeTeamIds.size === 0
        ? periodRows
        : periodRows.filter((row) => activeTeamIds.has(row.teamId)),
    [periodRows, activeTeamIds],
  );
  const rows = useMemo(
    () =>
      onlyUnpriced ? teamRows.filter((row) => row.cost == null) : teamRows,
    [teamRows, onlyUnpriced],
  );

  const toggleTeam = (id) =>
    setTeamFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const filterLabel = periodTeams
    .filter((team) => activeTeamIds.has(team.id))
    .map((team) => team.name)
    .join(", ");

  const byTeam = useMemo(() => summarize(rows, (row) => row.teamName), [rows]);
  const byPlace = useMemo(() => summarize(rows, (row) => row.place), [rows]);
  const totalHours =
    Math.round(rows.reduce((sum, row) => sum + row.hours, 0) * 100) / 100;
  const totalCost = rows.reduce((sum, row) => sum + (row.cost ?? 0), 0);
  // 요금 미정은 '요금 미정만' 보기와 상관없이 고른 팀 기준으로 센다
  const unpricedCount = teamRows.filter((row) => row.cost == null).length;
  const placeNames = [
    ...new Set(
      practices.map((p) => (isUnset(p.place) ? "" : String(p.place).trim())),
    ),
  ];

  const moveMonth = (delta) => {
    setMonth((prev) => {
      const date = new Date(prev.year, prev.month - 1 + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() + 1 };
    });
  };

  const saveCost = async (id, cost) => {
    try {
      const res = await apiClient.post(
        "/api/team/admin/practices/cost",
        { practiceIds: [id], cost },
        authRequestConfig(),
      );
      onCostSaved([id], res.data?.placeCost ?? null);
    } catch (err) {
      await modal(err.response?.data?.message || "금액을 저장하지 못했습니다.");
    }
  };

  const handleDownload = () => {
    const header = [
      "날짜",
      "요일",
      "시작",
      "끝",
      "시간(h)",
      "팀",
      "인원",
      "장소",
      "시간당 요금",
      "금액",
      "금액 기준",
      "배정 일시",
      "배정자",
    ];
    const table = rows.map((row) => [
      row.dateKey,
      row.week,
      row.start,
      row.end,
      row.hours,
      row.teamDeleted ? `${row.teamName} (삭제된 팀)` : row.teamName,
      row.memberCount,
      row.place,
      row.rate ?? "",
      row.cost ?? "",
      row.costManual ? "직접 입력" : row.cost == null ? "요금 미정" : "자동",
      row.byTeam ? "" : row.assignedAt,
      row.byTeam ? "팀 지정" : row.assignedBy,
    ]);
    const sumHeader = ["", "연습 수", "시간(h)", "금액", "요금 미정"];
    const lines = [
      [
        `${period.label} 연습실 예약 결산${filterLabel ? ` (${filterLabel})` : ""}${onlyUnpriced ? " - 요금 미정만" : ""}`,
      ],
      [],
      header,
      ...table,
      [],
      ["팀별 사용 금액"],
      ["팀", ...sumHeader.slice(1)],
      ...byTeam.map((item) => [
        item.key,
        item.count,
        item.hours,
        item.cost,
        item.unpriced,
      ]),
      [],
      ["장소별 사용 금액"],
      ["장소", ...sumHeader.slice(1)],
      ...byPlace.map((item) => [
        item.key,
        item.count,
        item.hours,
        item.cost,
        item.unpriced,
      ]),
      [],
      ["전체", rows.length, totalHours, totalCost, unpricedCount],
    ];
    const name =
      mode === "month"
        ? `${month.year}-${pad2(month.month)}`
        : `${period.from}_${period.to}`;
    const teamPart = filterLabel
      ? `_${filterLabel.replace(/[\\/:*?"<>|,\s]+/g, "-")}`
      : "";
    downloadCsv(`연습실예약결산_${name}${teamPart}.csv`, toCsv(lines));
  };

  return (
    <div className="aRecord">
      <div className="aRecord__bar">
        <div className="aPlace__views" role="tablist" aria-label="기간 고르기">
          {[
            ["month", "월별"],
            ["range", "기간"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              className="aPlace__view"
              onClick={() => setMode(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === "month" ? (
          <div className="aRecord__month">
            <button
              type="button"
              className="aRecord__monthBtn"
              onClick={() => moveMonth(-1)}
              aria-label="이전 달"
            >
              <IoChevronBack aria-hidden />
            </button>
            <span className="aRecord__monthLabel">{period.label}</span>
            <button
              type="button"
              className="aRecord__monthBtn"
              onClick={() => moveMonth(1)}
              aria-label="다음 달"
            >
              <IoChevronForward aria-hidden />
            </button>
          </div>
        ) : (
          <div className="aRecord__range">
            <input
              type="date"
              className="aRate__input"
              value={range.from}
              max={range.to}
              onChange={(event) =>
                setRange((prev) => ({ ...prev, from: event.target.value }))
              }
              aria-label="시작 날짜"
            />
            <span aria-hidden>~</span>
            <input
              type="date"
              className="aRate__input"
              value={range.to}
              min={range.from}
              onChange={(event) =>
                setRange((prev) => ({ ...prev, to: event.target.value }))
              }
              aria-label="끝 날짜"
            />
          </div>
        )}
        <label className="aRecord__toggle">
          <input
            type="checkbox"
            checked={onlyAssigned}
            onChange={(event) => setOnlyAssigned(event.target.checked)}
          />
          장소 정해진 것만
        </label>
        <div className="aRecord__barEnd">
          <button
            type="button"
            className="aPlace__copy"
            onClick={() => setShowRates((v) => !v)}
            aria-expanded={showRates}
          >
            연습실별 요금
          </button>
          <button
            type="button"
            className="aRecord__download"
            onClick={handleDownload}
            disabled={rows.length === 0}
          >
            <IoDownloadOutline aria-hidden />
            시트로 받기
          </button>
        </div>
      </div>

      {periodTeams.length > 0 ? (
        <div className="aRecord__teams" role="group" aria-label="팀으로 거르기">
          <button
            type="button"
            className={`aPlace__teamChip${activeTeamIds.size === 0 ? " aPlace__teamChip--on" : ""}`}
            onClick={() => setTeamFilter(new Set())}
          >
            모든 팀
          </button>
          {periodTeams.map((team) => (
            <button
              key={team.id}
              type="button"
              className={`aPlace__teamChip${activeTeamIds.has(team.id) ? " aPlace__teamChip--on" : ""}`}
              style={{ "--team": team.color }}
              aria-pressed={activeTeamIds.has(team.id)}
              onClick={() => toggleTeam(team.id)}
            >
              <i aria-hidden />
              {team.name}
              <span className="aRecord__teamCount">{team.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      {showRates ? (
        <RateEditor
          placeNames={placeNames}
          rates={placeRates}
          onSaved={onRatesSaved}
        />
      ) : null}

      <div className="aRecord__stats">
        <div className="aRecord__stat">
          <span>연습</span>
          <strong>{rows.length}회</strong>
        </div>
        <div className="aRecord__stat">
          <span>총 시간</span>
          <strong>{totalHours}시간</strong>
        </div>
        <div className="aRecord__stat aRecord__stat--money">
          <span>총 금액{filterLabel ? ` · ${filterLabel}` : ""}</span>
          <strong>{won(totalCost)}</strong>
        </div>
        {/* 요금 미정: 누르면 그것만 보기 */}
        <button
          type="button"
          className="aRecord__stat aRecord__stat--warn"
          data-active={onlyUnpriced || undefined}
          data-zero={unpricedCount === 0 || undefined}
          onClick={() => setOnlyUnpriced((v) => !v)}
          aria-pressed={onlyUnpriced}
          disabled={unpricedCount === 0 && !onlyUnpriced}
        >
          <span>
            {onlyUnpriced ? "요금 미정만 보는 중 · 눌러서 전체" : "요금 미정"}
          </span>
          <strong>{unpricedCount}건</strong>
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="aRecord__empty">
          {onlyUnpriced
            ? "요금 미정인 연습이 없어요."
            : "이 기간에 기록된 연습이 없어요."}
        </p>
      ) : (
        <>
          <div className="aRecord__sums">
            {[
              ["팀별 사용 금액", byTeam],
              ["장소별 사용 금액", byPlace],
            ].map(([title, list]) => (
              <section key={title} className="aRecord__sum">
                <h2 className="aRecord__sumTitle">{title}</h2>
                <table className="aRecord__table aRecord__table--sum">
                  <tbody>
                    {list.map((item) => (
                      <tr key={item.key}>
                        <td>{item.key}</td>
                        <td className="aRecord__num aRecord__muted">
                          {item.count}회 · {item.hours}h
                        </td>
                        <td className="aRecord__num aRecord__money">
                          {won(item.cost)}
                          {item.unpriced > 0 ? (
                            <small> +미정 {item.unpriced}</small>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>

          <div className="aRecord__tableWrap">
            <table className="aRecord__table">
              <thead>
                <tr>
                  <th scope="col">날짜</th>
                  <th scope="col">시간</th>
                  <th scope="col" className="aRecord__num">
                    h
                  </th>
                  <th scope="col">팀</th>
                  <th scope="col">장소</th>
                  <th scope="col" className="aRecord__num">
                    금액
                  </th>
                  <th scope="col">배정</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    data-unpriced={row.cost == null || undefined}
                  >
                    <td className="aRecord__nowrap">
                      {row.dateKey.slice(5).replace("-", "/")} ({row.week})
                    </td>
                    <td className="aRecord__nowrap">
                      {row.start}–{row.end}
                    </td>
                    <td className="aRecord__num">{row.hours}</td>
                    <td>
                      {row.teamName}
                      {row.teamDeleted ? (
                        <span className="aRecord__deletedTeam">삭제된 팀</span>
                      ) : null}
                      <span className="aRecord__muted">
                        {" "}
                        · {row.memberCount}명
                      </span>
                    </td>
                    <td
                      data-unset={row.place === "미정" || undefined}
                      className="aPlace__colPlace"
                    >
                      {editingPlaceId === row.id ? (
                        <AdminPlaceCell
                          value={row.place === "미정" ? "" : row.place}
                          suggestions={
                            placeSuggestionsFor
                              ? placeSuggestionsFor(row.teamId)
                              : []
                          }
                          busy={assignBusy}
                          onSave={async (place) => {
                            await onAssignPlace?.(row.id, place);
                            setEditingPlaceId(null);
                          }}
                          onCancel={() => setEditingPlaceId(null)}
                        />
                      ) : (
                        <button
                          type="button"
                          className="aPlace__cellBtn"
                          data-unset={row.place === "미정" || undefined}
                          onClick={() => setEditingPlaceId(row.id)}
                          title="눌러서 연습실 바꾸기"
                          disabled={!onAssignPlace}
                        >
                          <span>
                            {row.place === "미정"
                              ? "+ 연습실 정하기"
                              : row.place}
                          </span>
                          {row.byTeam ? (
                            <em
                              className="aRecord__byTeam"
                              style={{ "--team": row.teamColor }}
                            >
                              팀 지정
                            </em>
                          ) : null}
                        </button>
                      )}
                    </td>
                    <td className="aRecord__num">
                      <CostCell
                        row={row}
                        onSave={(cost) => void saveCost(row.id, cost)}
                      />
                    </td>
                    <td className="aRecord__muted">
                      {row.byTeam ? (
                        <span className="aRecord__byTeamText">
                          {row.teamName}에서 직접
                        </span>
                      ) : (
                        <>
                          {row.assignedBy ? `${row.assignedBy} · ` : ""}
                          {row.assignedAt ? row.assignedAt.slice(5) : ""}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPracticeRecords;
