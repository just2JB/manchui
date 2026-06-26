import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { IoArrowRedoOutline, IoArrowUndoOutline, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import { saveMySchedule } from "../../../api/scheduleApi";
import { fetchMyWeeklyTimetables } from "../../../api/weeklyTimetableApi";
import { useAuth } from "../../../context/AuthContext";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import {
  addDaysToDateKey,
  formatScheduleDateHeader,
  formatScheduleMonthLabel,
  getScheduleEditorHours,
  hoursToTimes,
  timesToHours,
} from "./clubHomeUtils";
import {
  buildHourLabelsFromEntries,
  getWeeklyEntriesForDateKey,
  getWeeklyHoursForDateKey,
  hasWeeklyTimetableForDateKey,
  mergeHourLabels,
  mergeHourLists,
} from "../weeklyTimetableUtils";

const SLIDE_RANGE = 45;
/** 화면에 5일 노출, 양끝 2일은 peek */
const SLIDES_PER_VIEW = 4.35;
const DAWN_HOUR_END = 7;
const DRAG_ARM_PX = 8;
const UNDO_LIMIT = 50;

function hasDawnHourSelection(hoursByDate) {
  return Object.values(hoursByDate ?? {}).some((hours) =>
    (hours ?? []).some((hour) => hour >= 0 && hour <= DAWN_HOUR_END),
  );
}

function buildSlideDateKeys(anchorDateKey) {
  const keys = [];
  for (let offset = -SLIDE_RANGE; offset <= SLIDE_RANGE; offset += 1) {
    keys.push(addDaysToDateKey(anchorDateKey, offset));
  }
  return keys;
}

function cloneHoursMap(map) {
  const next = {};
  for (const [key, hours] of Object.entries(map)) {
    next[key] = [...hours];
  }
  return next;
}

function hoursEqual(a, b) {
  const left = a ?? [];
  const right = b ?? [];
  return (
    left.length === right.length &&
    left.every((hour, index) => hour === right[index])
  );
}

function cloneLabelsMap(map) {
  const next = {};
  for (const [key, labels] of Object.entries(map ?? {})) {
    next[key] = { ...labels };
  }
  return next;
}

function cloneTimetableLoadedMap(map) {
  const next = {};
  for (const [key, value] of Object.entries(map ?? {})) {
    next[key] = {
      hours: [...(value?.hours ?? [])],
      labels: { ...(value?.labels ?? {}) },
    };
  }
  return next;
}

function createEditorSnapshot(hoursByDate, labelsByDate, timetableLoadedByDate) {
  return {
    hoursByDate: cloneHoursMap(hoursByDate),
    labelsByDate: cloneLabelsMap(labelsByDate),
    timetableLoadedByDate: cloneTimetableLoadedMap(timetableLoadedByDate),
  };
}

function editorStateChanged(before, after) {
  if (!before || !after) return false;
  const hourKeys = new Set([
    ...Object.keys(before.hoursByDate ?? {}),
    ...Object.keys(after.hoursByDate ?? {}),
  ]);
  for (const key of hourKeys) {
    if (!hoursEqual(before.hoursByDate[key], after.hoursByDate[key])) {
      return true;
    }
  }
  return (
    JSON.stringify(before.labelsByDate) !== JSON.stringify(after.labelsByDate) ||
    JSON.stringify(before.timetableLoadedByDate) !==
      JSON.stringify(after.timetableLoadedByDate)
  );
}

function mergeHourRangePaint(baseHours, anchorHour, endHour, selecting) {
  const min = Math.min(anchorHour, endHour);
  const max = Math.max(anchorHour, endHour);
  const rangeHours = [];
  for (let h = min; h <= max; h += 1) {
    rangeHours.push(h);
  }
  if (selecting) {
    return [...new Set([...(baseHours ?? []), ...rangeHours])].sort(
      (a, b) => a - b,
    );
  }
  const remove = new Set(rangeHours);
  return (baseHours ?? []).filter((h) => !remove.has(h));
}

function resolveHourFromSlotsContainer(container, clientY, visibleHours) {
  if (!container || !visibleHours?.length) return null;
  const rect = container.getBoundingClientRect();
  const relativeY = clientY - rect.top;
  if (relativeY < 0 || relativeY > rect.height) return null;

  const firstSlot = container.querySelector(".clubScheduleEditor__slot");
  if (!firstSlot) return null;

  const styles = getComputedStyle(container);
  const gap = parseFloat(styles.rowGap || styles.gap) || 0;
  const rowStep = firstSlot.getBoundingClientRect().height + gap;
  if (rowStep <= 0) return null;

  const index = Math.floor(relativeY / rowStep);
  return visibleHours[Math.max(0, Math.min(visibleHours.length - 1, index))];
}

function resolveHourFromPointer(target, clientY, visibleHours) {
  const slot = target?.closest?.("[data-sched-hour]");
  if (slot) {
    const hour = Number(slot.dataset.schedHour);
    if (!Number.isNaN(hour)) return hour;
  }
  const container = target?.closest?.("[data-sched-slots-date]");
  return resolveHourFromSlotsContainer(container, clientY, visibleHours);
}

function measureFloatDateItems(swiper, keys, originEl) {
  if (!swiper || !keys?.length || !originEl) return [];

  const originRect = originEl.getBoundingClientRect();
  const slides = swiper.slides;
  const items = [];

  const pushSlide = (slide, index) => {
    const key = keys[index];
    if (!slide || !key) return;
    const rect = slide.getBoundingClientRect();
    items.push({
      key,
      left: rect.left - originRect.left,
      width: rect.width,
    });
  };

  if (slides?.length) {
    for (let index = 0; index < slides.length; index += 1) {
      const slide = slides[index];
      if (slide?.classList?.contains("swiper-slide-visible")) {
        pushSlide(slide, index);
      }
    }
    if (items.length > 0) return items;
  }

  const activeIndex = swiper.activeIndex ?? 0;
  for (let offset = -2; offset <= 2; offset += 1) {
    pushSlide(slides?.[activeIndex + offset], activeIndex + offset);
  }
  return items.filter((item) => item.width > 0);
}

const ClubHomeScheduleEditor = ({
  open,
  dateKey,
  scheduleMap,
  requestDateSet,
  onClose,
  onSaveComplete,
  onScheduleSaved,
}) => {
  const { user } = useAuth();
  const modal = useManchuiModal();
  const swiperRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const dateHeadSentinelRef = useRef(null);
  const gridWrapRef = useRef(null);
  const initialHoursByDateRef = useRef({});
  const initialLabelsByDateRef = useRef({});
  const hoursByDateRef = useRef({});
  const labelsByDateRef = useRef({});
  const timetableLoadedByDateRef = useRef({});
  const visibleHoursRef = useRef([]);
  const gestureBeforeRef = useRef(null);
  const dragListenersRef = useRef(null);
  const pendingPressRef = useRef(false);
  const rangeArmedRef = useRef(false);
  const horizontalSwipeRef = useRef(false);
  const pointerStartRef = useRef(null);
  const pointerIdRef = useRef(null);
  const captureTargetRef = useRef(null);
  const dragAnchorRef = useRef(null);
  const dragEndRef = useRef(null);
  const dragBaseHoursRef = useRef([]);
  const paintSelectRef = useRef(true);
  const [anchorDateKey, setAnchorDateKey] = useState(dateKey);
  const [centerDateKey, setCenterDateKey] = useState(dateKey);
  const [floatDateItems, setFloatDateItems] = useState([]);
  const [hoursByDate, setHoursByDate] = useState({});
  const [labelsByDate, setLabelsByDate] = useState({});
  const [timetableLoadedByDate, setTimetableLoadedByDate] = useState({});
  const [showDawn, setShowDawn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFloatingDate, setShowFloatingDate] = useState(false);
  const [activeWeeklyTimetable, setActiveWeeklyTimetable] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isRangeDragging, setIsRangeDragging] = useState(false);

  const requestedDates = useMemo(() => {
    if (requestDateSet instanceof Set) return requestDateSet;
    return new Set(requestDateSet ?? []);
  }, [requestDateSet]);

  const visibleHours = useMemo(
    () => getScheduleEditorHours(showDawn),
    [showDawn],
  );

  const slideDateKeys = useMemo(
    () => (anchorDateKey ? buildSlideDateKeys(anchorDateKey) : []),
    [anchorDateKey],
  );

  const initialSlideIndex = useMemo(() => {
    if (!dateKey || !anchorDateKey) return SLIDE_RANGE;
    const diff = slideDateKeys.indexOf(dateKey);
    return diff >= 0 ? diff : SLIDE_RANGE;
  }, [dateKey, anchorDateKey, slideDateKeys]);

  const monthLabel = useMemo(
    () => (centerDateKey ? formatScheduleMonthLabel(centerDateKey) : ""),
    [centerDateKey],
  );

  const hasUnsavedChanges = useMemo(
    () =>
      Object.keys(hoursByDate).some(
        (key) =>
          !hoursEqual(hoursByDate[key], initialHoursByDateRef.current[key]),
      ),
    [hoursByDate],
  );

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const getCurrentSnapshot = useCallback(
    () =>
      createEditorSnapshot(
        hoursByDateRef.current,
        labelsByDateRef.current,
        timetableLoadedByDateRef.current,
      ),
    [],
  );

  const applySnapshot = useCallback((snapshot) => {
    if (!snapshot) return;
    setHoursByDate(snapshot.hoursByDate);
    setLabelsByDate(snapshot.labelsByDate);
    setTimetableLoadedByDate(snapshot.timetableLoadedByDate);
  }, []);

  const pushUndoSnapshot = useCallback((snapshot) => {
    if (!snapshot) return;
    setUndoStack((prev) => [...prev.slice(-(UNDO_LIMIT - 1)), snapshot]);
    setRedoStack([]);
  }, []);

  const commitGestureIfChanged = useCallback(() => {
    const before = gestureBeforeRef.current;
    gestureBeforeRef.current = null;
    if (!before) return;
    const after = getCurrentSnapshot();
    if (editorStateChanged(before, after)) {
      pushUndoSnapshot(before);
    }
  }, [getCurrentSnapshot, pushUndoSnapshot]);

  const beginGesture = useCallback(() => {
    gestureBeforeRef.current = getCurrentSnapshot();
  }, [getCurrentSnapshot]);

  const updateFloatDateLayout = useCallback(() => {
    setFloatDateItems(
      measureFloatDateItems(
        swiperRef.current,
        slideDateKeys,
        gridWrapRef.current,
      ),
    );
  }, [slideDateKeys]);

  const preloadHours = useCallback(
    (keys) => {
      setHoursByDate((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const key of keys) {
          if (next[key]) continue;
          const hours = timesToHours(scheduleMap?.get(key)?.times);
          next[key] = hours;
          initialHoursByDateRef.current[key] = [...hours];
          changed = true;
        }
        return changed ? next : prev;
      });
    },
    [scheduleMap],
  );

  useEffect(() => {
    hoursByDateRef.current = hoursByDate;
  }, [hoursByDate]);

  useEffect(() => {
    labelsByDateRef.current = labelsByDate;
  }, [labelsByDate]);

  useEffect(() => {
    timetableLoadedByDateRef.current = timetableLoadedByDate;
  }, [timetableLoadedByDate]);

  useEffect(() => {
    visibleHoursRef.current = visibleHours;
  }, [visibleHours]);

  useEffect(() => {
    if (!open || !dateKey) return;
    setAnchorDateKey(dateKey);
    setCenterDateKey(dateKey);
    const keys = buildSlideDateKeys(dateKey);
    const initial = {};
    for (const key of keys) {
      initial[key] = timesToHours(scheduleMap?.get(key)?.times);
    }
    initialHoursByDateRef.current = cloneHoursMap(initial);
    initialLabelsByDateRef.current = {};
    setHoursByDate(initial);
    setLabelsByDate({});
    setTimetableLoadedByDate({});
    setShowDawn(hasDawnHourSelection(initial));
    setUndoStack([]);
    setRedoStack([]);
  }, [open, dateKey, scheduleMap]);

  useEffect(() => {
    if (open) return undefined;
    return () => {
      const listeners = dragListenersRef.current;
      if (listeners) {
        window.removeEventListener("pointermove", listeners.move);
        window.removeEventListener("pointerup", listeners.up);
        window.removeEventListener("pointercancel", listeners.cancel);
        dragListenersRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setActiveWeeklyTimetable(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const { activeTimetable } = await fetchMyWeeklyTimetables();
        if (!cancelled) setActiveWeeklyTimetable(activeTimetable);
      } catch {
        if (!cancelled) setActiveWeeklyTimetable(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !swiperRef.current) return;
    const index = slideDateKeys.indexOf(dateKey);
    if (index >= 0) {
      swiperRef.current.slideTo(index, 0);
    }
  }, [open, dateKey, slideDateKeys]);

  useEffect(() => {
    if (!open) {
      setShowFloatingDate(false);
      return undefined;
    }

    let observer;
    let cancelled = false;

    const frame = requestAnimationFrame(() => {
      if (cancelled) return;

      const scrollRoot = scrollAreaRef.current;
      const sentinel = dateHeadSentinelRef.current;
      if (!scrollRoot || !sentinel) return;

      observer = new IntersectionObserver(
        ([entry]) => {
          setShowFloatingDate(!entry.isIntersecting);
        },
        { root: scrollRoot, threshold: 0, rootMargin: "0px" },
      );

      observer.observe(sentinel);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(updateFloatDateLayout);
    return () => cancelAnimationFrame(frame);
  }, [open, slideDateKeys, centerDateKey, updateFloatDateLayout]);

  useEffect(() => {
    if (!open) return undefined;
    const grid = gridWrapRef.current;
    if (!grid) return undefined;

    const observer = new ResizeObserver(() => {
      updateFloatDateLayout();
    });
    observer.observe(grid);
    return () => observer.disconnect();
  }, [open, updateFloatDateLayout]);

  const canLoadTimetableForDate = useCallback(
    (targetDateKey) =>
      hasWeeklyTimetableForDateKey(activeWeeklyTimetable, targetDateKey),
    [activeWeeklyTimetable],
  );

  const isTimetableLoadedForDate = useCallback(
    (targetDateKey) => Boolean(timetableLoadedByDate[targetDateKey]),
    [timetableLoadedByDate],
  );

  const isTimetableButtonEnabled = useCallback(
    (targetDateKey) =>
      canLoadTimetableForDate(targetDateKey) ||
      isTimetableLoadedForDate(targetDateKey),
    [canLoadTimetableForDate, isTimetableLoadedForDate],
  );

  const isRequestedDate = useCallback(
    (targetDateKey) => requestedDates.has(targetDateKey),
    [requestedDates],
  );

  const setSwiperTouchEnabled = useCallback((enabled) => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    swiper.allowTouchMove = enabled;
  }, []);

  const detachDragListeners = useCallback(() => {
    const listeners = dragListenersRef.current;
    if (!listeners) return;
    window.removeEventListener("pointermove", listeners.move);
    window.removeEventListener("pointerup", listeners.up);
    window.removeEventListener("pointercancel", listeners.cancel);
    dragListenersRef.current = null;
  }, []);

  const applyDragRange = useCallback(() => {
    const anchor = dragAnchorRef.current;
    if (!anchor) return;
    const endHour = dragEndRef.current ?? anchor.hour;
    setHoursByDate((prev) => ({
      ...prev,
      [anchor.dateKey]: mergeHourRangePaint(
        dragBaseHoursRef.current,
        anchor.hour,
        endHour,
        paintSelectRef.current,
      ),
    }));
  }, []);

  const clearDrag = useCallback(() => {
    detachDragListeners();
    pendingPressRef.current = false;
    rangeArmedRef.current = false;
    horizontalSwipeRef.current = false;
    pointerStartRef.current = null;
    dragAnchorRef.current = null;
    dragEndRef.current = null;
    dragBaseHoursRef.current = [];
    if (
      captureTargetRef.current?.releasePointerCapture &&
      pointerIdRef.current != null
    ) {
      try {
        captureTargetRef.current.releasePointerCapture(pointerIdRef.current);
      } catch {
        /* ignore */
      }
    }
    pointerIdRef.current = null;
    captureTargetRef.current = null;
    setSwiperTouchEnabled(true);
    setIsRangeDragging(false);
  }, [detachDragListeners, setSwiperTouchEnabled]);

  const cancelPendingPress = useCallback(() => {
    pendingPressRef.current = false;
    pointerStartRef.current = null;
    if (!rangeArmedRef.current) {
      dragAnchorRef.current = null;
      dragEndRef.current = null;
      detachDragListeners();
    }
  }, [detachDragListeners]);

  const armRangeSelection = useCallback(() => {
    if (rangeArmedRef.current) return;
    if (!pendingPressRef.current || !dragAnchorRef.current) return;
    const anchor = dragAnchorRef.current;
    const base = hoursByDateRef.current[anchor.dateKey] ?? [];
    dragBaseHoursRef.current = [...base];
    paintSelectRef.current = !base.includes(anchor.hour);
    rangeArmedRef.current = true;
    if (
      captureTargetRef.current?.setPointerCapture &&
      pointerIdRef.current != null
    ) {
      try {
        captureTargetRef.current.setPointerCapture(pointerIdRef.current);
      } catch {
        /* ignore */
      }
    }
    setSwiperTouchEnabled(false);
    setIsRangeDragging(true);
    applyDragRange();
  }, [applyDragRange, setSwiperTouchEnabled]);

  const updateDragEnd = useCallback(
    (clientX, clientY) => {
      const anchor = dragAnchorRef.current;
      if (!anchor) return;
      const hour =
        resolveHourFromPointer(
          document.elementFromPoint(clientX, clientY),
          clientY,
          visibleHoursRef.current,
        ) ??
        resolveHourFromSlotsContainer(
          captureTargetRef.current,
          clientY,
          visibleHoursRef.current,
        );
      if (hour == null || hour === dragEndRef.current) return;
      dragEndRef.current = hour;
      applyDragRange();
    },
    [applyDragRange],
  );

  const toggleHourInState = useCallback((targetDateKey, hour) => {
    setHoursByDate((prev) => {
      const current = prev[targetDateKey] ?? [];
      const isRemoving = current.includes(hour);
      const nextHours = isRemoving
        ? current.filter((h) => h !== hour)
        : [...current, hour].sort((a, b) => a - b);

      if (isRemoving) {
        setLabelsByDate((labelPrev) => {
          const dayLabels = { ...(labelPrev[targetDateKey] ?? {}) };
          delete dayLabels[hour];
          return { ...labelPrev, [targetDateKey]: dayLabels };
        });
      }

      return { ...prev, [targetDateKey]: nextHours };
    });
  }, []);

  const attachDragListeners = useCallback(() => {
    detachDragListeners();

    const handleMove = (event) => {
      if (!pendingPressRef.current && !rangeArmedRef.current) return;

      const start = pointerStartRef.current;
      if (!rangeArmedRef.current && start) {
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;

        if (
          !rangeArmedRef.current &&
          Math.abs(dx) > DRAG_ARM_PX &&
          Math.abs(dx) > Math.abs(dy)
        ) {
          horizontalSwipeRef.current = true;
          cancelPendingPress();
          gestureBeforeRef.current = null;
          const swiper = swiperRef.current;
          if (swiper) {
            if (dx < 0) swiper.slideNext();
            else swiper.slidePrev();
          }
          return;
        }

        if (Math.abs(dy) > DRAG_ARM_PX && Math.abs(dy) > Math.abs(dx)) {
          armRangeSelection();
        }
      }

      if (rangeArmedRef.current) {
        event.preventDefault();
        updateDragEnd(event.clientX, event.clientY);
      }
    };

    const handleUp = (event) => {
      if (horizontalSwipeRef.current) {
        clearDrag();
        return;
      }

      if (rangeArmedRef.current) {
        updateDragEnd(event.clientX, event.clientY);
        commitGestureIfChanged();
        clearDrag();
        return;
      }

      if (pendingPressRef.current && dragAnchorRef.current) {
        const { dateKey: targetDateKey, hour } = dragAnchorRef.current;
        toggleHourInState(targetDateKey, hour);
        commitGestureIfChanged();
        clearDrag();
        return;
      }

      gestureBeforeRef.current = null;
      clearDrag();
    };

    const handleCancel = () => {
      gestureBeforeRef.current = null;
      clearDrag();
    };

    dragListenersRef.current = {
      move: handleMove,
      up: handleUp,
      cancel: handleCancel,
    };

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
  }, [
    armRangeSelection,
    cancelPendingPress,
    clearDrag,
    commitGestureIfChanged,
    detachDragListeners,
    toggleHourInState,
    updateDragEnd,
  ]);

  const handleSlotsPointerDown = useCallback(
    (targetDateKey, event) => {
      if (saving || event.button !== 0) return;
      if (event.target.closest(".clubScheduleEditor__dateWeeklyBtn")) return;

      const hour = resolveHourFromPointer(
        event.target,
        event.clientY,
        visibleHoursRef.current,
      );
      if (hour == null) return;

      clearDrag();
      beginGesture();
      pendingPressRef.current = true;
      dragAnchorRef.current = { dateKey: targetDateKey, hour };
      dragEndRef.current = hour;
      pointerIdRef.current = event.pointerId;
      captureTargetRef.current = event.currentTarget;
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
      attachDragListeners();
    },
    [attachDragListeners, beginGesture, clearDrag, saving],
  );

  const handleUndo = useCallback(() => {
    if (saving || undoStack.length === 0) return;
    const snapshot = undoStack[undoStack.length - 1];
    const current = getCurrentSnapshot();
    applySnapshot(snapshot);
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, current]);
  }, [applySnapshot, getCurrentSnapshot, saving, undoStack]);

  const handleRedo = useCallback(() => {
    if (saving || redoStack.length === 0) return;
    const snapshot = redoStack[redoStack.length - 1];
    const current = getCurrentSnapshot();
    applySnapshot(snapshot);
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, current]);
  }, [applySnapshot, getCurrentSnapshot, redoStack, saving]);

  const handleLoadWeeklyTimetable = useCallback(
    async (targetDateKey) => {
      if (!targetDateKey || saving) return;

      const loaded = timetableLoadedByDate[targetDateKey];
      if (loaded) {
        pushUndoSnapshot(getCurrentSnapshot());
        setHoursByDate((prev) => ({
          ...prev,
          [targetDateKey]: (prev[targetDateKey] ?? []).filter(
            (hour) => !loaded.hours.includes(hour),
          ),
        }));
        setLabelsByDate((prev) => {
          const dayLabels = { ...(prev[targetDateKey] ?? {}) };
          for (const hour of loaded.hours) {
            const loadedLabel = loaded.labels[hour];
            if (loadedLabel !== undefined && dayLabels[hour] === loadedLabel) {
              delete dayLabels[hour];
            }
          }
          return { ...prev, [targetDateKey]: dayLabels };
        });
        setTimetableLoadedByDate((prev) => {
          const next = { ...prev };
          delete next[targetDateKey];
          return next;
        });
        return;
      }

      if (!activeWeeklyTimetable) {
        await modal("저장된 시간표가 없습니다.");
        return;
      }
      const entries = getWeeklyEntriesForDateKey(
        activeWeeklyTimetable,
        targetDateKey,
      );
      if (entries.length === 0) {
        await modal("이 요일에 등록된 시간이 없습니다.");
        return;
      }
      const weeklyHours = getWeeklyHoursForDateKey(
        activeWeeklyTimetable,
        targetDateKey,
      );
      const weeklyLabels = buildHourLabelsFromEntries(entries);
      pushUndoSnapshot(getCurrentSnapshot());
      setHoursByDate((prev) => ({
        ...prev,
        [targetDateKey]: mergeHourLists(prev[targetDateKey], weeklyHours),
      }));
      setLabelsByDate((prev) => ({
        ...prev,
        [targetDateKey]: mergeHourLabels(prev[targetDateKey], weeklyLabels),
      }));
      setTimetableLoadedByDate((prev) => ({
        ...prev,
        [targetDateKey]: {
          hours: weeklyHours,
          labels: weeklyLabels,
        },
      }));
      if (weeklyHours.some((hour) => hour >= 0 && hour <= DAWN_HOUR_END)) {
        setShowDawn(true);
      }
    },
    [
      activeWeeklyTimetable,
      getCurrentSnapshot,
      modal,
      pushUndoSnapshot,
      saving,
      timetableLoadedByDate,
    ],
  );

  const handleClose = async () => {
    if (saving) return;
    if (hasUnsavedChanges) {
      if (
        !(await modal(
          "편집한 내용이 저장되지 않습니다. 나가시겠습니까?",
          "confirm",
        ))
      ) {
        return;
      }
    }
    onClose();
  };

  if (!open || !dateKey) return null;

  const handleSlideChange = (swiper) => {
    const key = slideDateKeys[swiper.activeIndex];
    if (!key) return;
    setCenterDateKey(key);
    requestAnimationFrame(() => {
      setFloatDateItems(
        measureFloatDateItems(swiper, slideDateKeys, gridWrapRef.current),
      );
    });
    preloadHours(
      [
        key,
        slideDateKeys[swiper.activeIndex - 1],
        slideDateKeys[swiper.activeIndex + 1],
      ].filter(Boolean),
    );
  };

  const handleSave = async () => {
    if (!user?._id || saving) return;
    setSaving(true);
    try {
      const keysToSave = Object.keys(hoursByDate);
      for (const key of keysToSave) {
        const hours = hoursByDate[key] ?? [];
        const times = hoursToTimes(hours);
        const category = hours.length === 0 ? "temp" : "confirm";
        const original = timesToHours(scheduleMap?.get(key)?.times);
        const changed =
          hours.length !== original.length ||
          hours.some((h, i) => h !== original[i]);
        if (!changed) continue;

        const { schedule } = await saveMySchedule({
          date: key,
          times,
          category,
        });
        onScheduleSaved?.(key, schedule);
      }
      await modal("일정을 저장했습니다.");
      onSaveComplete?.();
    } catch (error) {
      await modal(error.response?.data?.message ?? "일정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className={[
        "clubScheduleEditor",
        isRangeDragging ? "clubScheduleEditor--rangeDrag" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="dialog"
      aria-modal="true"
    >
      <header className="clubScheduleEditor__header">
        <div className="clubScheduleEditor__headerLeft">
          <span className="clubScheduleEditor__month">{monthLabel}</span>
          <div className="clubScheduleEditor__nav">
            <button
              type="button"
              className="clubScheduleEditor__navBtn"
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="이전 날짜"
            >
              <IoChevronBack aria-hidden />
            </button>
            <button
              type="button"
              className="clubScheduleEditor__navBtn"
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="다음 날짜"
            >
              <IoChevronForward aria-hidden />
            </button>
          </div>
          <label className="clubScheduleEditor__dawnToggle">
            <input
              type="checkbox"
              className="clubScheduleEditor__dawnToggleInput"
              checked={showDawn}
              onChange={(event) => setShowDawn(event.target.checked)}
            />
            <span className="clubScheduleEditor__dawnToggleTrack" aria-hidden />
            <span className="clubScheduleEditor__dawnToggleLabel">
              새벽시간
            </span>
          </label>
        </div>
        <button
          type="button"
          className="clubScheduleEditor__close"
          onClick={() => void handleClose()}
        >
          닫기
        </button>
      </header>

      <div className="clubScheduleEditor__gridWrap" ref={gridWrapRef}>
        <div
          className={`clubScheduleEditor__floatDateRow${showFloatingDate ? " clubScheduleEditor__floatDateRow--visible" : ""}`}
          aria-hidden={!showFloatingDate}
        >
          {floatDateItems.map((item) => {
            const { day, week } = formatScheduleDateHeader(item.key);
            const isRequested = isRequestedDate(item.key);
            return (
              <div
                key={item.key}
                className={[
                  "clubScheduleEditor__floatDateCell",
                  isRequested
                    ? "clubScheduleEditor__floatDateCell--requested"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ left: item.left, width: item.width }}
              >
                <span className="clubScheduleEditor__dateDay">{day}</span>
                <span className="clubScheduleEditor__dateWeek">{week}</span>
                <button
                  type="button"
                  className={[
                    "clubScheduleEditor__dateWeeklyBtn",
                    isTimetableLoadedForDate(item.key)
                      ? "clubScheduleEditor__dateWeeklyBtn--loaded"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => void handleLoadWeeklyTimetable(item.key)}
                  disabled={saving || !isTimetableButtonEnabled(item.key)}
                >
                  {isTimetableLoadedForDate(item.key) ? "취소" : "시간표"}
                </button>
              </div>
            );
          })}
        </div>
        <div className="clubScheduleEditor__scrollArea" ref={scrollAreaRef}>
          <div className="clubScheduleEditor__scrollInner">
            <div className="clubScheduleEditor__timeCol" aria-hidden>
              <span
                ref={dateHeadSentinelRef}
                className="clubScheduleEditor__timeHeadSpacer"
                aria-hidden
              />
              {visibleHours.map((hour) => (
                <span key={hour} className="clubScheduleEditor__timeLabel">
                  {hour}시
                </span>
              ))}
            </div>

            <div className="clubScheduleEditor__swiperWrap">
              <Swiper
                className="clubScheduleEditor__daySwiper"
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                  requestAnimationFrame(updateFloatDateLayout);
                }}
                onSlideChange={handleSlideChange}
                onTransitionEnd={updateFloatDateLayout}
                initialSlide={initialSlideIndex}
                slidesPerView={SLIDES_PER_VIEW}
                centeredSlides
                slideToClickedSlide={false}
                spaceBetween={5}
                speed={280}
                touchRatio={1}
                resistanceRatio={0.65}
                watchSlidesProgress
              >
                {slideDateKeys.map((key) => {
                  const { day, week } = formatScheduleDateHeader(key);
                  const isRequested = isRequestedDate(key);
                  return (
                    <SwiperSlide
                      key={key}
                      className="clubScheduleEditor__daySlide"
                    >
                      <div className="clubScheduleEditor__dayPanel">
                        <div
                          className={[
                            "clubScheduleEditor__dateHead",
                            isRequested
                              ? "clubScheduleEditor__dateHead--requested"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <span className="clubScheduleEditor__dateDay">
                            {day}
                          </span>
                          <span className="clubScheduleEditor__dateWeek">
                            {week}
                          </span>
                          <button
                            type="button"
                            className={[
                              "clubScheduleEditor__dateWeeklyBtn",
                              isTimetableLoadedForDate(key)
                                ? "clubScheduleEditor__dateWeeklyBtn--loaded"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleLoadWeeklyTimetable(key);
                            }}
                            disabled={saving || !isTimetableButtonEnabled(key)}
                          >
                            {isTimetableLoadedForDate(key) ? "취소" : "시간표"}
                          </button>
                        </div>
                        <div
                          className="clubScheduleEditor__slots"
                          data-sched-slots-date={key}
                          onPointerDown={(event) =>
                            handleSlotsPointerDown(key, event)
                          }
                        >
                          {visibleHours.map((hour) => {
                            const selected = (hoursByDate[key] ?? []).includes(
                              hour,
                            );
                            const slotLabel = labelsByDate[key]?.[hour] ?? "";
                            return (
                              <button
                                key={`${key}-${hour}`}
                                type="button"
                                data-sched-hour={hour}
                                className={[
                                  "clubScheduleEditor__slot",
                                  selected
                                    ? "clubScheduleEditor__slot--selected"
                                    : "",
                                  slotLabel
                                    ? "clubScheduleEditor__slot--labeled"
                                    : "",
                                  hour <= DAWN_HOUR_END
                                    ? "clubScheduleEditor__slot--dawn"
                                    : "",
                                  hour < 12
                                    ? "clubScheduleEditor__slot--am"
                                    : "clubScheduleEditor__slot--pm",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                aria-pressed={selected}
                                aria-label={`${day} ${week} ${hour}시${slotLabel ? ` ${slotLabel}` : ""}`}
                              >
                                {slotLabel ? (
                                  <span className="clubScheduleEditor__slotLabel">
                                    {slotLabel}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          </div>
        </div>
      </div>

      <footer className="clubScheduleEditor__footer">
        <div className="clubScheduleEditor__footerActions">
          <button
            type="button"
            className="clubScheduleEditor__historyBtn"
            onClick={handleUndo}
            disabled={saving || !canUndo}
            aria-label="되돌리기"
            title="되돌리기"
          >
            <IoArrowUndoOutline aria-hidden />
          </button>
          <button
            type="button"
            className="clubScheduleEditor__historyBtn"
            onClick={handleRedo}
            disabled={saving || !canRedo}
            aria-label="다시 실행"
            title="다시 실행"
          >
            <IoArrowRedoOutline aria-hidden />
          </button>
          <button
            type="button"
            className="clubScheduleEditor__saveBtn"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </footer>
    </div>,
    document.body,
  );
};

export default ClubHomeScheduleEditor;
