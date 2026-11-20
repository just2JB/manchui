import React from "react";
import "./ClubPageSkeleton.css";

/**
 * 화면 이동 직후 데이터가 오기 전까지 보여주는 자리표시.
 * 전체 화면 로딩 오버레이 대신 페이지 안에서 바로 그려서, 이동이 즉시 일어난 것처럼 보이게 한다.
 * @param {{ variant?: "detail" | "grid" | "form" | "home" }} props
 */
const ClubPageSkeleton = ({ variant = "detail" }) => (
  <div className={`clubSk clubSk--${variant}`} role="status" aria-label="불러오는 중">
    <span className="clubSk__bar clubSk__bar--title" />
    <span className="clubSk__bar clubSk__bar--sub" />
    {variant === "grid" ? (
      <>
        <span className="clubSk__row">
          <span className="clubSk__bar clubSk__bar--chip" />
          <span className="clubSk__bar clubSk__bar--chip" />
          <span className="clubSk__bar clubSk__bar--chip" />
        </span>
        <span className="clubSk__block clubSk__block--grid" />
      </>
    ) : variant === "form" ? (
      <>
        <span className="clubSk__block clubSk__block--field" />
        <span className="clubSk__block clubSk__block--field" />
        <span className="clubSk__block clubSk__block--field" />
      </>
    ) : variant === "home" ? (
      <>
        <span className="clubSk__block clubSk__block--hero" />
        <span className="clubSk__block clubSk__block--grid" />
      </>
    ) : (
      <>
        <span className="clubSk__block clubSk__block--card" />
        <span className="clubSk__block clubSk__block--card clubSk__block--short" />
      </>
    )}
  </div>
);

export default ClubPageSkeleton;
