import React from "react";

const RecommendationCardSkeleton = () => (
  <article className="recCard recCard--skeleton" aria-hidden="true">
    <div className="recCard__thumbWrap recommendSkeleton__thumb" />
    <div className="recCard__main">
      <div className="recCard__topRow">
        <div className="recommendSkeleton__line recommendSkeleton__line--title recommendSkeleton__block" />
        <div className="recommendSkeleton__line recommendSkeleton__line--date recommendSkeleton__block" />
      </div>
      <div className="recCard__foot recCard__foot--hasTags">
        <div className="recommendSkeleton__tags">
          <span className="recommendSkeleton__chip recommendSkeleton__block" />
          <span className="recommendSkeleton__chip recommendSkeleton__chip--short recommendSkeleton__block" />
        </div>
        <div className="recommendSkeleton__actions">
          <span className="recommendSkeleton__icon recommendSkeleton__block" />
          <span className="recommendSkeleton__icon recommendSkeleton__block" />
        </div>
      </div>
    </div>
  </article>
);

export default RecommendationCardSkeleton;
