import { useCallback, useEffect, useRef, useState } from "react";

const SWIPE_MIN_PX = 48;

function isSwipeBlockedTarget(target) {
  return (
    target instanceof Element &&
    target.closest("button, a, input, select, textarea, label")
  );
}

export function formatCalendarMonthKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function useCalendarMonthSlide(viewMonth, setViewMonth) {
  const [slideDir, setSlideDir] = useState(null);
  const swipeRef = useRef(null);

  useEffect(() => {
    if (!slideDir) return undefined;
    const id = window.setTimeout(() => setSlideDir(null), 320);
    return () => window.clearTimeout(id);
  }, [viewMonth, slideDir]);

  const navigateToMonth = useCallback(
    (nextMonth) => {
      const target = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
      const current = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
      if (target.getTime() === current.getTime()) return;
      setSlideDir(target < current ? "prev" : "next");
      setViewMonth(target);
    },
    [viewMonth, setViewMonth],
  );

  const goPrevMonth = useCallback(() => {
    navigateToMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
    );
  }, [navigateToMonth, viewMonth]);

  const goNextMonth = useCallback(() => {
    navigateToMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
    );
  }, [navigateToMonth, viewMonth]);

  const goToToday = useCallback(() => {
    navigateToMonth(new Date());
  }, [navigateToMonth]);

  const onSwipeStart = useCallback((clientX, clientY) => {
    swipeRef.current = { x: clientX, y: clientY };
  }, []);

  const onSwipeEnd = useCallback(
    (clientX, clientY) => {
      const start = swipeRef.current;
      swipeRef.current = null;
      if (!start) return;
      const dx = clientX - start.x;
      const dy = clientY - start.y;
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dy) > Math.abs(dx)) return;
      if (dx > 0) goPrevMonth();
      else goNextMonth();
    },
    [goPrevMonth, goNextMonth],
  );

  const swipeHandlers = {
    onTouchStart: (e) => {
      if (isSwipeBlockedTarget(e.target)) return;
      const t = e.touches[0];
      if (t) onSwipeStart(t.clientX, t.clientY);
    },
    onTouchEnd: (e) => {
      const t = e.changedTouches[0];
      if (t) onSwipeEnd(t.clientX, t.clientY);
    },
    onPointerDown: (e) => {
      if (e.pointerType === "touch") return;
      if (isSwipeBlockedTarget(e.target)) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      onSwipeStart(e.clientX, e.clientY);
    },
    onPointerUp: (e) => {
      if (e.pointerType === "touch") return;
      if (!swipeRef.current) return;
      onSwipeEnd(e.clientX, e.clientY);
    },
    onPointerCancel: () => {
      swipeRef.current = null;
    },
  };

  return {
    slideDir,
    goPrevMonth,
    goNextMonth,
    goToToday,
    navigateToMonth,
    swipeHandlers,
    monthKey: formatCalendarMonthKey(viewMonth),
  };
}
