import { categoryOf } from "./archiveCatalogData.js";

export const NOTICE_TAGS = ["행사", "공연"];

export const noticeTagsOf = (notice, event, date = notice.date) => {
  // 빈 배열도 명시적인 선택이다. 해제한 태그를 날짜로 다시 붙이지 않는다.
  if (Array.isArray(notice.tags)) return NOTICE_TAGS.filter((tag) => notice.tags.includes(tag));
  const tags = [];
  const start = event?.startDate || event?.eventDate;
  const end = event?.endDate || start;
  if (date && start && date >= start && date <= end) {
    tags.push("행사");
    if (categoryOf(event) === "공연") tags.push("공연");
  }
  return tags;
};
