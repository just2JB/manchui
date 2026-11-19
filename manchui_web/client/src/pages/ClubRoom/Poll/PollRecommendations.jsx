import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IoSparklesOutline } from "react-icons/io5";
import {
  buildPollRecommendations,
  formatPollDateShort,
  formatPollHourRange,
  getRespondents,
} from "./pollUtils";

/**
 * 팀장용 추천 연습시간.
 * 같은 사람들이 처음부터 끝까지 가능한 2시간+ 구간을 겹치지 않게 골라 보여 준다.
 */
const PollRecommendations = ({
  poll,
  teamId,
  pendingMembers = [],
  limit = 3,
  compact = false,
}) => {
  const nav = useNavigate();
  const recommendations = useMemo(
    () => buildPollRecommendations(poll, { limit }),
    [poll, limit],
  );
  const respondentCount = getRespondents(poll).length;

  const goCreate = (item) => {
    const params = new URLSearchParams({
      poll: poll._id,
      pick: `${item.dateKey}:${item.startHour}-${item.endHour}`,
    });
    nav(`/club/team/${teamId}/practice/new?${params.toString()}`);
  };

  return (
    <section
      className={`pollRec${compact ? " pollRec--compact" : ""}`}
      aria-label="추천 연습시간"
    >
      <div className="pollRec__head">
        <p className="pollRec__title">
          <IoSparklesOutline aria-hidden /> 추천 연습시간
        </p>
        <span className="pollRec__meta">{respondentCount}명 응답 기준</span>
      </div>

      {recommendations.length === 0 ? (
        <p className="pollRec__empty">
          {respondentCount === 0
            ? "아직 응답이 없어요. 링크를 공유해 보세요."
            : "2시간 이상 함께 가능한 시간이 아직 없어요."}
        </p>
      ) : (
        <ol className="pollRec__list">
          {recommendations.map((item, index) => {
            const ratio = item.total > 0 ? item.available.length / item.total : 0;
            return (
              <li
                key={item.id}
                className={[
                  "pollRec__item",
                  index === 0 ? "pollRec__item--best" : "",
                  item.allAvailable ? "pollRec__item--all" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="pollRec__rank" aria-label={`${index + 1}순위`}>
                  {index + 1}
                </span>
                <div className="pollRec__body">
                  <p className="pollRec__when">
                    <span className="pollRec__date">
                      {formatPollDateShort(item.dateKey)}
                    </span>
                    <span className="pollRec__time">
                      {formatPollHourRange(item.startHour, item.endHour)}
                    </span>
                    <span className="pollRec__dur">{item.duration}시간</span>
                  </p>
                  <div className="pollRec__countRow">
                    <span
                      className="pollRec__bar"
                      role="img"
                      aria-label={`${item.total}명 중 ${item.available.length}명 가능`}
                    >
                      <span
                        className="pollRec__barFill"
                        style={{ width: `${Math.round(ratio * 100)}%` }}
                      />
                    </span>
                    <span className="pollRec__count">
                      {item.allAvailable
                        ? "전원 가능"
                        : `${item.available.length}/${item.total}명`}
                    </span>
                  </div>
                  {!compact || index === 0 ? (
                    item.unavailable.length > 0 ? (
                      <p className="pollRec__missing">
                        불가 · {item.unavailable.map((r) => r.name).join(", ")}
                      </p>
                    ) : null
                  ) : null}
                </div>
                <button
                  type="button"
                  className="pollRec__cta"
                  onClick={() => goCreate(item)}
                  aria-label={`${formatPollDateShort(item.dateKey)} ${formatPollHourRange(item.startHour, item.endHour)} 연습 만들기`}
                >
                  연습 만들기
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {pendingMembers.length > 0 ? (
        <p className="pollRec__pending">
          미응답 팀원 {pendingMembers.length}명 ·{" "}
          {pendingMembers.map((member) => member.username).join(", ")}
        </p>
      ) : null}
    </section>
  );
};

export default PollRecommendations;
