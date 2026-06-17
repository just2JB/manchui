import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IoBookmark,
  IoBookmarkOutline,
  IoHeart,
  IoHeartOutline,
} from "react-icons/io5";
import RecommendCardThumb from "./RecommendCardThumb";

const RecommendationCard = ({
  item,
  user,
  busyLike,
  busyScrap,
  onToggleLike,
  onToggleScrap,
  onTagClick,
  showMeta = true,
}) => {
  const navigate = useNavigate();
  const detailTo = `/club/recommend/${item._id}`;
  const canInteract = Boolean(user?._id);
  const tags = Array.isArray(item.tags) ? item.tags : [];

  const listDateLabel =
    showMeta && item.createdAt
      ? new Date(item.createdAt).toLocaleDateString("ko-KR", {
          year: "2-digit",
          month: "numeric",
          day: "numeric",
        })
      : null;

  const handleCardClick = (e) => {
    const t = e.target;
    if (t.closest("a[href]") || t.closest("button")) return;
    navigate(detailTo);
  };

  return (
    <article className="recCard" onClick={handleCardClick}>
      <Link
        to={detailTo}
        className="recCard__thumbWrap recCard__thumbLink"
        aria-label="상세 보기"
        onClick={(e) => e.stopPropagation()}
      >
        <RecommendCardThumb
          videoUrl={item.videoUrl}
          thumbnailUrl={item.thumbnailUrl}
          itemId={item._id}
        />
      </Link>

      <div className="recCard__main">
        <div className="recCard__topRow">
          <Link
            to={detailTo}
            className="recCard__titleTap"
            aria-label={`${item.title} 상세`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="recCard__title">{item.title}</h2>
          </Link>
          {listDateLabel ? (
            <time
              className="recCard__listDate"
              dateTime={
                item.createdAt
                  ? new Date(item.createdAt).toISOString()
                  : undefined
              }
            >
              {listDateLabel}
            </time>
          ) : null}
        </div>

        <div
          className={
            tags.length > 0
              ? "recCard__foot recCard__foot--hasTags"
              : "recCard__foot"
          }
        >
          {tags.length > 0 ? (
            <div className="recCard__tags">
              {tags.map((t) => {
                const label = String(t).replace(/^#+/, "").trim();
                if (!label) return null;
                if (onTagClick) {
                  return (
                    <button
                      key={`${item._id}-${label}`}
                      type="button"
                      className="recCard__hashtag recCard__hashtag--clickable"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTagClick(label);
                      }}
                    >
                      #{label}
                    </button>
                  );
                }
                return (
                  <span
                    key={`${item._id}-${label}`}
                    className="recCard__hashtag"
                  >
                    #{label}
                  </span>
                );
              })}
            </div>
          ) : null}

          <div className="recCard__statsRow">
            <div className="recCard__actions">
              <div className="recCard__stat">
                <button
                  type="button"
                  className={`recCard__iconBtn${item.likedByMe ? " recCard__iconBtn--active" : ""}`}
                  disabled={!canInteract || busyLike}
                  title={canInteract ? "좋아요" : "로그인 후 이용 가능"}
                  aria-pressed={Boolean(item.likedByMe)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike?.(item);
                  }}
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
                  disabled={!canInteract || busyScrap}
                  title={canInteract ? "스크랩" : "로그인 후 이용 가능"}
                  aria-pressed={Boolean(item.scrapedByMe)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleScrap?.(item);
                  }}
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
        </div>
      </div>
    </article>
  );
};

export default RecommendationCard;
