const express = require("express");
const router = express.Router();
const Join = require("../models/Join");
const User = require("../models/User");
const Setting = require("../models/Setting");

router.get("/config", async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({ joinForm: 0, currentGeneration: 1 });
    }
    res.json({
      formOpen: setting.joinForm === 1,
      currentGeneration: setting.currentGeneration ?? 1,
      siteRestricted: Boolean(setting.siteRestricted),
    });
  } catch (err) {
    res.status(500).json({ message: "서버 오류가 발생하였습니다." });
  }
});

router.put("/config", async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) return res.status(401).json({ message: "권한이 없습니다." });
    const user = await User.findById(userId);
    if (!user || user.position !== "임원진") {
      return res.status(401).json({ message: "권한이 없습니다." });
    }
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({ joinForm: 0, currentGeneration: 1 });
    }
    if (typeof req.body.formOpen === "boolean") {
      setting.joinForm = req.body.formOpen ? 1 : 0;
    }
    const raw = Number(req.body.currentGeneration);
    const gen = raw >= 1 ? Math.round(raw * 2) / 2 : null;
    if (gen !== null) setting.currentGeneration = gen;
    if (typeof req.body.siteRestricted === "boolean") {
      setting.siteRestricted = req.body.siteRestricted;
    }
    await setting.save();
    res.json({
      formOpen: setting.joinForm === 1,
      currentGeneration: setting.currentGeneration,
      siteRestricted: Boolean(setting.siteRestricted),
      message: "설정이 저장되었습니다.",
    });
  } catch (err) {
    res.status(500).json({ message: "서버 오류가 발생하였습니다." });
  }
});

router.post("/apply", async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting)
      setting = await Setting.create({ joinForm: 0, currentGeneration: 1 });
    if (setting.joinForm !== 1) {
      return res
        .status(403)
        .json({ message: "현재 가입 신청을 받고 있지 않습니다." });
    }
    const currentGen = setting.currentGeneration ?? 1;
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

    const join = new Join({
      name,
      major,
      academicState,
      college,
      grade: Number(grade),
      studentId: Number(studentId),
      contact,
      wish,
      generation: currentGen,
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
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ message: "올바른 학번을 입력해주세요." });
    }
    const joins = await Join.find({ studentId }).sort({ applyAt: -1 });
    if (!joins.length) {
      return res.status(404).json({ message: "신청 이력이 없습니다." });
    }

    const list = joins.map((join) => {
      let hashName = "";
      if (join.name && join.name.length > 0) {
        hashName = hashName + join.name[0] + "*";
        for (let i = 0; i < join.name.length - 3; i++) {
          hashName = hashName + "*";
        }
        if (join.name.length > 2) {
          hashName = hashName + join.name[join.name.length - 1];
        }
      }
      return {
        name: hashName,
        major: join.major,
        applyAt: join.applyAt,
        generation: join.generation ?? 1,
        status: join.status || "신청",
      };
    });

    res.json({
      list,
      message: "성공적으로 불러왔습니다.",
    });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) return res.status(401).json({ message: "권한이 없습니다." });
    const admin = await User.findById(userId);
    if (!admin || admin.position !== "임원진") {
      return res.status(401).json({ message: "권한이 없습니다." });
    }
    const validStatus = ["신청", "입금확인", "톡방초대완료"];
    const status = req.body.status;
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: "올바른 상태가 아닙니다." });
    }
    const join = await Join.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!join) {
      return res.status(404).json({ message: "해당 신청을 찾을 수 없습니다." });
    }
    res.json({ join, message: "상태가 변경되었습니다." });
  } catch (err) {
    res.status(500).json({ message: "서버 오류가 발생하였습니다." });
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
