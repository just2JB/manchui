import React, { useEffect, useState } from "react";
import "./CreatePractice.css";
import axios from "axios";
const serverUrl = import.meta.env.VITE_SERVER_URL;
import { IoCloseOutline, IoFilter } from "react-icons/io5";
import { HiUserGroup } from "react-icons/hi";
import { MdOutlineAccessTime, MdOutlinePlace } from "react-icons/md";

const arrayOfHours = Array.from({ length: 24 }, (_, i) => i);

const CreatePractice = ({
  setEditPractice,
  editPractice,
  team,
  getPractice,
  selectedDayPractice,
  deletePracticeHandle,
}) => {
  const [date, setDate] = useState(new Date(editPractice.date));
  const [selectedMembers, setSelectedMembers] = useState(team.members || []);
  const [openTimeTable, setOpenTimeTable] = useState(3);
  const [place, setPlace] = useState("미확정");
  const [selectHours, setSelectHours] = useState([]);
  const selectedDayPracticeArray = () => {
    const data = [];
    selectedDayPractice.forEach((practice) => {
      const time = practice.time.split("~");
      for (let i = 0; i < Number(time[1]) - Number(time[0]); i++) {
        if (practice._id !== editPractice._id) {
          data.push(Number(time[0]) + i);
        }
      }
    });
    return data;
  };
  const editDayPracticeArray = () => {
    const data = [];
    const time = editPractice.time.split("~");
    for (let i = 0; i < Number(time[1]) - Number(time[0]); i++) {
      data.push(Number(time[0]) + i);
    }

    return data;
  };
  const [reservedTime, setReservedTime] = useState(
    selectedDayPracticeArray() || []
  );

  const toggleMemberSelection = (member) => {
    if (selectedMembers.some((sMem) => sMem._id === member._id)) {
      setSelectedMembers(selectedMembers.filter((m) => m._id !== member._id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  //연속된 시간만 선택 가능하게 해야해!!@#!@#!@#!$@#$@ㅁㄴ
  const toggleHourSelection = (hour) => {
    if (selectHours.includes(hour)) {
      setSelectHours(
        selectHours.filter((h) => h !== hour).sort((a, b) => a - b)
      );
    } else {
      setSelectHours([...selectHours, hour].sort((a, b) => a - b));
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

  const editPracticeHandle = async () => {
    if (selectHours.length !== 0) {
      const reqData = {
        practiceId: editPractice._id,
        time: selectHours[0] + "~" + (selectHours[selectHours.length - 1] + 1),
        members: selectedMembers.map((member) => member._id),
        place: place,
      };
      try {
        const response = await axios.post(
          `${serverUrl}/api/practice/edit`,
          reqData,
          {
            withCredentials: true,
          }
        );
        alert(response.data.message);
        setEditPractice("unSelect");
        await getPractice();
      } catch (error) {
        alert("서버 에러입니다.");
      }
    }
  };

  useEffect(() => {
    const getEditPractice = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/practice/${editPractice._id}`,
          {
            withCredentials: true,
          }
        );

        setSelectedMembers(response.data.practice.members);
      } catch (error) {
        alert("서버 에러입니다.");
      }
    };
    getEditPractice();
    setSelectHours(editDayPracticeArray());
  }, []);

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
            onClick={() => setEditPractice("unSelect")}
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
                  selectedMembers.some((sMem) => sMem._id === member._id)
                    ? "selected"
                    : ""
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
              {arrayOfHours.slice(0, 8).map((hour) => (
                <div
                  className={`timeCell ${
                    selectHours.includes(hour) ? "select" : ""
                  } ${reservedTime.includes(hour) ? "reserved" : ""}`}
                  key={hour}
                >
                  <div className="timeText">{hour}:00</div>

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
                      ></div>
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
              {arrayOfHours.slice(8, 16).map((hour) => (
                <div
                  className={`timeCell ${
                    selectHours.includes(hour) ? "select" : ""
                  } ${reservedTime.includes(hour) ? "reserved" : ""}`}
                  key={hour}
                >
                  <div className="timeText">{hour}:00</div>

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
                      ></div>
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
              {arrayOfHours.slice(16, 24).map((hour) => (
                <div
                  className={`timeCell ${
                    selectHours.includes(hour) ? "select" : ""
                  } ${reservedTime.includes(hour) ? "reserved" : ""}`}
                  key={hour}
                >
                  <div className="timeText">{hour}:00</div>

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
                      ></div>
                    ))}
                  </div>
                  {reservedTime.includes(hour) ? (
                    <div className="selectTimeButton">--</div>
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
                  {editPractice.time}
                </div>
                <div className="prMember">
                  <HiUserGroup />
                  {selectedMembers.length}명
                </div>
              </div>
              <div className="prPlace">
                <MdOutlinePlace />
                미확정
              </div>
              <div
                className="clearButton"
                onClick={() => setSelectHours(editDayPracticeArray())}
              >
                복구
              </div>
            </div>
          </div>
          <div className="practicePreview">
            {selectHours.length === 0 ? (
              <div className="noTimeSelected">선택된 시간이 없습니다.</div>
            ) : (
              <div>
                <div className="top">
                  <div className="prTime">
                    <MdOutlineAccessTime />
                    {selectHours[0]}~{selectHours[selectHours.length - 1] + 1}
                  </div>
                  <div className="prMember">
                    <HiUserGroup />
                    {selectedMembers.length}명
                  </div>
                </div>
                <div className="prPlace">
                  <MdOutlinePlace />
                  미확정
                </div>
                <div className="clearButton" onClick={() => setSelectHours([])}>
                  모두해제
                </div>
              </div>
            )}
          </div>
          <div className="actionButtons">
            <div
              className="clearButton"
              onClick={() => deletePracticeHandle(editPractice._id)}
            >
              연습 삭제
            </div>
            <div className="createButton" onClick={() => editPracticeHandle()}>
              연습 수정
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePractice;
