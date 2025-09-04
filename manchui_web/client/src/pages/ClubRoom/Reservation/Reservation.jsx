import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import "./Reservation.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Calender } from "./Calender";
import { IoIosArrowForward, IoIosArrowBack, IoMdShare } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const Reservation = () => {
  const [reservationData, setReservationData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setmonth] = useState(new Date().getMonth());
  const [selectedDay, setselectedDay] = useState(new Date());
  const [makeTime, setMakeTime] = useState([]);
  const [openInfo, setOpenInfo] = useState(false);
  const [dayData, setDayData] = useState(
    reservationData.filter(
      (data) => new Date(data.date).toDateString() === new Date().toDateString()
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
    fetchReservation();
    setOpenInfo(true);
    setselectedDay(date);
    setYear(date.getFullYear());
    setmonth(date.getMonth());
    setMakeTime([]);
    setDayData(
      reservationData.filter(
        (data) => new Date(data.date).toDateString() === date.toDateString()
      )
    );
  };
  const makeHandle = async (e) => {
    if (makeTime.length < 1) {
      return alert("예약할 시간을 선택해주세요!");
    }
    if (Math.max(...makeTime) + 1 - Math.min(...makeTime) !== makeTime.length) {
      return alert("연속된 시간을 선택해주세요!");
    }
    const date = `${selectedDay.getFullYear()}-${String(
      selectedDay.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`;
    const reqData = {
      date: date,
      agentId: user._id,
      time: makeTime,
    };
    try {
      const response = await axios.post(
        `${serverUrl}/api/reservation/make`,
        reqData
      );
      if (response.status === 201) {
        alert("예약이 완료되었습니다.");
      }
      fetchReservation();
      setMakeTime([]);
      setOpenInfo(false);
    } catch (error) {
      alert("오류가 발생하였습니다.");
    }
  };
  const deleteHandle = async (data) => {
    if (
      confirm(
        `${data.date} / ${Math.min(...data.time)}시 - ${
          Math.max(...data.time) + 1
        }시 / 취소하시겠습니까?`
      )
    ) {
      try {
        const response = await axios.delete(
          `${serverUrl}/api/reservation/${data._id}`,
          { withCredentials: true }
        );
        alert("성공적으로 취소 되었습니다.");
        fetchReservation();
      } catch (error) {
        alert("오류가 발생하였습니다.");
      }
    }
  };
  const fetchReservation = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/reservation`, {
        withCredentials: true,
      });
      setReservationData(response.data);
    } catch (error) {}
  };
  useEffect(() => {
    setRows(makeRows(year, month));
  }, [month]);
  useEffect(() => {
    fetchReservation();
  }, []);
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
          <h4 className="year-month">
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
          <div className="my-reservation-list">
            <div className="card-bar">
              {reservationData.map((data, index) =>
                data.agentId === user._id ? (
                  <div key={index} className="card">
                    <div className="card-inner">
                      <div className="card-date">{`${data.date}`}</div>
                      <div className="card-time">{`${Math.min(
                        ...data.time
                      )} - ${Math.max(...data.time) + 1}`}</div>
                      <div className="card-buttons">
                        <button
                          className="cancle-reservation"
                          onClick={() => deleteHandle(data)}
                        >
                          예약 취소
                        </button>
                        <button className="share">
                          <IoMdShare className="share-icon" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
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
                      <div key={data.time} className="reserved-outdiv">
                        {data.time.includes(index) ? (
                          <div
                            className="
                reserved"
                          ></div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="make-reservation">
              <div className="make-button" onClick={makeHandle}>
                예약하기
              </div>
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
