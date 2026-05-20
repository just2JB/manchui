import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import apiClient, { serverUrl } from "../../../api/apiClient";
import RecommendationCard from "../Recommend/RecommendationCard";
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
      const liked = res.data?.liked;
      const nextLikeCount = res.data?.likeCount ?? item.likeCount;
      if (kind === "likes" && !liked) {
        patchOrRemove(id, { remove: true });
      } else {
        patchOrRemove(id, {
          likedByMe: liked,
          likeCount: nextLikeCount,
        });
      }
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
      const scraped = res.data?.scraped;
      const scrapCount = res.data?.scrapCount;
      if (kind === "scraps" && !scraped) {
        patchOrRemove(id, { remove: true });
      } else {
        patchOrRemove(id, {
          scrapedByMe: scraped,
          ...(scrapCount != null ? { scrapCount } : {}),
        });
      }
    } catch (e) {
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
