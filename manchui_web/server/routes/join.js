const express = require("express");
const router = express.Router();
const Join = require("../models/Join");
const User = require("../models/User");

router.post("/apply", async (req, res) => {
  try {
    const {
      name,
      academicState,
      college,
      major,
      grade,
      studentId,
      contact,
      wish,
    } = req.body;
    const existingApplication = await Join.findOne({ studentId });
    if (existingApplication) {
      return res
        .status(401)
        .json({ message: "동일한 학번으로 신청 내역이 있습니다." });
    }
    const join = new Join({
      name: name,
      major: major,
      academicState: academicState,
      college: college,
      grade: Number(grade),
      studentId: Number(studentId),
      contact: contact,
      wish: wish,
    });
    await join.save();
    res.status(201).json({ message: "신청이 완료되었습니다." });
  } catch (error) {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (user.position !== "임원진") {
      return res.status(401).json({ message: "권한이 없습니다." });
    }
    const join = await Join.find();
    res.json({
      joinData: join,
      message: "성공적으로 불러왔습니다.",
    });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

router.get("/check/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const join = await Join.findOne({ studentId });
    if (!join) {
      return res.status(401).json({ message: "신청 이력이 없습니다." });
    }

    let hashName = "";
    hashName = hashName + join.name[0] + "*";
    for (let i = 0; i < join.name.length - 3; i++) {
      hashName = hashName + "*";
    }
    if (join.name.length > 2) {
      hashName = hashName + join.name[join.name.length - 1];
    }

    const sendData = {
      name: hashName,
      major: join.major,
      applyAt: join.applyAt,
    };
    res.json({
      join: sendData,

      message: "성공적으로 불러왔습니다.",
    });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

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
