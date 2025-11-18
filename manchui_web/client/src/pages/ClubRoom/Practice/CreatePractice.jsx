import React, { useState } from "react";
import "./CreatePractice.css";
import axios from "axios";
const serverUrl = import.meta.env.VITE_SERVER_URL;
import { IoCloseOutline, IoFilter } from "react-icons/io5";
import { HiUserGroup } from "react-icons/hi";
import { MdOutlineAccessTime, MdOutlinePlace } from "react-icons/md";

const arrayOfHours = Array.from({ length: 48 }, (_, i) => i);

const CreatePractice = ({
  setOpenCreatePractice,
  selectedDay,
  team,
  getPractice,
  selectedDayPractice,
}) => {
  const [date, setDate] = useState(selectedDay || new Date());
  const [selectedMembers, setSelectedMembers] = useState(team.members || []);
  const [openTimeTable, setOpenTimeTable] = useState(3);
  const [place, setPlace] = useState("미확정");

  const [selectHours, setSelectHours] = useState([]);
  const [anchor, setAnchor] = useState(-1);
  const [selectDaySchedules, setSelectDaySchedules] = useState(
    team.memberSchedules.filter(
      (schedule) =>
        new Date(schedule.date).toLocaleDateString() ===
        selectedDay.toLocaleDateString()
    )
  );
  const selectedDayPracticeArray = () => {
    const data = [];
    selectedDayPractice.forEach((practice) => {
      const time = practice.time.split("~");
      for (let i = 0; i < Number(time[1] * 2) - Number(time[0] * 2); i++) {
        data.push(Number(time[0] * 2) + i);
      }
    });
    return data;
  };
  const [reservedTime, setReservedTime] = useState(
    selectedDayPracticeArray() || []
  );

  const toggleMemberSelection = (member) => {
    if (selectedMembers.includes(member)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== member));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const toggleHourSelection = (hour) => {
    if (selectHours.length < 1) {
      setAnchor(hour);
      setSelectHours([hour]);
      return;
    }
    if (hour < anchor) {
      setAnchor(hour);
      setSelectHours([hour]);
      return;
    } else if (hour > anchor) {
      let newHours = [];
      for (let i = 0; i < hour - anchor + 1; i++) {
        newHours.push(anchor + i);
        if (reservedTime.includes(anchor + i)) {
          alert("중간에 선택불가능한 시간이 있습니다.");
          return;
        }
      }

      setSelectHours(newHours);
      return;
    } else {
      setSelectHours([]);
      setAnchor(-1);
      return;
    }
  };

  const selectAllMembers = () => {
    if (selectedMembers.length === team.members.length) {
      setSelectedMembers([]);
      return;
    } else {
      setSelectedMembers(team.members);
    }
  };

  const countAbleMembers = (hour) => {
    if (selectedMembers.length === 0) {
      return { count: 0, ableMember: [] };
    }
    let count = 0;
    const ableMember = [];
    selectDaySchedules.forEach((schedule) => {
      if (
        schedule &&
        schedule.category !== "temp" &&
        schedule.times[hour] === 1
      ) {
        count += 1;
        ableMember.push(
          team.members.find((member) => member._id === schedule.userId)
        );
      }
    });
    return { count: count, ableMember: ableMember };
  };
  const getFomatDate = (localeDateString) => {
    const year = localeDateString.split(".")[0];
    const month =
      localeDateString.split(".")[1].length === 1
        ? "0" + localeDateString.split(".")[1]
        : localeDateString.split(".")[1];
    const date =
      localeDateString.split(".")[2].length === 1
        ? "0" + localeDateString.split(".")[2]
        : localeDateString.split(".")[2];
    return `${year}-${month}-${date}`;
  };

  const createPracticeHandle = async () => {
    if (selectHours.length === 0) {
      return;
    }
    const reqData = {
      teamId: team._id,
      date: getFomatDate(date.toLocaleDateString()),
      time:
        selectHours[0] / 2 +
        "~" +
        (selectHours[selectHours.length - 1] / 2 + 0.5),
      members: selectedMembers.map((member) => member._id),
      place: place,
    };
    try {
      const response = await axios.post(
        `${serverUrl}/api/practice/create`,
        reqData,
        {
          withCredentials: true,
        }
      );
      alert(response.data.message);
      setOpenCreatePractice(false);
      await getPractice();
    } catch (error) {
      alert("서버 에러입니다.");
    }
  };

  return (
    <div className="createPractice">
      <div className="topMenu">
        <div className="dateBar">
          <div className=""></div>
          <div className="date">
            {date.getFullYear()}년 {date.getMonth() + 1}월 {date.getDate()}일
          </div>
          <div
            className="closeButton"
            onClick={() => setOpenCreatePractice(false)}
          >
            <IoCloseOutline style={{ fontSize: "20px" }} />
          </div>
        </div>
        <div className="memberOption">
          <div className="obtionLable">연습 인원</div>
          <div className="choiceMember">
            <div
              className={`member selectAllMembers ${
                selectedMembers.length === team.members.length
                  ? "allSelected"
                  : ""
              }`}
              onClick={() => selectAllMembers()}
            >
              <p>
                {selectedMembers.length === team.members.length
                  ? "모두 해제"
                  : "모두 참여"}
              </p>
            </div>
            {team.members.map((member) => (
              <div
                onClick={() => toggleMemberSelection(member)}
                className={`member ${
                  selectedMembers.includes(member) ? "selected" : ""
                }`}
                key={member._id}
              >
                {member.username}
              </div>
            ))}
          </div>
        </div>
        <div className="practiceTime">
          <div
            className={`timeBar ${openTimeTable === 1 ? "openThisTable" : ""}`}
          >
            <div
              className={`timeOpenContainer ${
                openTimeTable === 1 ? "openTableTimeContainer" : ""
              }`}
              onClick={() =>
                openTimeTable === 1 ? setOpenTimeTable(0) : setOpenTimeTable(1)
              }
            >
              <div className=""></div>
              <div className="">새벽(00~07)</div>
              <div className="moreInfo"></div>
            </div>
            <div className="timeTable">
              {arrayOfHours.slice(0, 16).map((hour) => (
                <div
                  className={`timeCell ${
                    selectHours.includes(hour) ? "select" : ""
                  } ${reservedTime.includes(hour) ? "reserved" : ""}`}
                  key={hour}
                >
                  <div className="timeText">
                    {hour % 2 === 0 ? `${hour / 2}:00` : `${(hour - 1) / 2}:30`}
                  </div>

                  <div className="availabilityIndicator">
                    <div className="ableCount">
                      {countAbleMembers(hour).count}
                    </div>
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
                      >
                        <div className="hoverName">{member.username}</div>
                      </div>
                    ))}
                  </div>
                  {reservedTime.includes(hour) ? (
                    <div className="selectTimeButton">완료</div>
                  ) : (
                    <div
                      className="selectTimeButton"
                      onClick={() => toggleHourSelection(hour)}
                    >
                      {selectHours.includes(hour) ? "해제" : "선택"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div
            className={`timeBar ${openTimeTable === 2 ? "openThisTable" : ""}`}
          >
            <div
              className={`timeOpenContainer ${
                openTimeTable === 2 ? "openTableTimeContainer" : ""
              }`}
              onClick={() =>
                openTimeTable === 2 ? setOpenTimeTable(0) : setOpenTimeTable(2)
              }
            >
              <div className=""></div>
              <div className="">아침(08~15)</div>
              <div className="moreInfo"></div>
            </div>
            <div className="timeTable">
              {arrayOfHours.slice(16, 32).map((hour) => (
                <div
                  className={`timeCell ${
                    selectHours.includes(hour) ? "select" : ""
                  } ${reservedTime.includes(hour) ? "reserved" : ""}`}
                  key={hour}
                >
                  <div className="timeText">
                    {hour % 2 === 0 ? `${hour / 2}:00` : `${(hour - 1) / 2}:30`}
                  </div>
                  <div className="availabilityIndicator">
                    <div className="ableCount">
                      {countAbleMembers(hour).count}
                    </div>
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
                      >
                        <div className="hoverName">{member.username}</div>
                      </div>
                    ))}
                  </div>
                  {reservedTime.includes(hour) ? (
                    <div className="selectTimeButton">완료</div>
                  ) : (
                    <div
                      className="selectTimeButton"
                      onClick={() => toggleHourSelection(hour)}
                    >
                      {selectHours.includes(hour) ? "해제" : "선택"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div
            className={`timeBar ${openTimeTable === 3 ? "openThisTable" : ""}`}
          >
            <div
              className={`timeOpenContainer ${
                openTimeTable === 3 ? "openTableTimeContainer" : ""
              }`}
              onClick={() =>
                openTimeTable === 3 ? setOpenTimeTable(0) : setOpenTimeTable(3)
              }
            >
              <div className=""></div>
              <div className="">저녁(16~23)</div>
              <div className="moreInfo"></div>
            </div>
            <div className="timeTable">
              {arrayOfHours.slice(32, 48).map((hour) => (
                <div
                  className={`timeCell ${
                    selectHours.includes(hour) ? "select" : ""
                  } ${reservedTime.includes(hour) ? "reserved" : ""}`}
                  key={hour}
                >
                  <div className="timeText">
                    {hour % 2 === 0 ? `${hour / 2}:00` : `${(hour - 1) / 2}:30`}
                  </div>
                  <div className="availabilityIndicator">
                    <div className="ableCount">
                      {countAbleMembers(hour).count}
                    </div>
                    {selectedMembers.map((member) => (
                      <div
                        key={member._id}
                        className={`availabllity ${
                          countAbleMembers(hour).ableMember.some(
                            (item) => item._id === member._id
                          )
                            ? "available"
                            : ""
                        }`}
                      >
                        <div className="hoverName">{member.username}</div>
                      </div>
                    ))}
                  </div>
                  {reservedTime.includes(hour) ? (
                    <div className="none"></div>
                  ) : (
                    <div
                      className="selectTimeButton"
                      onClick={() => toggleHourSelection(hour)}
                    >
                      {selectHours.includes(hour) ? "해제" : "선택"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bottomMenu">
        <div className="optionMenu"></div>
        <div className="endSection">
          <div className="practicePreview">
            <div>
              <div className="top">
                <div className="prTime">
                  <MdOutlineAccessTime />
                  {selectHours.length === 0 ? (
                    <span className="noTimeSelected">선택 안됨</span>
                  ) : (
                    <span>
                      {selectHours[0] % 2 === 0
                        ? `${selectHours[0] / 2}:00`
                        : `${selectHours[0] / 2 - 0.5}:30`}
                      ~
                      {selectHours[selectHours.length - 1] % 2 === 0
                        ? `${selectHours[selectHours.length - 1] / 2}:30`
                        : `${selectHours[selectHours.length - 1] / 2 + 0.5}:00`}
                    </span>
                  )}
                </div>
                <div className="prMember">
                  <HiUserGroup />
                  {selectedMembers.length}명
                </div>
              </div>
              <div className="prPlace">
                <span>
                  <MdOutlinePlace />
                  {place}
                </span>
                <div className="">연습실 보기</div>
              </div>
              <div className="clearButton" onClick={() => setSelectHours([])}>
                모두해제
              </div>
            </div>
          </div>

          <div className="actionButtons">
            <div
              className="createButton"
              onClick={() => createPracticeHandle()}
            >
              연습 생성
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePractice;
