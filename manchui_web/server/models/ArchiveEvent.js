const mongoose = require("mongoose");

/**
 * 임원진 아카이브: 행사 하나에 그 행사 때 쓴 공지글을 묶어서 보관.
 * 다음 임원진이 "작년 MT 공지 어떻게 했지?" 할 때 검색·참고용.
 */
/** 공지(올린 글, 공지 태그) · 일정(태그 없는 일반 항목) */
const NOTICE_KINDS = ["공지", "일정"];

/** 행사 카테고리 */
// 이전 분류도 허용하여 기존 기록의 공지 수정·저장이 계속 가능하게 한다.
const EVENT_CATEGORIES = ["공연", "활동", "운영", "기타", "자료", "동아리 활동", "동아리 운영"];

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    /** 타임라인 위치: 공지를 올린 날 YYYY-MM-DD (없으면 작성일) */
    date: { type: String, default: "", trim: true, maxlength: 10 },
    /** 기간이 있는 항목의 끝 날짜 (하루짜리는 빈 문자열) */
    endDate: { type: String, default: "", trim: true, maxlength: 10 },
    /** 타임라인 항목 종류 */
    kind: { type: String, enum: NOTICE_KINDS, default: "공지" },
    tags: { type: [{ type: String, enum: ["행사", "공연", "공지"] }], default: undefined },
    body: { type: String, default: "", maxlength: 20000 },
    authorName: { type: String, default: "", trim: true, maxlength: 40 },
  },
  { timestamps: true },
);

const archiveEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    /** 행사 기간 YYYY-MM-DD (없으면 빈 문자열). 하루짜리면 endDate = startDate */
    startDate: { type: String, default: "", trim: true, maxlength: 10 },
    endDate: { type: String, default: "", trim: true, maxlength: 10 },
    /** (예전 단일 날짜, 읽기 호환용) */
    eventDate: { type: String, default: "", trim: true, maxlength: 10 },
    category: { type: String, enum: EVENT_CATEGORIES, default: "기타" },
    /** 동일 행사·자료를 기수에 걸쳐 묶는 이름 */
    eventGroup: { type: String, default: "", trim: true, maxlength: 80 },
    /** 진행 기수 (예: 31). 없으면 null */
    generation: { type: Number, default: null },
    tags: { type: [String], default: [] },
    summary: { type: String, default: "", maxlength: 2000 },
    notices: { type: [noticeSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

archiveEventSchema.index({ startDate: -1, createdAt: -1 });

module.exports = mongoose.model("ArchiveEvent", archiveEventSchema);
module.exports.NOTICE_KINDS = NOTICE_KINDS;
module.exports.EVENT_CATEGORIES = EVENT_CATEGORIES;
