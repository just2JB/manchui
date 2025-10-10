import React, { useState } from "react";
import "./Schedule.css";
import "./ScheduleCalender.css";
import "../../../components/Calender/Calender";
import { Calender } from "../../../components/Calender/Calender";

const Schedule = () => {
  const [selectedDay, setselectedDay] = useState(new Date());
  const clickDate = (date) => {
    setselectedDay(date);
  };
  return (
    <div className="schedule">
      <div className="schedule-Calender-section">
        <Calender selectedDay={selectedDay} clickDate={clickDate} />
      </div>
    </div>
  );
};

export default Schedule;
