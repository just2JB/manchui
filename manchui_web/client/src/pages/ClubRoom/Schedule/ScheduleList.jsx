import React, { useState, useEffect } from "react";
import "./ScheduleList.css";
import { useNavigate } from "react-router-dom";
const ScheduleList = ({ requestSchedules, confirmDate }) => {
  const [listOption, setListOption] = useState("unConfirm");
  const getFomatDate = (localeDateString) => {
    localeDateString = localeDateString.split(". ").join(".");
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
  const nav = useNavigate();
  const clickDate = (date) => {
    nav(`/club/edit-schedule/${getFomatDate(date)}`);
  };
  return (
    <div className="scheduleList">
      <div className="listOption">
        <div
          className="unConfirmSchedule listOptionBtn"
          onClick={() => setListOption("unConfirm")}
        >
          미완료
        </div>
        <div
          className="allSchdule listOptionBtn"
          onClick={() => setListOption("all")}
        >
          모두보기
        </div>
        <div
          className="allSchdule listOptionBtn"
          onClick={() => nav("/club/schedule")}
        >
          달력보기
        </div>
      </div>

      <div className="list">
        {listOption === "unConfirm"
          ? requestSchedules
              .filter(
                (req) => !confirmDate.find((date) => date === getFomatDate(req))
              )
              .map((req) => (
                <div key={req} className="request">
                  <div className="reqDate">{req}</div>
                  <div className="reqButton" onClick={() => clickDate(req)}>
                    작성
                  </div>
                </div>
              ))
          : requestSchedules.map((req) => (
              <div
                key={req}
                className={`request ${
                  confirmDate.find((date) => date === getFomatDate(req))
                    ? "confirmReq"
                    : ""
                }`}
              >
                <div className="reqDate">{req}</div>
                <div className="reqButton" onClick={() => clickDate(req)}>
                  {confirmDate.find((date) => date === getFomatDate(req))
                    ? "수정"
                    : "작성"}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};
export default ScheduleList;
