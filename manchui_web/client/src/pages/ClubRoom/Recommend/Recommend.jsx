import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { IoAdd, IoChevronDown, IoSearch } from "react-icons/io5";
import apiClient, { serverUrl } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import RecommendationCard from "./RecommendationCard";
import {
  joinSearchQuery,
  stripTrailingIncompleteHashtag,
} from "./hashtagUtils";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import "./Recommend.css";

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "oldest", label: "오래된 순" },
  { value: "title_asc", label: "제목 가나다순" },
  { value: "title_desc", label: "제목 역순" },
  { value: "likes_desc", label: "좋아요 많은 순" },
  { value: "likes_asc", label: "좋아요 적은 순" },
];

const Recommend = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const modal = useManchuiModal();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("latest");
  const [committedTags, setCommittedTags] = useState([]);
  const [queryRest, setQueryRest] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortWrapRef = useRef(null);

  const sortLabel = useMemo(
    () => SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "정렬",
    [sort],
  );
  const searchInputForApi = useMemo(
    () =>
      joinSearchQuery(committedTags, stripTrailingIncompleteHashtag(queryRest)),
    [committedTags, queryRest],
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInputForApi.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInputForApi]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("sort", sort);
    if (debouncedQ) p.set("q", debouncedQ);
    return p.toString();
  }, [sort, debouncedQ]);

  const load = useCallback(async () => {
    if (!serverUrl) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/api/recommendations${queryString ? `?${queryString}` : ""}`,
        { withCredentials: true },
      );
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sortMenuOpen) return undefined;
    const onDocMouseDown = (e) => {
      if (sortWrapRef.current && !sortWrapRef.current.contains(e.target)) {
        setSortMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setSortMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [sortMenuOpen]);

  const patchItem = (id, patch) => {
    setItems((prev) =>
      prev.map((it) =>
        String(it._id) === String(id) ? { ...it, ...patch } : it,
      ),
    );
  };

  const handleToggleLike = async (item) => {
    if (!user?._id) {
      await modal("로그인 후 이용할 수 있습니다.");
      return;
    }
    const id = item._id;
    setBusyId(id);
    setBusyAction("like");
    try {
      const res = await apiClient.post(
        `/api/recommendations/${id}/like`,
        {},
        { withCredentials: true },
      );
      patchItem(id, {
        likedByMe: res.data?.liked,
        likeCount: res.data?.likeCount ?? item.likeCount,
      });
    } catch (e) {
      await modal(e?.response?.data?.message || "좋아요 처리에 실패했습니다.");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  const handleToggleScrap = async (item) => {
    if (!user?._id) {
      await modal("로그인 후 이용할 수 있습니다.");
      return;
    }
    const id = item._id;
    setBusyId(id);
    setBusyAction("scrap");
    try {
      const res = await apiClient.post(
        `/api/recommendations/${id}/scrap`,
        {},
        { withCredentials: true },
      );
      patchItem(id, {
        scrapedByMe: res.data?.scraped,
        scrapCount: res.data?.scrapCount ?? item.scrapCount,
      });
    } catch (e) {
      await modal(e?.response?.data?.message || "스크랩 처리에 실패했습니다.");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  const removeSearchTag = useCallback((label) => {
    setCommittedTags((prev) =>
      prev.filter((t) => t.toLowerCase() !== label.toLowerCase()),
    );
  }, []);

  const appendTagToSearch = useCallback((rawLabel) => {
    const normalized = String(rawLabel ?? "")
      .replace(/^#+/, "")
      .trim();
    if (!normalized) return;
    setCommittedTags((prev) => {
      if (prev.some((t) => t.toLowerCase() === normalized.toLowerCase())) {
        return prev;
      }
      return [...prev, normalized];
    });
  }, []);

  /**
   * 모바일 가상 키보드는 Space에 대해 keydown/keyup이 안 오거나 key가 비는 경우가 많아,
   * 값이 바뀔 때마다 줄 끝 `#태그␠` 패턴으로 확정한다.
   */
  const handleSearchTextChange = useCallback((e) => {
    const next = e.target.value;
    const m = next.match(/#([^\s#]+)\s$/);
    if (m) {
      const tag = m[1].trim();
      if (tag) {
        const before = next.slice(0, next.lastIndexOf("#")).trimEnd();
        setCommittedTags((prev) => {
          if (prev.some((t) => t.toLowerCase() === tag.toLowerCase())) {
            return prev;
          }
          return [...prev, tag];
        });
        setQueryRest(before);
        return;
      }
    }
    setQueryRest(next);
  }, []);

  /** 입력 줄 끝의 `#태그` 뒤 스페이스/엔터 → 태그 확정(칩으로) · 맨 앞 백스페이스 → 마지막 칩 제거 */
  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === "Backspace") {
      if (e.nativeEvent?.isComposing) return;
      const el = e.currentTarget;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      if (start === 0 && end === 0 && committedTags.length > 0) {
        e.preventDefault();
        setCommittedTags((prev) => prev.slice(0, -1));
      }
      return;
    }

    if (e.key === "Enter" && e.nativeEvent?.isComposing) return;

    const isSpace =
      e.code === "Space" ||
      e.key === " " ||
      e.key === "Spacebar" ||
      (e.key === "" && (e.keyCode === 32 || e.which === 32));
    const isEnter = e.key === "Enter";
    if (!isSpace && !isEnter) return;

    /* 한글 IME: 조합 중 스페이스는 여기서 막지 않고 keyup / onChange에서 `#태그 ` 확정 */
    if (isSpace && e.nativeEvent?.isComposing) return;

    const draft = e.currentTarget.value;
    const m = draft.match(/#([^\s#]+)$/);
    if (!m) return;
    const tag = m[1].trim();
    if (!tag) return;
    e.preventDefault();
    const before = draft.slice(0, draft.lastIndexOf("#")).trimEnd();
    setCommittedTags((prev) => {
      if (prev.some((t) => t.toLowerCase() === tag.toLowerCase())) {
        return prev;
      }
      return [...prev, tag];
    });
    setQueryRest(before);
  }, [committedTags.length]);

  /** IME 조합 후 삽입된 스페이스로 끝나는 `#태그 ` 확정 (keydown에서 못 잡은 경우) */
  const handleSearchKeyUp = useCallback((e) => {
    if (e.nativeEvent?.isComposing) return;
    const isSpace =
      e.code === "Space" ||
      e.key === " " ||
      e.key === "Spacebar" ||
      (e.key === "" && (e.keyCode === 32 || e.which === 32));
    if (!isSpace) return;
    const el = e.currentTarget;
    const v = el.value;
    const sel = el.selectionStart ?? v.length;
    const before = v.slice(0, sel);
    const m = before.match(/#([^\s#]+)\s$/);
    if (!m) return;
    const tag = m[1].trim();
    if (!tag) return;
    const prefix = before.slice(0, before.lastIndexOf("#")).trimEnd();
    const suffix = v.slice(sel);
    setCommittedTags((prev) => {
      if (prev.some((t) => t.toLowerCase() === tag.toLowerCase())) {
        return prev;
      }
      return [...prev, tag];
    });
    setQueryRest([prefix, suffix].filter(Boolean).join(" "));
  }, []);

  return (
    <div className="recommend">
      <div className="recommend__top">
        <h1 className="recommend__title">곡 추천</h1>
      </div>

      <div className="recommend__toolbar" role="search">
        <div className="recommend__searchWrap">
          <IoSearch className="recommend__searchIcon" aria-hidden />
          <div className="recommend__searchFlow">
            {committedTags.length > 0 ? (
              <div className="recommend__searchChips" aria-label="태그 필터">
                {committedTags.map((t) => (
                  <button
                    key={`${t.toLowerCase()}`}
                    type="button"
                    className="recommend__searchChip"
                    onClick={() => removeSearchTag(t)}
                    aria-label={`태그 ${t} 검색에서 제거`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            ) : null}
            <input
              id="recommend-search"
              type="search"
              className="recommend__search recommend__search--plain"
              placeholder={
                committedTags.length
                  ? "제목, 글, 링크…"
                  : "제목·글·링크 검색 — #태그 입력 후 스페이스·엔터로 확정"
              }
              value={queryRest}
              onChange={handleSearchTextChange}
              onKeyDown={handleSearchKeyDown}
              onKeyUp={handleSearchKeyUp}
              enterKeyHint="search"
              aria-label="검색어"
            />
          </div>
        </div>
        <div className="recommend__sort" ref={sortWrapRef}>
          <button
            type="button"
            id="recommend-sort"
            className="recommend__sortTrigger"
            aria-haspopup="listbox"
            aria-expanded={sortMenuOpen}
            aria-controls="recommend-sort-listbox"
            aria-label={`정렬: ${sortLabel}`}
            onClick={() => setSortMenuOpen((v) => !v)}
          >
            <span className="recommend__sortTriggerInner">
              <span className="recommend__sortTriggerValue">{sortLabel}</span>
            </span>
            <IoChevronDown
              className={`recommend__sortChev${sortMenuOpen ? " recommend__sortChev--open" : ""}`}
              aria-hidden
            />
          </button>
          {sortMenuOpen ? (
            <ul
              id="recommend-sort-listbox"
              className="recommend__sortMenu"
              role="listbox"
              aria-label="정렬 방식"
            >
              {SORT_OPTIONS.map((o) => (
                <li
                  key={o.value}
                  className="recommend__sortItem"
                  role="presentation"
                >
                  <button
                    type="button"
                    role="option"
                    className={`recommend__sortOption${sort === o.value ? " recommend__sortOption--active" : ""}`}
                    aria-selected={sort === o.value}
                    onClick={() => {
                      setSort(o.value);
                      setSortMenuOpen(false);
                    }}
                  >
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className="recommend__fab"
        disabled={!user?._id}
        title={user?._id ? "추천 등록" : "로그인 후 등록할 수 있습니다"}
        aria-label="추천 등록"
        onClick={async () => {
          if (!user?._id) {
            await modal("로그인 후 등록할 수 있습니다.");
            return;
          }
          nav("/club/recommend/new");
        }}
      >
        <IoAdd className="recommend__fabIcon" aria-hidden />
      </button>

      {loading ? (
        <div className="recommend__loading">불러오는 중…</div>
      ) : items.length === 0 ? (
        <div className="recommend__empty">표시할 추천이 없습니다.</div>
      ) : (
        <div className="recommend__list">
          {items.map((item) => (
            <RecommendationCard
              key={item._id}
              item={item}
              user={user}
              busyLike={busyId === item._id && busyAction === "like"}
              busyScrap={busyId === item._id && busyAction === "scrap"}
              onToggleLike={handleToggleLike}
              onToggleScrap={handleToggleScrap}
              onTagClick={appendTagToSearch}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommend;
