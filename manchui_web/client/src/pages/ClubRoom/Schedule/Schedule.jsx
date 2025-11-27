import React, { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import "./Schedule.css";
import { TbClockEdit } from "react-icons/tb";
import { RiArrowGoBackLine } from "react-icons/ri";
import { ScheduleCalender } from "./ScheduleCalender";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const Schedule = () => {
  const [swiping, setSwiping] = useState(false);
  const [selectedDay, setselectedDay] = useState(new Date());
  const [requestSchedules, setRequestSchedules] = useState([]);
  const [mySchedule, mySchedules] = useState([]);
  const { user } = useOutletContext();
  const [loading, setLoading] = useState(false);

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

  const clickDate = (date) => {
    setselectedDay(date);
    nav(`/club/edit-schedule/${getFomatDate(date.toLocaleDateString())}`);
  };
  const nav = useNavigate();

  const getMySchedules = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/schedule/${user._id}`,
        {
          withCredentials: true,
        }
      );

      mySchedules(response.data.userSchedules);
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  useEffect(() => {
    const getRequestSchedules = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/schedule/request/${user._id}`,
          {
            withCredentials: true,
          }
        );

        setRequestSchedules(response.data.myTeam);
      } catch (error) {
        alert(error.response.data.message);
      }
    };
    getMySchedules();
    getRequestSchedules();
  }, []);

  return (
    <div className="schedule">
      <div className="ScheduleCalender">
        <ScheduleCalender
          mySchedule={mySchedule}
          requestSchedules={requestSchedules}
          selectedDay={selectedDay}
          clickDate={clickDate}
        />
      </div>
      <div className="rate"></div>
      <div className={`${swiping ? "swiping" : ""}`}></div>
    </div>
  );
};

export default Schedule;

//상단 메뉴: 요청된 날짜 가로 리스트로 모아두기 / 각종 메뉴 버튼  <div className="topMenu"></div>
