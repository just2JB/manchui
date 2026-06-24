const express = require("express");
const router = express.Router();
const {
  WeeklyTimetable,
  WEEKDAY_KEYS,
  emptyDays,
} = require("../models/WeeklyTimetable");
const requireAuth = require("../middleware/requireAuth");

function normalizeHours(raw) {
  if (!Array.isArray(raw)) return [];
  const set = new Set();
  for (const value of raw) {
    const hour = Number(value);
    if (!Number.isNaN(hour) && hour >= 0 && hour <= 23) {
      set.add(hour);
    }
  }
  return [...set].sort((a, b) => a - b);
}

function normalizeDays(raw) {
  const base = emptyDays();
  if (!raw) return base;

  for (const key of WEEKDAY_KEYS) {
    let value;
    if (raw instanceof Map) {
      value = raw.get(key);
    } else if (typeof raw === "object") {
      value = raw[key];
    }
    base[key] = normalizeHours(value);
  }
  return base;
}

function hoursToEntries(days) {
  const entries = [];
  for (const weekday of WEEKDAY_KEYS) {
    const hours = normalizeHours(days[weekday]);
    if (hours.length === 0) continue;

    let start = hours[0];
    let prev = hours[0];
    for (let index = 1; index < hours.length; index += 1) {
      const hour = hours[index];
      if (hour === prev + 1) {
        prev = hour;
        continue;
      }
      entries.push({
        weekday,
        name: "일정",
        startHour: start,
        endHour: prev,
      });
      start = hour;
      prev = hour;
    }
    entries.push({
      weekday,
      name: "일정",
      startHour: start,
      endHour: prev,
    });
  }
  return entries;
}

function entryToHours(entry) {
  const start = Math.min(entry.startHour, entry.endHour);
  const end = Math.max(entry.startHour, entry.endHour);
  const hours = [];
  for (let hour = start; hour <= end; hour += 1) {
    hours.push(hour);
  }
  return hours;
}

function entriesToDays(entries) {
  const days = emptyDays();
  for (const entry of entries) {
    const weekday = entry.weekday;
    if (!WEEKDAY_KEYS.includes(weekday)) continue;
    const merged = new Set([...days[weekday], ...entryToHours(entry)]);
    days[weekday] = [...merged].sort((a, b) => a - b);
  }
  return days;
}

function normalizeMinute(value, fallback = 0) {
  const minute = Number(value);
  if (Number.isNaN(minute) || minute < 0 || minute > 59) return fallback;
  return Math.round(minute / 5) * 5;
}

function normalizeEntry(raw) {
  if (!raw || typeof raw !== "object") return null;
  const weekday = String(raw.weekday ?? "").trim();
  if (!WEEKDAY_KEYS.includes(weekday)) return null;

  const name = String(raw.name ?? "").trim();
  if (!name) return null;

  const startHour = Number(raw.startHour);
  const endHour = Number(raw.endHour);
  if (
    Number.isNaN(startHour) ||
    Number.isNaN(endHour) ||
    startHour < 0 ||
    startHour > 23 ||
    endHour < 0 ||
    endHour > 23
  ) {
    return null;
  }

  const normalizedStartHour = Math.min(startHour, endHour);
  const normalizedEndHour = Math.max(startHour, endHour);
  let startMinute = normalizeMinute(raw.startMinute, 0);
  let endMinute = normalizeMinute(raw.endMinute, 0);

  if (
    normalizedStartHour === normalizedEndHour &&
    startMinute > endMinute
  ) {
    [startMinute, endMinute] = [endMinute, startMinute];
  }

  const entry = {
    weekday,
    name,
    startHour: normalizedStartHour,
    endHour: normalizedEndHour,
    startMinute,
    endMinute,
  };

  if (raw._id) entry._id = raw._id;
  return entry;
}

function normalizeEntries(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeEntry).filter(Boolean);
}

