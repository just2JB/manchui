import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Navigate,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import axios from "axios";
import RecommendationCard from "../Recommend/RecommendationCard";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import "../Recommend/Recommend.css";
import "./Mypage.css";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const TITLES = {
  likes: "좋아요한 추천",
  scraps: "스크랩한 추천",
};

const MypageSavedRecommendations = () => {
  const { kind } = useParams();
  const nav = useNavigate();
  const { user } = useOutletContext();
  const modal = useManchuiModal();

  const validKind = kind === "likes" || kind === "scraps";
  const title = validKind ? TITLES[kind] : "";
  const apiPath = useMemo(() => {
    if (!validKind || !serverUrl) return null;
    if (kind === "likes") return `${serverUrl}/api/recommendations/mine/likes`;
    return `${serverUrl}/api/recommendations/mine/scraps`;
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
      const res = await axios.get(apiPath, { withCredentials: true });
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
      const res = await axios.post(
        `${serverUrl}/api/recommendations/${id}/like`,
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
      const res = await axios.post(
        `${serverUrl}/api/recommendations/${id}/scrap`,
        {},
        { withCredentials: true },
      );
      const scraped = res.data?.scraped;
      if (kind === "scraps" && !scraped) {
        patchOrRemove(id, { remove: true });
      } else {
        patchOrRemove(id, { scrapedByMe: scraped });
      }
    } catch (e) {
      await modal(e?.response?.data?.message || "스크랩 처리에 실패했습니다.");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

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
              onEdit={(item) => nav(`/club/recommend/${item._id}/edit`)}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MypageSavedRecommendations;
