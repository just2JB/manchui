import React, { useEffect, useMemo, useState } from "react";
import { IoMusicalNotesOutline } from "react-icons/io5";
import InstagramLinkArt from "./InstagramLinkArt";
import {
  extractYouTubeId,
  getLinkThumbnailUrl,
  isInstagramLink,
} from "./linkThumbnailUrl";

const RecommendCardThumb = ({ videoUrl, thumbnailUrl, itemId }) => {
  const youtubeId = useMemo(() => extractYouTubeId(videoUrl), [videoUrl]);
  const isInstagram = useMemo(() => isInstagramLink(videoUrl), [videoUrl]);
  const thumbUrl = useMemo(() => {
    if (youtubeId || isInstagram) return null;
    return getLinkThumbnailUrl(videoUrl, thumbnailUrl);
  }, [youtubeId, isInstagram, videoUrl, thumbnailUrl]);

  const [thumbFailed, setThumbFailed] = useState(false);
  useEffect(() => {
    setThumbFailed(false);
  }, [itemId, videoUrl]);

  if (isInstagram) {
    return <InstagramLinkArt variant="card" />;
  }

  const imgSrc =
    youtubeId && !thumbFailed
      ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
      : thumbUrl && !thumbFailed
        ? thumbUrl
        : null;

  if (imgSrc) {
    return (
      <img
        className="recCard__thumbImg"
        src={imgSrc}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setThumbFailed(true)}
      />
    );
  }

  return <IoMusicalNotesOutline className="recCard__thumbIcon" aria-hidden />;
};

export default RecommendCardThumb;
