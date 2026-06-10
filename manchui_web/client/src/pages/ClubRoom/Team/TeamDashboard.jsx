import React, { useMemo, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import { buildScheduleRequestStatuses } from "./teamDashboardUtils";

const TeamDashboard = ({
  practiceCount = 0,
  members = [],
  requestSchedules = [],
  memberSchedules = [],
}) => {
  const [showRequests, setShowRequests] = useState(false);

  const requestStatuses = useMemo(
    () =>
      buildScheduleRequestStatuses(
        requestSchedules,
        members,
        memberSchedules,
      ),
    [requestSchedules, members, memberSchedules],
  );

  return (
    <div className="teamDashboard">
      <div className="teamDashboard__stats">
        <div className="teamDashboard__statCard">
          <span className="teamDashboard__statValue">{practiceCount}</span>
          <span className="teamDashboard__statLabel">등록된 연습</span>
        </div>
        <div className="teamDashboard__statCard">
          <span className="teamDashboard__statValue">
            {requestStatuses.length}
          </span>
          <span className="teamDashboard__statLabel">취합 요청 중</span>
        </div>
      </div>

      <section
        className="teamDashboard__section"
        aria-labelledby="team-dash-requests-title"
      >
        <button
          type="button"
          id="team-dash-requests-title"
          className="teamDashboard__sectionToggle"
          aria-expanded={showRequests}
          aria-controls="team-dash-requests-panel"
          onClick={() => setShowRequests((prev) => !prev)}
        >
          <span className="teamDashboard__sectionToggleLabel">
            일정 취합 응답 현황
            {requestStatuses.length > 0 ? (
              <span className="teamDashboard__sectionCount">
                {requestStatuses.length}
              </span>
            ) : null}
          </span>
          <IoChevronDown
            className={[
              "teamDashboard__sectionChevron",
              showRequests ? "teamDashboard__sectionChevron--open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden
          />
        </button>

        {showRequests ? (
          <div
            id="team-dash-requests-panel"
            className="teamDashboard__sectionPanel"
          >
            {requestStatuses.length === 0 ? (
              <p className="teamDashboard__empty">
                진행 중인 일정 취합 요청이 없습니다.
              </p>
            ) : (
              <ul className="teamDashboard__requestList">
                {requestStatuses.map((item) => {
                  const progress =
                    item.total > 0
                      ? Math.round((item.respondedCount / item.total) * 100)
                      : 0;

                  return (
                    <li key={item.dateKey} className="teamDashboard__requestItem">
                      <div className="teamDashboard__requestHead">
                        <div>
                          <p className="teamDashboard__requestDate">
                            {item.dateLabel}
                          </p>
                          <p className="teamDashboard__requestMeta">
                            {item.respondedCount} / {item.total}명 응답
                            {item.complete ? " · 전원 응답" : ""}
                          </p>
                        </div>
                        <span
                          className={[
                            "teamDashboard__requestBadge",
                            item.complete
                              ? "teamDashboard__requestBadge--complete"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {progress}%
                        </span>
                      </div>

                      <div
                        className="teamDashboard__progress"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${item.dateLabel} 응답 ${progress}%`}
                      >
                        <span
                          className="teamDashboard__progressFill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <ul
                        className="teamDashboard__memberList"
                        aria-label={`${item.dateLabel} 멤버별 응답`}
                      >
                        {item.responded.map((member) => (
                          <li
                            key={`${item.dateKey}-${member.id}-done`}
                            className="teamDashboard__memberChip teamDashboard__memberChip--done"
                          >
                            {member.name}
                          </li>
                        ))}
                        {item.pending.map((member) => (
                          <li
                            key={`${item.dateKey}-${member.id}-pending`}
                            className="teamDashboard__memberChip teamDashboard__memberChip--pending"
                          >
                            {member.name}
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default TeamDashboard;
