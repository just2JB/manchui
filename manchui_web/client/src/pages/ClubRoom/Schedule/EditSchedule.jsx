import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import {
  useParams,
  useNavigate,
  useOutletContext,
  data,
} from "react-router-dom";
import axios from "axios";
import "./EditSchedule.css";
const serverUrl = import.meta.env.VITE_SERVER_URL;
import Loading from "../../../components/Loading/Loading";
const EditSchedule = () => {
  /* 처음 들어오면: 당일의 시간 정보 가져오기 없으면 24칸 배열
      있으면 그 시간 정보 가져오기  
      시간 정보 수정 후 저장 누르면 POST 요청
      3가지 경우
      1. 기존에 있던 시간 정보 수정
      2. 기존에 없던 시간 정보 추가
      3. 기존에 있던 시간 정보 삭제 (모두 비우기)    
      1, 2, 3번 모두 백엔드에서 처리


      +날짜, (확정, 임시저장) 여부, 일정,
*/

  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);

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

  const changeStatus = (index) => {
    const status = [...schedule];
    if (status[index] === 0) {
      status[index] = 1;
    } else {
      status[index] = 0;
    }
    setSchedule(status);
  };
  const saveSchedule = async (category) => {
    setLoading(true);

    const reqData = {
      userId: user._id,
      category: category,
      date: date,
      times: schedule,
    };
    if (!schedule.includes(1)) {
      reqData.times = [];
    }
    try {
      const response = await axios.post(`${serverUrl}/api/schedule`, reqData, {
        withCredentials: true,
      });
      if (response.status === 201) {
        alert("일정이 성공적으로 저장되었습니다.");
      }
      nav(-1);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const getSchedule = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${serverUrl}/api/schedule/${user._id}`,
          {
            withCredentials: true,
          }
        );
        const schedules = response.data;
        const finded = schedules.find((data) => data.date === date);
        if (finded) {
          setSchedule(finded.times);
        }
      } catch (error) {
        nav(-1);
      } finally {
        setLoading(false);
      }
    };
    getSchedule();
  }, []);

  const { date } = useParams();

  const { user } = useOutletContext();

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
      <div className="dateContainer">
        <div className="date">{date}</div>
        <div className="clear">
          <button
            className="clearButton"
            onClick={() =>
              setSchedule([
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0,
              ])
            }
          >
            모두 비우기
          </button>
        </div>
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
                  onClick={() => changeStatus(index)}
                  className={`status ${item === 1 ? "possible" : ""} `}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="scheduleMenuBar">
        <div className="button-box">
          <button
            className="confirmedButton"
            onClick={() => saveSchedule("confirem")}
          >
            일정 확정
          </button>
          <button className="saveButton" onClick={() => saveSchedule("temp")}>
            임시 저장
          </button>
          <button className="cancelButton" onClick={() => nav(-1)}>
            취소
          </button>
        </div>
      </div>
      {loading ? (
        <div>
          <Loading />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default EditSchedule;
