import { useEffect, useState } from "react";
import {
  CHANNEL_COLORS,
  channelList,
  getPresetAnimation,
  getPresetColor,
  getPresetImage,
  getPresetName,
  allPresets,
  isPresetEmpty,
} from "./lightingPresets";
import { tr, useLightingI18n } from "./lightingI18n";

/** 동작 줄이기 설정이면 움직이는 조명도 정지 사진으로 */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** 조명 이미지 16:9 (사이키처럼 움직이는 조명은 GIF, 없으면 색 그라데이션) */
export function PresetThumb({ channel, preset, className = "", still = false }) {
  // 실패한 주소들을 기억: GIF 가 안 되면 정지 사진, 사진도 안 되면 색 그라데이션
  // (채널/번호가 바뀌면 주소가 달라져서 다시 시도함)
  const [failed, setFailed] = useState(() => new Set());
  const animated = still || prefersReducedMotion() ? null : getPresetAnimation(channel, preset);
  const photo = getPresetImage(channel, preset);
  const src = animated && !failed.has(animated) ? animated : photo;
  const setFailedSrc = (bad) => setFailed((prev) => new Set(prev).add(bad));
  const color = getPresetColor(preset);
  return (
    <span className={`ltThumb ${className}`}>
      {failed.has(src) ? (
        <span
          className="ltThumb__fallback"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${color} 0%, ${color}66 40%, #070707 85%)`,
          }}
        />
      ) : (
        <img
          src={src}
          alt={tr("presetAlt", { c: channel, name: getPresetName(channel, preset) })}
          loading="lazy"
          onError={() => setFailedSrc(src)}
        />
      )}
      <span className="ltThumb__num">{preset}</span>
    </span>
  );
}

function Modal({ title, onClose, children }) {
  const { t } = useLightingI18n();
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="ltModal" onClick={onClose} role="presentation">
      <div
        className="ltModal__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ltModal__head">
          <h3>{title}</h3>
          <button type="button" className="ltModal__close" onClick={onClose} aria-label={t("close")}>
            ✕
          </button>
        </div>
        <div className="ltModal__body">{children}</div>
      </div>
    </div>
  );
}

/** 채널의 조명 10개를 모두 보여주고 하나 고르기 */
export function PresetModal({ channel, value, onSelect, onClose }) {
  const { t } = useLightingI18n();
  return (
    <Modal title={t("pickLight", { n: channel })} onClose={onClose}>
      <div className="ltPresetGrid">
        {allPresets.map((p) =>
          isPresetEmpty(channel, p) ? (
            <div key={p} className="ltPresetOpt is-empty" aria-label={t("presetEmpty", { n: p })}>
              <span className="ltThumb ltThumb--empty">
                <span className="ltThumb__num">{p}</span>
                <span className="ltThumb__emptyText">{t("empty")}</span>
              </span>
              <span className="ltPresetOpt__label">{t("presetEmpty", { n: p })}</span>
            </div>
          ) : (
          <button
            key={p}
            type="button"
            className={`ltPresetOpt${value === p ? " is-selected" : ""}`}
            onClick={() => {
              onSelect(p);
              onClose();
            }}
          >
            <PresetThumb channel={channel} preset={p} />
            <span className="ltPresetOpt__label">{getPresetName(channel, p)}</span>
          </button>
          ),
        )}
      </div>
    </Modal>
  );
}

/** 채널마다 조명 목록을 보면서 채널 고르기 */
export function ChannelModal({ value, onSelect, onClose }) {
  const { t } = useLightingI18n();
  return (
    <Modal title={t("pickChannel")} onClose={onClose}>
      <div className="ltChannelList">
        {channelList.map((c) => (
          <section
            key={c}
            className={`ltChannelOpt${value === c ? " is-selected" : ""}`}
            style={{ "--ch": CHANNEL_COLORS[c] }}
          >
            <div className="ltChannelOpt__head">
              <h4>
                <span className="ltChDot" />
                {t("channelChip", { n: c })}
              </h4>
              <button
                type="button"
                className="ltBtn ltBtn--sm ltBtn--primary"
                onClick={() => {
                  onSelect(c);
                  onClose();
                }}
              >
                {value === c ? t("selected") : t("useChannel")}
              </button>
            </div>
            <div className="ltChannelOpt__strip">
              {allPresets.map((p) =>
                isPresetEmpty(c, p) ? (
                  <div key={p} className="ltChannelOpt__item is-empty">
                    <span className="ltThumb ltThumb--empty">
                      <span className="ltThumb__num">{p}</span>
                      <span className="ltThumb__emptyText">{t("empty")}</span>
                    </span>
                    <span>{t("empty")}</span>
                  </div>
                ) : (
                  <div key={p} className="ltChannelOpt__item">
                    <PresetThumb channel={c} preset={p} />
                    <span>{getPresetName(c, p)}</span>
                  </div>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  );
}
