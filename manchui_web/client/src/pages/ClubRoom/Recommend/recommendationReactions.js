/** 좋아요 토글 낙관적 패치 */
export function optimisticLikePatch(item) {
  const likedByMe = Boolean(item?.likedByMe);
  return {
    likedByMe: !likedByMe,
    likeCount: Math.max(0, (item?.likeCount ?? 0) + (likedByMe ? -1 : 1)),
  };
}

/** 스크랩 토글 낙관적 패치 */
export function optimisticScrapPatch(item) {
  const scrapedByMe = Boolean(item?.scrapedByMe);
  return {
    scrapedByMe: !scrapedByMe,
    scrapCount: Math.max(0, (item?.scrapCount ?? 0) + (scrapedByMe ? -1 : 1)),
  };
}

export function likePatchFromResponse(res, fallbackItem) {
  return {
    likedByMe: Boolean(res.data?.liked),
    likeCount: res.data?.likeCount ?? fallbackItem?.likeCount ?? 0,
  };
}

export function scrapPatchFromResponse(res, fallbackItem) {
  return {
    scrapedByMe: Boolean(res.data?.scraped),
    scrapCount: res.data?.scrapCount ?? fallbackItem?.scrapCount ?? 0,
  };
}

/** 좋아요·스크랩 롤백용 스냅샷 */
export function reactionSnapshot(item) {
  return {
    likedByMe: Boolean(item?.likedByMe),
    likeCount: item?.likeCount ?? 0,
    scrapedByMe: Boolean(item?.scrapedByMe),
    scrapCount: item?.scrapCount ?? 0,
  };
}
