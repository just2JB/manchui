import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
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
  }, [open, dateKey, scheduleMap]);

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

  const handleLoadWeeklyTimetable = useCallback(
    async (targetDateKey) => {
      if (!targetDateKey) return;

      const loaded = timetableLoadedByDate[targetDateKey];
      if (loaded) {
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
    [activeWeeklyTimetable, modal, timetableLoadedByDate],
  );

  if (!open || !dateKey) return null;

  const toggleHour = (targetDateKey, hour) => {
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
  };

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

  const handleRevert = async () => {
    if (saving) return;
    if (!hasUnsavedChanges) {
      await modal("되돌릴 변경 내용이 없습니다.");
      return;
    }
    if (!(await modal("편집 내용을 되돌릴까요?", "confirm"))) return;
    setHoursByDate(cloneHoursMap(initialHoursByDateRef.current));
    setLabelsByDate(cloneLabelsMap(initialLabelsByDateRef.current));
    setTimetableLoadedByDate({});
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
    <div className="clubScheduleEditor" role="dialog" aria-modal="true">
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
          onClick={onClose}
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
                slideToClickedSlide
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
                        <div className="clubScheduleEditor__slots">
                          {visibleHours.map((hour) => {
                            const selected = (hoursByDate[key] ?? []).includes(
                              hour,
                            );
                            const slotLabel = labelsByDate[key]?.[hour] ?? "";
                            return (
                              <button
                                key={`${key}-${hour}`}
                                type="button"
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
                                onClick={() => toggleHour(key, hour)}
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
            className={[
              "clubScheduleEditor__revertBtn",
              hasUnsavedChanges ? "clubScheduleEditor__revertBtn--active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => void handleRevert()}
            disabled={saving}
          >
            되돌리기
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
