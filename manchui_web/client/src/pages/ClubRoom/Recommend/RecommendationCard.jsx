import React, { useEffect, useId, useMemo, useState } from "react";
import {
  IoHeart,
  IoHeartOutline,
  IoBookmark,
  IoBookmarkOutline,
  IoChevronDown,
  IoMusicalNotesOutline,
} from "react-icons/io5";
import { getLinkThumbnailUrl } from "./linkThumbnailUrl";

const RecommendationCard = ({
  item,
  user,
  busyLike,
  busyScrap,
  onToggleLike,
  onToggleScrap,
  onEdit,
  onDelete,
  onTagClick,
  showMeta = true,
}) => {
  const detailId = useId();
  const [expanded, setExpanded] = useState(false);
  const canInteract = Boolean(user?._id);
  const showManage = Boolean(item.canEdit && (onEdit || onDelete));
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const hasBody = Boolean(item.body && String(item.body).trim());

  const thumbUrl = useMemo(
    () => getLinkThumbnailUrl(item.videoUrl, item.thumbnailUrl),
    [item.videoUrl, item.thumbnailUrl],
  );
  const [thumbFailed, setThumbFailed] = useState(false);
  useEffect(() => {
    setThumbFailed(false);
  }, [item._id, item.videoUrl]);

  const showThumbImg = Boolean(thumbUrl && !thumbFailed);

  return (
    <article className={`recCard${expanded ? " recCard--expanded" : ""}`}>
      <a
        href={item.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="recCard__thumbWrap recCard__thumbLink"
        aria-label="영상·음원 링크 열기"
      >
        {showThumbImg ? (
          <img
            className="recCard__thumbImg"
            src={thumbUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <IoMusicalNotesOutline className="recCard__thumbIcon" aria-hidden />
        )}
      </a>

      <div className="recCard__main">
        <div className="recCard__lead">
          <div className="recCard__head">
            <button
              type="button"
              className="recCard__titleTap"
              aria-expanded={expanded}
              aria-controls={detailId}
              onClick={() => setExpanded((v) => !v)}
            >
              <h2 className="recCard__title">{item.title}</h2>
              <IoChevronDown
                className="recCard__chev"
                aria-hidden
              />
            </button>
            <div className="recCard__actions">
              <span className="recCard__likeCount" aria-label="좋아요 수">
                {item.likeCount ?? 0}
              </span>
              <button
                type="button"
                className={`recCard__iconBtn${item.likedByMe ? " recCard__iconBtn--active" : ""}`}
                disabled={!canInteract || busyLike}
                title={canInteract ? "좋아요" : "로그인 후 이용 가능"}
                aria-pressed={Boolean(item.likedByMe)}
                onClick={() => onToggleLike?.(item)}
              >
                {item.likedByMe ? (
                  <IoHeart aria-hidden className="recCard__heart" />
                ) : (
                  <IoHeartOutline aria-hidden />
                )}
              </button>
              <button
                type="button"
                className={`recCard__iconBtn${item.scrapedByMe ? " recCard__iconBtn--scrapActive" : ""}`}
                disabled={!canInteract || busyScrap}
                title={canInteract ? "스크랩" : "로그인 후 이용 가능"}
                aria-pressed={Boolean(item.scrapedByMe)}
                onClick={() => onToggleScrap?.(item)}
              >
                {item.scrapedByMe ? (
                  <IoBookmark aria-hidden />
                ) : (
                  <IoBookmarkOutline aria-hidden />
                )}
              </button>
            </div>
          </div>

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
                  <span key={`${item._id}-${label}`} className="recCard__hashtag">
                    #{label}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>

        <div id={detailId} className="recCard__detail" hidden={!expanded}>
          <div className="recCard__detailBlock">
            <h3 className="recCard__detailHeading">추천 설명</h3>
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
          </div>

          {item.authorName ? (
            <div className="recCard__author recCard__author--detail">
              작성자{" "}
              <span className="recCard__authorName">{item.authorName}</span>
            </div>
          ) : null}

          {showMeta && item.createdAt ? (
            <div className="recCard__meta">
              등록{" "}
              {new Date(item.createdAt).toLocaleString("ko-KR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          ) : null}

          {showManage ? (
            <div className="recCard__manage">
              {onEdit ? (
                <button
                  type="button"
                  className="recCard__manageBtn"
                  onClick={() => onEdit(item)}
                >
                  수정
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  className="recCard__manageBtn recCard__manageBtn--danger"
                  onClick={() => onDelete(item)}
                >
                  삭제
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default RecommendationCard;
