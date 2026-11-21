import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useLightingI18n } from "./lightingI18n";

/**
 * 팀 화면 사용법 안내 (처음 팀을 만들면 자동으로, ? 버튼으로 다시).
 * 화면의 [data-tour="..."] 요소를 차례로 비추고 설명 카드를 띄운다.
 * 대상이 화면에 없으면 그 단계는 건너뛴다.
 */
/** 단계: 비출 곳 + 번역 키 (lightingI18n.js 의 tour{n}Title / tour{n}Body) */
const STEPS = [
  { target: null, key: "tour0" },
  { target: "channel", key: "tour1" },
  { target: "length", key: "tour2" },
  { target: "player", key: "tour3" },
  { target: "add", key: "tour4" },
  { target: "cue", key: "tour5" },
  { target: null, key: "tour6" },
];

const PAD = 8;

function findTarget(name) {
  if (!name) return null;
  const el = document.querySelector(`[data-tour="${name}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width && r.height ? el : null;
}

export default function LightingTour({ onClose }) {
  const { t } = useLightingI18n();
  // 지금 화면에 있는 단계만 사용 (화면이 그려진 다음에 찾아야 대상이 잡힌다)
  const [steps, setSteps] = useState(null);
  useLayoutEffect(() => {
    setSteps(STEPS.filter((s) => !s.target || findTarget(s.target)));
  }, []);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const step = steps?.[index];
  const last = steps ? index === steps.length - 1 : false;

  const measure = useCallback(() => {
    const el = findTarget(step?.target);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [step]);

  useLayoutEffect(() => {
    const el = findTarget(step?.target);
    if (el) el.scrollIntoView({ block: "center", behavior: "auto" });
    measure();
  }, [step, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (last) onClose();
        else setIndex((i) => i + 1);
      }
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last, onClose]);

  if (!step) return null;

  // 카드 위치: 대상 아래에 자리가 있으면 아래, 아니면 위. 대상이 없으면 가운데
  const vh = window.innerHeight;
  let cardStyle;
  if (rect) {
    const below = rect.top + rect.height + 12;
    cardStyle =
      vh - below > 220
        ? { top: below }
        : { bottom: Math.max(12, vh - rect.top + 12) };
  }

  return (
    <div className="ltTour" role="dialog" aria-modal="true" aria-label={t(`${step.key}Title`)}>
      {rect ? (
        <div
          className="ltTour__spot"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      ) : (
        <div className="ltTour__dim" />
      )}
      <div className={`ltTour__card${rect ? "" : " is-center"}`} style={cardStyle}>
        <p className="ltTour__count">
          {index + 1} / {steps.length}
        </p>
        <h3>{t(`${step.key}Title`)}</h3>
        <p className="ltTour__body">{t(`${step.key}Body`)}</p>
        <div className="ltTour__row">
          <button type="button" className="ltLinkBtn ltLinkBtn--dim" onClick={onClose}>
            {t("tourSkip")}
          </button>
          <div className="ltTour__nav">
            {index > 0 ? (
              <button type="button" className="ltBtn ltBtn--sm" onClick={() => setIndex(index - 1)}>
                {t("tourPrev")}
              </button>
            ) : null}
            <button
              type="button"
              className="ltBtn ltBtn--sm ltBtn--primary"
              autoFocus
              onClick={() => (last ? onClose() : setIndex(index + 1))}
            >
              {last ? t("tourStart") : t("tourNext")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
