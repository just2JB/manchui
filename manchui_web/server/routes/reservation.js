const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");

router.post("/make", async (req, res) => {
  try {
    const { date, agentId, time } = req.body;
    const existingReservation = await Reservation.find({ date: date });

    for (let item of existingReservation) {
      const reservedTime = item.time;
      for (let reqTime of time) {
        if (reservedTime.includes(Number(reqTime))) {
          return res
            .status(401)
            .json({ message: "해당 시간은 이미 예약 되었습니다." });
        }
      }
    }

    const reservation = new Reservation({
      date: date,
      agentId: agentId,
      time: time,
    });
    await reservation.save();
    res.status(201).json({ message: "예약이 완료되었습니다." });
  } catch (error) {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});

router.get("/", async (req, res) => {
  try {
    const reservation = await Reservation.find();
    const sortDay = reservation.sort((a, b) => {
      if (new Date(a.date) > new Date(b.date)) {
        return 1;
      } else if (new Date(a.date) < new Date(b.date)) {
        return -1;
      } else {
        return 0;
      }
    });
    const sortTime = sortDay.sort((a, b) => {
      if (a.date === b.date) {
        if (Math.min(...a.time) > Math.min(...b.time)) {
          return 1;
        } else if (Math.min(...a.time) < Math.min(...b.time)) {
          return -1;
        }
      } else {
        return 0;
      }
    });

    res.json(sortTime);
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "해당 예약을 찾을 수 없습니다." });
    }
    res.json({ message: "예약이 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

module.exports = router;
