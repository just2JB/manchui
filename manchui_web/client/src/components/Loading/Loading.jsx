import React from "react";
import { LOADING_TEXT } from "../../constants/loadingText";
import "./Loading.css";

/**
 * @param {{ overlay?: boolean, label?: string, size?: "sm" | "md", showLabel?: boolean }} props
 */
const Loading = ({ overlay = true, label, size = "md", showLabel = true }) => {
  const text = label ?? LOADING_TEXT;

  return (
    <div
      className={[
        "manchuiLoading",
        overlay ? "manchuiLoading--overlay" : "manchuiLoading--inline",
        `manchuiLoading--${size}`,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className="manchuiLoading__inner">
        <span className="manchuiLoading__spinner" aria-hidden />
        {showLabel ? <p className="manchuiLoading__label">{text}</p> : null}
      </div>
    </div>
  );
};

export function LoadingHint({ className = "" }) {
  return (
    <p
      className={`manchuiLoadingHint ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      {LOADING_TEXT}
    </p>
  );
}

export default Loading;
