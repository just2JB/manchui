import React from "react";
import "./Cup.css";

const FILL_COLOR = "#b30000";
const EMPTY_COLOR = "#4a4a4a";

// 소주잔: 위가 넓은 사다리꼴
const SojuIcon = ({ fill }) => (
  <svg
    viewBox="0 0 24 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="cupSvg"
    aria-hidden
  >
    <path
      d="M5 4h14l-2 24H7L5 4z"
      fill={fill ? FILL_COLOR : EMPTY_COLOR}
    />
  </svg>
);

const Cup = ({ fill }) => (
  <div className="cupIcon" aria-hidden>
    <SojuIcon fill={fill} />
  </div>
);

export default Cup;
export const CUP_TYPES = ["soju", "soju", "soju", "soju", "soju"];
