import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
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

  const { user } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const clickDate = (date) => {
    setselectedDay(date);
  };
  return (
    <div className="schedule">
      <div className="topMenu">
        
      </div>
      <div className="ScheduleCalender">
        <ScheduleCalender selectedDay={selectedDay} clickDate={clickDate} />
      </div>
      <div className={`${swiping ? "swiping" : ""}`}></div>
    </div>
  );
};

export default Schedule;

//상단 메뉴: 요청된 날짜 가로 리스트로 모아두기 / 각종 메뉴 버튼