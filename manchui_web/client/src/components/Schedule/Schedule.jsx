import React, { useState } from "react";
import "./Schedule.css";

const Schedule = () => {
  const [isEdit, setIsEdit] = useState(false);

  return (
    <div className="schedule">
      <div className={`content ${isEdit ? "edit" : "default"}`}>
        <button onClick={() => (isEdit ? setIsEdit(false) : setIsEdit(true))}>
          {isEdit ? "닫기" : "수정"}
        </button>
      </div>
    </div>
  );
};

export default Schedule;
