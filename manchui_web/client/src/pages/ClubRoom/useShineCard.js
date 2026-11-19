import { useCallback, useRef } from "react";

/**
 * 명함 카드 반짝임: 손가락/마우스 위치를 CSS 변수(--mx, --my, --rx, --ry)로 넘기고
 * 닿아 있는 동안 data-active 를 붙인다. 움직임 줄이기 설정이면 아무것도 하지 않는다.
 * 쓰는 쪽: ref 를 카드에 달고 handlers 를 펼쳐 넣으면 된다.
 */
export function useShineCard() {
  const ref = useRef(null);

  const onPointerMove = useCallback((event) => {
    const card = ref.current;
    if (!card) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const rect = card.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    card.style.setProperty("--mx", `${x * 100}%`);
    card.style.setProperty("--my", `${y * 100}%`);
    card.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
    card.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
    card.dataset.active = "true";
  }, []);

  const reset = useCallback(() => {
    const card = ref.current;
    if (!card) return;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    delete card.dataset.active;
  }, []);

  const onPointerUp = useCallback(
    (event) => {
      if (event.pointerType !== "mouse") reset();
    },
    [reset],
  );

  return {
    ref,
    handlers: {
      onPointerMove,
      onPointerLeave: reset,
      onPointerCancel: reset,
      onPointerUp,
    },
  };
}
