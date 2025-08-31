import React, { useEffect, useState } from "react";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";
import { Calender } from "./Calender";
import { useOutletContext } from "react-router-dom";
import "./Reservation.css";
import { Swiper, SwiperSlide } from "swiper/react";

const mokData = [
  {
    date: new Date("2025-08-30"),
    agentId: "68a71c459117fa8505bc28af",
    time: [10],
  },
  {
    date: new Date("2025-09-10"),
    agentId: "68a71c459117fa8505bc28af",
    time: [8, 9],
  },
  {
    date: new Date("2025-09-10"),
    agentId: "",
    time: [5, 6],
  },
  {
    date: new Date("2025-09-12"),
    agentId: "",
    time: [1, 2],
  },
  {
    date: new Date("2025-08-30"),
    agentId: "68a71c459117fa8505bc28af",
    time: [10],
  },
  {
    date: new Date("2025-09-10"),
    agentId: "68a71c459117fa8505bc28af",
    time: [8, 9],
  },
  {
    date: new Date("2025-08-30"),
    agentId: "68a71c459117fa8505bc28af",
    time: [10],
  },
  {
    date: new Date("2025-09-10"),
    agentId: "68a71c459117fa8505bc28af",
    time: [8, 9],
  },
];

const Reservation = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setmonth] = useState(new Date().getMonth());
  const [selectedDay, setselectedDay] = useState(new Date());
  const [makeTime, setMakeTime] = useState([]);
  const [openInfo, setOpenInfo] = useState(false);
  const [dayData, setDayData] = useState(
    mokData.filter(
      (data) => data.date.toDateString() === new Date().toDateString()
    )
  );

  const { user } = useOutletContext();

  const makeTimeArray = (time) => {
    let timeList = [];
    for (let i = 0; i < 24; i++) {
      time.includes(i) ? timeList.push(1) : timeList.push(0);
    }
    return timeList;
  };

  const getFirstDate = (date) => {
    const firstDate = new Date(date);
    firstDate.setDate(1);
    return firstDate;
  };
  const getLastDate = (date) => {
    const lastDate = new Date(date);
    lastDate.setMonth(date.getMonth() + 1);
    lastDate.setDate(0);
    return lastDate;
  };
  const makeRows = (year, month) => {
    const date = new Date(year, month, 1);
    const first = getFirstDate(date);
    const last = getLastDate(date);
    const day = first.getDay();
    let count = 0 - day;
    let rows = [];
    for (let i = 0; i < 6; i++) {
      let row = [];
      for (let k = 0; k < 7; k++) {
        const date = new Date(first);
        date.setDate(first.getDate() + count);
        let isThisMonth = true;
        if (count >= last.getDate() || count < 0) {
          isThisMonth = false;
        }
        row.push({ date: date, isThisMonth: isThisMonth });
        count++;
      }
      rows.push(row);
    }

    return rows;
  };
  const [rows, setRows] = useState(makeRows(year, month));

  const changeMonthHandle = (num) => {
    setmonth(month + num);
    if (num > 0) {
      if (month > 10) {
        setmonth(0);
        setYear(year + 1);
      }
    } else if (num < 0) {
      if (month < 1) {
        setmonth(11);
        setYear(year - 1);
      }
    }
    setRows(makeRows(year, month));
  };

  const clickTime = (time) => {
    for (let item of dayData) {
      if (item.time.includes(time)) {
        return;
      }
    }
    let timeArray = [...makeTime];
    if (makeTime.includes(time)) {
      timeArray = timeArray.filter((item) => item !== time);
    } else {
      timeArray.push(time);
    }
    setMakeTime(timeArray);
  };

  const clickDate = (date) => {
    setOpenInfo(true);
    setselectedDay(date);
    setYear(date.getFullYear());
    setmonth(date.getMonth());
    setMakeTime([]);
    setDayData(
      mokData.filter((data) => data.date.toDateString() === date.toDateString())
    );
  };

  useEffect(() => {
    setRows(makeRows(year, month));
  }, [month]);

  return (
    <div className="reservation">
      <div className="calendar-section">
        <div className="date-bar">
          <IoIosArrowBack
            className="lastMonth"
            onClick={() => changeMonthHandle(-1)}
          >
            저번 달
          </IoIosArrowBack>
          <h4>
            {year}년 {month + 1}월
          </h4>
          <IoIosArrowForward
            className="lastMonth"
            onClick={() => changeMonthHandle(1)}
          >
            다음 달
          </IoIosArrowForward>
        </div>
        <Calender
          rows={rows}
          selectedDay={selectedDay}
          clickDate={clickDate}
          changeMonthHandle={changeMonthHandle}
        />
      </div>
      <div className="info-section">
        <div className="my-reservation">
          <h4 className="myText">{user.username} 님의 예약</h4>

          <Swiper className="my-reservation-list" spaceBetween={110}>
            {mokData.map((data, index) =>
              data.agentId === user._id ? (
                <SwiperSlide key={index}>
                  <div className="card">
                    <div className="card-date">
                      {`${data.date.getFullYear()}년 ${
                        data.date.getMonth() + 1
                      }월 ${data.date.getDate()}일`}
                    </div>
                    <div className="card-time"></div>
                    <button className="cancle-reservation">취소하기</button>
                  </div>
                </SwiperSlide>
              ) : null
            )}
          </Swiper>
        </div>
        {openInfo ? (
          <div className="date-info">
            <h5 className="dateText">
              {`${selectedDay.getFullYear()}년 ${
                selectedDay.getMonth() + 1
              }월 ${selectedDay.getDate()}일`}
            </h5>
            <IoCloseOutline
              className="close-info"
              onClick={() => setOpenInfo(false)}
            />

            <div className="board">
              <div className="board-times">
                {makeTimeArray([]).map((item, index) => (
                  <div
                    key={index}
                    className="time"
                    onClick={() => clickTime(index)}
                  >
                    <div className="time-number">{index}</div>
                    {makeTime.includes(index) ? (
                      <div
                        className="
              selected-time"
                      ></div>
                    ) : null}
                    {dayData.map((data) => (
                      <>
                        {data.time.includes(index) ? (
                          <div
                            className="
                reserved"
                          ></div>
                        ) : null}
                      </>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="make-reservation">
              <div className="make-button">예약하기</div>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default Reservation;
