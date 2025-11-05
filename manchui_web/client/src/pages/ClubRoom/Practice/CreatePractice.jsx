import React, { useState } from "react";
import "./CreatePractice.css";

const arrayOfHours = Array.from({ length: 24 }, (_, i) => i);

const CreatePractice = ({ setOpenCreatePractice, selectedDay, team }) => {
  const [date, setDate] = useState(selectedDay || new Date());
  const [selectedMembers, setSelectedMembers] = useState(team.members || []);

  const toggleMemberSelection = (member) => {
    if (selectedMembers.includes(member)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== member));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const countAbleMembers = (hour) => {
    if (selectedMembers.length === 0) {
      return { count: 0, ableMember: [] };
    }
    let count = 0;
    const ableMember = [];
    selectedMembers.forEach((member) => {
      const scheduleForDate = member.schedule.find(
        (s) =>
          new Date(s.date).toLocaleDateString() === date.toLocaleDateString()
      );
      if (
        scheduleForDate &&
        scheduleForDate.category === "confirm" &&
        scheduleForDate.times[hour] === 1
      ) {
        count += 1;
        ableMember.push(member);
      }
    });
    return { count: count, ableMember: ableMember };
  };

  return (
    <div className="createPractice">
      <div className="topMenu">
        <div className=""></div>
        <div className="date">{date.toLocaleDateString()}</div>
        <div
          className="closeButton"
          onClick={() => setOpenCreatePractice(false)}
        >
          X
        </div>
      </div>
      <div className="optionMenu">
        <div className="memberOption">
          <div className="choiceMember">
            {team.members.map((member) => (
              <div
                onClick={() => toggleMemberSelection(member)}
                className={`member ${
                  selectedMembers.includes(member) ? "selected" : ""
                }`}
                key={member.id}
              >
                {member.username}
              </div>
            ))}
          </div>
        </div>
        <div className="timeOption"></div>
      </div>
      <div className="practiceTime">
        {/* 오전 시간대 표시<div className="timeBar">
          <div className="">00~07</div>
          <div className="timeTable">
            {arrayOfHours.slice(0, 8).map((hour) => (
              <div className="timeCell" key={hour}>
                <div className="timeText">{hour}:00</div>
                <div className="availabilityIndicator">
                  <div>{countAbleMembers(hour).count}</div>
                  {selectedMembers.map((member) => (
                    <div
                      key={member.username}
                      className={`availabllity ${
                        countAbleMembers(hour).ableMember.some(
                          (item) => item._id === member._id
                        )
                          ? "available"
                          : ""
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="timeBar">
          <div className="">08~15</div>
          <div className="timeTable">
            {arrayOfHours.slice(8, 16).map((hour) => (
              <div className="timeCell" key={hour}>
                <div className="timeText">{hour}:00</div>
                <div className="availabilityIndicator">
                  <div>{countAbleMembers(hour).count}</div>
                  {selectedMembers.map((member) => (
                    <div
                      key={member.username}
                      className={`availabllity ${
                        countAbleMembers(hour).ableMember.some(
                          (item) => item._id === member._id
                        )
                          ? "available"
                          : ""
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div> */}

        <div className="timeBar">
          <div className="">16~23</div>
          <div className="timeTable">
            {arrayOfHours.slice(16, 24).map((hour) => (
              <div className="timeCell" key={hour}>
                <div className="timeText">{hour}:00</div>
                <div className="availabilityIndicator">
                  <div>{countAbleMembers(hour).count}</div>
                  {selectedMembers.map((member) => (
                    <div
                      key={member.username}
                      className={`availabllity ${
                        countAbleMembers(hour).ableMember.some(
                          (item) => item._id === member._id
                        )
                          ? "available"
                          : ""
                      }`}
                    ></div>
                  ))}
                </div>
                <div className="selectTimeButton">선택</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="actionButton">
        <div className="" onClick={() => console.log(selectedMembers[0])}>
          dd
        </div>
      </div>
    </div>
  );
};

//필요한 기능
//1. 날짜 선택
//2. 시간 선택
//3. 장소 입력
//4. 연습 멤버 선택 - 모두 선택 / 모두 해제
//5. 멤버 일정 종합
//6. 멤버 일정 겹치는 시간대 표시 - 시각적 표시-표에 겹칠수록 진하게 / 최초 화면 16~23시 표시 아침, 새벽은 따로 표기
//7. 연습 생성

// 1. 멤버 일정 기준으로 연습 가능한 시간 찾기
// 2. 연습 시간 기준으로 가능한 멤버 찾기

export default CreatePractice;
