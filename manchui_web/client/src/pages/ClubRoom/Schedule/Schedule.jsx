import React, { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import "./Schedule.css";
import { TbClockEdit } from "react-icons/tb";
import { RiArrowGoBackLine } from "react-icons/ri";
import { ScheduleCalender } from "./ScheduleCalender";
import CustomPieChart from "../../../components/PieChart/CustomPieChart";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const Schedule = () => {
  const [swiping, setSwiping] = useState(false);
  const [selectedDay, setselectedDay] = useState(new Date());
  const [requestSchedules, setRequestSchedules] = useState([]);
  const [mySchedule, setMySchedule] = useState([]);
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

      setMySchedule(response.data.userSchedules);
    } catch (error) {
      alert(error.response.data.message);
    }
  };
  const rateSchedule = () => {
    const uniqueSchedule = [
      ...new Set(
        mySchedule.map((item) => {
          if (item.category !== "temp") {
            return item.date;
          } else {
            return;
          }
        })
      ),
    ];

    if (requestSchedules.length > 0) {
      return (
        Math.floor(
          (uniqueSchedule.filter((date) =>
            requestSchedules.includes(new Date(date).toLocaleDateString())
          ).length /
            requestSchedules.length) *
            1000
        ) / 10
      );
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

        const requestArray = [];
        response.data.myTeam.forEach((item) => {
          requestArray.push(...item.request);
        });
        const uniqueArray = [...new Set(requestArray)];

        setRequestSchedules(uniqueArray);
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
      <div className="rateSection">
        <div className="rate">
          <div className="chartText">
            <div>요청:{requestSchedules.length}</div>
          </div>
          <div className="pieChartBox">
            <CustomPieChart
              data={[
                { x: "완료", y: rateSchedule() },
                { x: "미완료", y: 100 - rateSchedule() },
              ]}
            />
            <div className="middelLabel"> {rateSchedule()}%</div>
          </div>
          <div className="chartText">
            <div>
              완료:
              {
                [
                  ...new Set(
                    mySchedule.map((item) => {
                      if (item.category !== "temp") {
                        return item.date;
                      } else {
                        return;
                      }
                    })
                  ),
                ].filter((date) =>
                  requestSchedules.includes(new Date(date).toLocaleDateString())
                ).length
              }
            </div>
          </div>
        </div>
      </div>
      <div className={`${swiping ? "swiping" : ""}`}></div>
    </div>
  );
};

export default Schedule;

//상단 메뉴: 요청된 날짜 가로 리스트로 모아두기 / 각종 메뉴 버튼  <div className="topMenu"></div>
/**
 지난 요청및 지난 스케줄 삭제하기 (1달 주기?)
 */
