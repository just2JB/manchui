import React from "react";

const TeamListSkeleton = ({ count = 3 }) => (
  <>
    <p className="teamPage__sectionLabel" aria-hidden>
      <span className="teamPage__sectionSk" />
    </p>
    <div className="teamPage__list">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="teamListCard teamListCard--skeleton">
          <span className="teamListCard__logoMark teamListCard__logoMark--skeleton" />
          <span className="teamListCard__main">
            <span className="teamListCard__titleRow">
              <span className="teamListCard__sk teamListCard__sk--name" />
            </span>
            <span className="teamListCard__chips">
              <span className="teamListCard__sk teamListCard__sk--chip" />
            </span>
            <span
              className="teamListCard__comment teamListCard__comment--sk"
              aria-hidden
            >
              <span className="teamListCard__sk teamListCard__sk--commentLine" />
              <span className="teamListCard__sk teamListCard__sk--commentLine teamListCard__sk--commentLineShort" />
            </span>
          </span>
          <span className="teamListCard__sk teamListCard__sk--chevron" />
        </div>
      ))}
    </div>
  </>
);

export default TeamListSkeleton;
