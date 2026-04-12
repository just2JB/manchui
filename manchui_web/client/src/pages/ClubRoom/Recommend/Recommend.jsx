import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { IoAdd } from "react-icons/io5";
import axios from "axios";
import RecommendationCard from "./RecommendationCard";
import {
  joinSearchQuery,
  stripTrailingIncompleteHashtag,
} from "./hashtagUtils";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import "./Recommend.css";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "oldest", label: "오래된 순" },
  { value: "title_asc", label: "제목 가나다순" },
  { value: "title_desc", label: "제목 역순" },
  { value: "likes_desc", label: "좋아요 많은 순" },
  { value: "likes_asc", label: "좋아요 적은 순" },
];

const Recommend = () => {
  const { user } = useOutletContext();
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
  const searchInputForApi = useMemo(
    () =>
      joinSearchQuery(
        committedTags,
        stripTrailingIncompleteHashtag(queryRest),
      ),
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
      const res = await axios.get(
        `${serverUrl}/api/recommendations${queryString ? `?${queryString}` : ""}`,
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
      const res = await axios.post(
        `${serverUrl}/api/recommendations/${id}/like`,
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
      const res = await axios.post(
        `${serverUrl}/api/recommendations/${id}/scrap`,
        {},
        { withCredentials: true },
      );
      patchItem(id, { scrapedByMe: res.data?.scraped });
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

  const handleSearchTextChange = useCallback((e) => {
    setQueryRest(e.target.value);
  }, []);

  /** 입력 줄 끝의 `#태그` 뒤에 스페이스/엔터 → 태그 확정(칩으로) · 맨 앞에서 백스페이스 → 마지막 칩 제거 */
  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.nativeEvent?.isComposing) return;

      if (e.key === "Backspace") {
        const el = e.currentTarget;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        if (start === 0 && end === 0 && committedTags.length > 0) {
          e.preventDefault();
          setCommittedTags((prev) => prev.slice(0, -1));
        }
        return;
      }

      if (e.key !== " " && e.key !== "Enter") return;
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
    },
    [committedTags.length],
  );

  const handleDeleteItem = async (item) => {
    if (!(await modal("이 추천을 삭제할까요?", "confirm"))) return;
    try {
      await axios.delete(`${serverUrl}/api/recommendations/${item._id}`, {
        withCredentials: true,
      });
      await load();
    } catch (e) {
      await modal(e?.response?.data?.message || "삭제에 실패했습니다.");
    }
  };

  return (
    <div className="recommend">
      <div className="recommend__top">
        <h1 className="recommend__title">곡 추천</h1>
      </div>

      <div className="recommend__toolbar" role="search">
        <div className="recommend__searchWrap">
          {committedTags.length > 0 ? (
            <div
              className="recommend__searchChips"
              aria-label="태그 필터"
            >
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
                : "검색: 제목·글·링크 — #태그 입력 후 스페이스/엔터로 확정"
            }
            value={queryRest}
            onChange={handleSearchTextChange}
            onKeyDown={handleSearchKeyDown}
            enterKeyHint="search"
            aria-label="검색어"
          />
        </div>
        <select
          id="recommend-sort"
          className="recommend__select recommend__select--sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="정렬"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
              onEdit={(item) => nav(`/club/recommend/${item._id}/edit`)}
              onDelete={handleDeleteItem}
              onTagClick={appendTagToSearch}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommend;
