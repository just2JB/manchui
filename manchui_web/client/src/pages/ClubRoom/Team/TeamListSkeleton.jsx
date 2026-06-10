import React from "react";

const TeamListSkeleton = ({ count = 3 }) => (
  <div className="teamPage__list" aria-hidden>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="teamListCard teamListCard--skeleton">
        <span className="teamListCard__avatar teamListCard__avatar--skeleton" />
        <span className="teamListCard__main">
          <span className="teamListCard__skLine teamListCard__skLine--title" />
          <span className="teamListCard__skLine teamListCard__skLine--chip" />
          <span className="teamListCard__skLine teamListCard__skLine--comment" />
        </span>
      </div>
    ))}
  </div>
);

export default TeamListSkeleton;
