import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient, { serverUrl } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import {
  IoBookmark,
  IoBookmarkOutline,
  IoChevronBack,
  IoEllipsisVertical,
  IoHeart,
  IoHeartOutline,
  IoOpenOutline,
} from "react-icons/io5";
import InstagramLinkArt from "./InstagramLinkArt";
import {
  extractYouTubeId,
  getLinkThumbnailUrl,
  isInstagramLink,
} from "./linkThumbnailUrl";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import "./Recommend.css";
import "./RecommendDetail.css";

const RecommendDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const modal = useManchuiModal();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const manageMenuRef = useRef(null);

  const load = useCallback(async () => {
    if (!serverUrl || !id) {
      setLoading(false);
      setError("잘못된 경로입니다.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/recommendations/${id}`, {
        withCredentials: true,
      });
      const it = res.data?.item;
      if (!it) {
        setError("추천을 찾을 수 없습니다.");
        setItem(null);
        return;
      }
      setItem(it);
    } catch (e) {
      setItem(null);
      setError(e?.response?.data?.message || "추천을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setManageMenuOpen(false);
  }, [id]);

  useEffect(() => {
    if (!manageMenuOpen) return;
    const onDoc = (e) => {
      if (manageMenuRef.current && !manageMenuRef.current.contains(e.target)) {
        setManageMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setManageMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [manageMenuOpen]);

  const patchItem = (patch) => {
    setItem((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleToggleLike = async () => {
    if (!user?._id) {
      await modal("로그인 후 이용할 수 있습니다.");
      return;
    }
    if (!item?._id) return;
    setBusyAction("like");
    try {
      const res = await apiClient.post(
        `/api/recommendations/${item._id}/like`,
        {},
        { withCredentials: true },
      );
      patchItem({
        likedByMe: res.data?.liked,
        likeCount: res.data?.likeCount ?? item.likeCount,
      });
    } catch (e) {
      await modal(e?.response?.data?.message || "좋아요 처리에 실패했습니다.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggleScrap = async () => {
    if (!user?._id) {
      await modal("로그인 후 이용할 수 있습니다.");
      return;
    }
    if (!item?._id) return;
    setBusyAction("scrap");
    try {
      const res = await apiClient.post(
        `/api/recommendations/${item._id}/scrap`,
        {},
        { withCredentials: true },
      );
      patchItem({
        scrapedByMe: res.data?.scraped,
        scrapCount: res.data?.scrapCount ?? item.scrapCount,
      });
    } catch (e) {
      await modal(e?.response?.data?.message || "스크랩 처리에 실패했습니다.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleDelete = async () => {
    if (!item?._id) return;
    if (!(await modal("이 추천을 삭제할까요?", "confirm"))) return;
    try {
      await apiClient.delete(`/api/recommendations/${item._id}`, {
        withCredentials: true,
      });
      nav("/club/recommend");
    } catch (e) {
      await modal(e?.response?.data?.message || "삭제에 실패했습니다.");
    }
  };

  const youtubeId = item ? extractYouTubeId(item.videoUrl) : null;
  const isInstagram = item ? isInstagramLink(item.videoUrl) : false;
  const thumbUrl =
    item && !youtubeId && !isInstagram
      ? getLinkThumbnailUrl(item.videoUrl, item.thumbnailUrl)
      : null;
  const tags = Array.isArray(item?.tags) ? item.tags : [];
  const hasBody = Boolean(item?.body && String(item.body).trim());
  const hasVideoLink = Boolean(item?.videoUrl && String(item.videoUrl).trim());
  const showManage = Boolean(item?.canEdit);

  if (loading) {
    return (
      <div className="recommend recommendDetail">
        <div className="recommend__loading">불러오는 중…</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="recommend recommendDetail">
        <header className="recommendDetail__header">
          <button
            type="button"
            className="recommendDetail__back"
            onClick={() => nav("/club/recommend")}
            aria-label="목록으로"
          >
            <IoChevronBack size={22} aria-hidden />
          </button>
        </header>
        <p className="recommendDetail__error">{error || "없음"}</p>
        <button
          type="button"
          className="recommendDetail__errorBtn"
          onClick={() => nav("/club/recommend")}
        >
          추천 목록으로
        </button>
      </div>
    );
  }

  return (
    <div className="recommend recommendDetail">
      <header className="recommendDetail__header">
        <button
          type="button"
          className="recommendDetail__back"
          onClick={() => nav("/club/recommend")}
          aria-label="목록으로"
        >
          <IoChevronBack size={22} aria-hidden />
        </button>
        <h1 className="recommendDetail__title">곡 추천</h1>
      </header>

      <article className="recommendDetail__card">
        <div className="recommendDetail__titleRow">
          <h2 className="recommendDetail__songTitle">{item.title}</h2>
          {showManage ? (
            <div className="recommendDetail__moreWrap" ref={manageMenuRef}>
              <button
                type="button"
                className="recommendDetail__moreBtn"
                aria-label="더보기"
                aria-expanded={manageMenuOpen}
                aria-haspopup="menu"
                onClick={() => setManageMenuOpen((v) => !v)}
              >
                <IoEllipsisVertical size={22} aria-hidden />
              </button>
              {manageMenuOpen ? (
                <ul
                  className="recommendDetail__moreMenu"
                  role="menu"
                  aria-label="글 관리"
                >
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="recommendDetail__moreItem"
                      onClick={() => {
                        setManageMenuOpen(false);
                        nav(`/club/recommend/${item._id}/edit`);
                      }}
                    >
                      수정
                    </button>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="recommendDetail__moreItem recommendDetail__moreItem--danger"
                      onClick={() => {
                        setManageMenuOpen(false);
                        void handleDelete();
                      }}
                    >
                      삭제
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        {youtubeId ? (
          <div className="recommendDetail__videoWrap">
            <iframe
              className="recommendDetail__youtube"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={item.title ? `${item.title} 영상` : "YouTube 영상"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : isInstagram ? (
          <a
            href={item.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="recommendDetail__thumbLink recommendDetail__instaLink"
            aria-label="Instagram 링크 열기"
          >
            <InstagramLinkArt variant="detail" />
          </a>
        ) : thumbUrl ? (
          <a
            href={item.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="recommendDetail__thumbLink"
            aria-label="영상·음원 링크 열기"
          >
            <img
              className="recommendDetail__thumb"
              src={thumbUrl}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </a>
        ) : null}

        <div className="recommendDetail__tagsRow">
          <div className="recommendDetail__tagsWrap">
            {tags.length > 0 ? (
              <div className="recCard__tags recommendDetail__tags">
                {tags.map((t) => {
                  const label = String(t).replace(/^#+/, "").trim();
                  if (!label) return null;
                  return (
                    <span key={label} className="recCard__hashtag">
                      #{label}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div className="recommendDetail__actions">
            <div className="recCard__stat">
              <button
                type="button"
                className={`recCard__iconBtn${item.likedByMe ? " recCard__iconBtn--active" : ""}`}
                disabled={!user?._id || busyAction === "like"}
                title={user?._id ? "좋아요" : "로그인 후 이용 가능"}
                aria-pressed={Boolean(item.likedByMe)}
                onClick={handleToggleLike}
              >
                {item.likedByMe ? (
                  <IoHeart aria-hidden className="recCard__heart" />
                ) : (
                  <IoHeartOutline aria-hidden />
                )}
              </button>
              <span className="recCard__statNum" aria-label="좋아요 수">
                {item.likeCount ?? 0}
              </span>
            </div>
            <div className="recCard__stat">
              <button
                type="button"
                className={`recCard__iconBtn${item.scrapedByMe ? " recCard__iconBtn--scrapActive" : ""}`}
                disabled={!user?._id || busyAction === "scrap"}
                title={user?._id ? "스크랩" : "로그인 후 이용 가능"}
                aria-pressed={Boolean(item.scrapedByMe)}
                onClick={handleToggleScrap}
              >
                {item.scrapedByMe ? (
                  <IoBookmark aria-hidden />
                ) : (
                  <IoBookmarkOutline aria-hidden />
                )}
              </button>
              <span className="recCard__statNum" aria-label="스크랩 수">
                {item.scrapCount ?? 0}
              </span>
            </div>
          </div>
        </div>

        <section
          className="recommendDetail__section"
          aria-labelledby="detail-body"
        >
          <hr className="recommendDetail__divider" aria-hidden="true" />
          <h3 id="detail-body" className="recCard__detailHeading">
            추천 설명
          </h3>
          {hasBody ? (
            <p className="recCard__body recCard__body--detail">{item.body}</p>
          ) : (
            <p
              className="recCard__body recCard__body--empty recCard__body--detail"
              style={{ color: "var(--text-more)" }}
            >
              추천 설명이 없습니다.
            </p>
          )}
        </section>

        {hasVideoLink ? (
          <section className="recommendDetail__section">
            <h3 className="recCard__detailHeading">링크</h3>
            <a
              href={item.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="recCard__detailLink"
            >
              <span className="recCard__detailLinkLabel">
                영상·음원 페이지로 이동
              </span>
              <IoOpenOutline className="recCard__detailLinkIcon" aria-hidden />
            </a>
          </section>
        ) : null}

        {(item.authorName || item.createdAt) && (
          <div className="recCard__detailMetaRow recommendDetail__metaRow">
            <div className="recCard__detailMetaLeft">
              {item.authorName ? (
                <span className="recCard__author recCard__author--detail">
                  작성자{" "}
                  <span className="recCard__authorName">{item.authorName}</span>
                </span>
              ) : null}
              {item.authorName && item.createdAt ? (
                <span className="recCard__detailMetaSep" aria-hidden>
                  ·
                </span>
              ) : null}
              {item.createdAt ? (
                <span className="recCard__meta recCard__meta--detail">
                  등록{" "}
                  {new Date(item.createdAt).toLocaleString("ko-KR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default RecommendDetail;
