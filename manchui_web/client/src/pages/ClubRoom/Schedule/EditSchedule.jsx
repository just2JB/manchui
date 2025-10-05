import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import "./EditSchedule.css";

const EditSchedule = () => {
  /* 처음 들어오면: 당일의 시간 정보 가져오기 없으면 24칸 배열
      있으면 그 시간 정보 가져오기  
      시간 정보 수정 후 저장 누르면 POST 요청
      3가지 경우
      1. 기존에 있던 시간 정보 수정
      2. 기존에 없던 시간 정보 추가
      3. 기존에 있던 시간 정보 삭제 (모두 비우기)    
      1, 2, 3번 모두 백엔드에서 처리
*/
  const [schedule, setSchedule] = useState([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const mokschedule = [
    0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  useEffect(() => {}, []);

  return (
    <div className="editSchedule">
      <div className="floatView">
        <div className="viewBox"></div>
        {schedule.map((item, index) => (
          <div key={index} className="floatTime">
            <div
              className={`floatTimeStatus ${item === 1 ? "possible" : ""}`}
            ></div>
          </div>
        ))}
      </div>
      <div className="timeSlotsContainer">
        <div className="timeSlots">
          {schedule.map((item, index) => (
            <div key={index} className="timeSlot">
              <div className="time">
                <div className="timeText">{index}</div>
              </div>

              <div className="content">
                <div className="line"></div>
                <div
                  className={`status ${item === 1 ? "possible" : ""} `}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="scheduleMenuBar">
        <button className="saveButton">저장</button>
        <button className="cancelButton">취소</button>
        <button
          className="clearButton"
          onClick={() =>
            setSchedule([
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0,
            ])
          }
        >
          모두 비우기
        </button>
        <button
          className="seeDawnButton"
          onClick={() => setSchedule(mokschedule)}
        >
          새벽시간 보기
        </button>
      </div>
    </div>
  );
};

export default EditSchedule;
