import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import apiClient, { serverUrl } from "../../../api/apiClient";
import RecommendationCard from "../Recommend/RecommendationCard";
import {
  likePatchFromResponse,
  optimisticLikePatch,
  optimisticScrapPatch,
  reactionSnapshot,
  scrapPatchFromResponse,
} from "../Recommend/recommendationReactions";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { useAuth } from "../../../context/AuthContext";
import "../Recommend/Recommend.css";
import "./Mypage.css";

const TITLES = {
  likes: "좋아요한 추천",
  scraps: "스크랩한 추천",
};

const MypageSavedRecommendations = () => {
  const { kind } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const modal = useManchuiModal();

  const validKind = kind === "likes" || kind === "scraps";
  const title = validKind ? TITLES[kind] : "";
  const apiPath = useMemo(() => {
    if (!validKind) return null;
    if (kind === "likes") return "/api/recommendations/mine/likes";
    return "/api/recommendations/mine/scraps";
  }, [kind, validKind]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const load = useCallback(async () => {
    if (!serverUrl || !user?._id || !apiPath) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get(apiPath, { withCredentials: true });
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiPath, user?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const patchOrRemove = (id, patch) => {
    if (patch.remove) {
      setItems((prev) => prev.filter((it) => String(it._id) !== String(id)));
      return;
    }
    setItems((prev) =>
      prev.map((it) => (String(it._id) === String(id) ? { ...it, ...patch } : it)),
    );
  };

  const restoreRemovedItem = (removedItem, removedIndex) => {
    if (!removedItem) return;
    setItems((prev) => {
      if (prev.some((it) => String(it._id) === String(removedItem._id))) {
        return prev;
      }
      const next = [...prev];
      const idx = Math.min(Math.max(removedIndex, 0), next.length);
      next.splice(idx, 0, removedItem);
      return next;
    });
  };

  const handleToggleLike = async (item) => {
    if (!user?._id) {
      await modal("로그인 후 이용할 수 있습니다.");
      return;
    }
    const id = item._id;
    const snapshot = reactionSnapshot(item);
    const optimistic = optimisticLikePatch(item);
    const willRemove = kind === "likes" && !optimistic.likedByMe;
    const removedIndex = willRemove
      ? items.findIndex((it) => String(it._id) === String(id))
      : -1;

    if (willRemove) {
      patchOrRemove(id, { remove: true });
    } else {
      patchOrRemove(id, optimistic);
    }

    setBusyId(id);
    setBusyAction("like");
    try {
      const res = await apiClient.post(
        `/api/recommendations/${id}/like`,
        {},
        { withCredentials: true },
      );
      const liked = Boolean(res.data?.liked);
      if (kind === "likes" && !liked) {
        return;
      }
      if (!willRemove) {
        patchOrRemove(id, likePatchFromResponse(res, { ...item, ...optimistic }));
      }
    } catch (e) {
      if (willRemove) {
        restoreRemovedItem(item, removedIndex);
      } else {
        patchOrRemove(id, {
          likedByMe: snapshot.likedByMe,
          likeCount: snapshot.likeCount,
        });
      }
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
    const snapshot = reactionSnapshot(item);
    const optimistic = optimisticScrapPatch(item);
    const willRemove = kind === "scraps" && !optimistic.scrapedByMe;
    const removedIndex = willRemove
      ? items.findIndex((it) => String(it._id) === String(id))
      : -1;

    if (willRemove) {
      patchOrRemove(id, { remove: true });
    } else {
      patchOrRemove(id, optimistic);
    }

    setBusyId(id);
    setBusyAction("scrap");
    try {
      const res = await apiClient.post(
        `/api/recommendations/${id}/scrap`,
        {},
        { withCredentials: true },
      );
      const scraped = Boolean(res.data?.scraped);
      if (kind === "scraps" && !scraped) {
        return;
      }
      if (!willRemove) {
        patchOrRemove(id, scrapPatchFromResponse(res, { ...item, ...optimistic }));
      }
    } catch (e) {
      if (willRemove) {
        restoreRemovedItem(item, removedIndex);
      } else {
        patchOrRemove(id, {
          scrapedByMe: snapshot.scrapedByMe,
          scrapCount: snapshot.scrapCount,
        });
      }
      await modal(e?.response?.data?.message || "스크랩 처리에 실패했습니다.");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  if (!validKind) {
    return <Navigate to="/club/mypage" replace />;
  }

  return (
    <div className="mypageHub">
      <button
        type="button"
        className="mypageSaved__back"
        onClick={() => nav("/club/mypage")}
      >
        ← 마이페이지
      </button>
      <h1 className="mypageHub__pageTitle">{title}</h1>

      {loading ? (
        <div className="recommend__loading">불러오는 중…</div>
      ) : items.length === 0 ? (
        <div className="recommend__empty">항목이 없습니다.</div>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MypageSavedRecommendations;
