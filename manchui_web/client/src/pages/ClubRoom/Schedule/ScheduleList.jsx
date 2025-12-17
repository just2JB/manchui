import React, { useState, useEffect } from "react";
import "./ScheduleList.css";

const ScheduleList = ({ requestSchedules }) => {
  return (
    <div className="scheduleList">
      <div className="listOption">
        <div className="unConfirmSchedule listOptionBtn">미완료</div>
        <div className="allSchdule listOptionBtn">모두보기</div>
      </div>
      <div className="list">
        {requestSchedules.map((req) => (
          <div key={req} className="request">
            <div className="reqDate">{req}</div>
            <div className="reqButton">수정</div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ScheduleList;