function serializeTimetable(doc) {
  const plain = doc.toObject ? doc.toObject() : doc;
  let entries = normalizeEntries(plain.entries);

  if (entries.length === 0) {
    const legacyDays = normalizeDays(plain.days);
    const hasLegacyHours = WEEKDAY_KEYS.some(
      (key) => (legacyDays[key] ?? []).length > 0,
    );
    if (hasLegacyHours) {
      entries = hoursToEntries(legacyDays);
    }
  }

  return {
    _id: plain._id,
    name: plain.name,
    isActive: Boolean(plain.isActive),
    entries,
  };
}

async function setActiveTimetable(userId, timetableId) {
  await WeeklyTimetable.updateMany(
    { userId: String(userId) },
    { $set: { isActive: false } },
  );
  await WeeklyTimetable.findByIdAndUpdate(timetableId, {
    $set: { isActive: true },
  });
}

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const userId = String(req.userId);
    let timetables = await WeeklyTimetable.find({ userId }).sort({
      createdAt: 1,
    });

    if (timetables.length === 0) {
      const created = await WeeklyTimetable.create({
        userId,
        name: "기본 시간표",
        isActive: true,
        entries: [],
        days: emptyDays(),
      });
      timetables = [created];
    } else if (!timetables.some((item) => item.isActive)) {
      timetables[0].isActive = true;
      await timetables[0].save();
    }

    const active =
      timetables.find((item) => item.isActive) ?? timetables[0];

    res.json({
      timetables: timetables.map(serializeTimetable),
      activeTimetable: serializeTimetable(active),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = String(req.userId);
    const name = String(req.body?.name ?? "").trim() || "새 시간표";
    const count = await WeeklyTimetable.countDocuments({ userId });
    const shouldActivate = Boolean(req.body?.activate) || count === 0;

    if (shouldActivate) {
      await WeeklyTimetable.updateMany({ userId }, { $set: { isActive: false } });
    }

    const timetable = await WeeklyTimetable.create({
      userId,
      name,
      isActive: shouldActivate,
      entries: [],
      days: emptyDays(),
    });

    res.status(201).json({
      message: "시간표가 추가되었습니다.",
      timetable: serializeTimetable(timetable),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const timetable = await WeeklyTimetable.findById(req.params.id);
    if (!timetable || String(timetable.userId) !== String(req.userId)) {
      return res.status(404).json({ message: "시간표를 찾을 수 없습니다." });
    }

    if (req.body?.name != null) {
      const name = String(req.body.name).trim();
      if (name) timetable.name = name;
    }

    if (req.body?.entries != null) {
      const entries = normalizeEntries(req.body.entries);
      timetable.entries = entries;
      timetable.days = entriesToDays(entries);
      timetable.markModified("entries");
      timetable.markModified("days");
    } else if (req.body?.days != null) {
      const days = normalizeDays(req.body.days);
      timetable.days = days;
      timetable.entries = hoursToEntries(days);
      timetable.markModified("days");
      timetable.markModified("entries");
    }

    await timetable.save();
    res.json({
      message: "시간표가 저장되었습니다.",
      timetable: serializeTimetable(timetable),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.patch("/:id/activate", requireAuth, async (req, res) => {
  try {
    const timetable = await WeeklyTimetable.findById(req.params.id);
    if (!timetable || String(timetable.userId) !== String(req.userId)) {
      return res.status(404).json({ message: "시간표를 찾을 수 없습니다." });
    }

    await setActiveTimetable(req.userId, timetable._id);
    timetable.isActive = true;

    res.json({
      message: "시간표가 선택되었습니다.",
      timetable: serializeTimetable(timetable),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const timetable = await WeeklyTimetable.findById(req.params.id);
    if (!timetable || String(timetable.userId) !== String(req.userId)) {
      return res.status(404).json({ message: "시간표를 찾을 수 없습니다." });
    }

    const wasActive = timetable.isActive;
    await WeeklyTimetable.findByIdAndDelete(req.params.id);

    if (wasActive) {
      const next = await WeeklyTimetable.findOne({
        userId: String(req.userId),
      }).sort({ createdAt: 1 });
      if (next) {
        next.isActive = true;
        await next.save();
      }
    }

    res.json({ message: "시간표가 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
