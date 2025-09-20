const express = require("express");
const router = express.Router();
const Join = require("../models/Join");

router.post("/apply", async (req, res) => {
  try {
    const { name, major, grade, studentId, contact, wish } = req.body;
    const existingApplication = await Join.findOne({ studentId });
    if (existingApplication) {
      return res
        .status(401)
        .json({ message: "동일한 학번으로 신청 내역이 있습니다." });
    }
    const join = new Join({
      name: name,
      major: major,
      grade: grade,
      studentId: studentId,
      contact: contact,
      wish: wish,
    });
    await join.save();
    res.status(201).json({ message: "신청이 완료되었습니다." });
  } catch (error) {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});

//학번으로 가입여부 찾기 이름 최*범 반환

/*
//정보 가져오기 관리자 권한 설정하기
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

*/

router.delete("/:id", async (req, res) => {
  try {
    const join = await Join.findByIdAndDelete(req.params.id);
    if (!join) {
      return res.status(404).json({ message: "해당 신청을 찾을 수 없습니다." });
    }
    res.json({ message: "신청내역이 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

module.exports = router;
