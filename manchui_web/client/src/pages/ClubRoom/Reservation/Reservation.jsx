import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import "./Reservation.css";
import "./ReservationCalender.css";
import { Calender } from "../../../components/Calender/Calender";
import { IoMdShare } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";
import Loading from "../../../components/Loading/Loading";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const Reservation = () => {
  const [loading, setLoading] = useState(false);
  const [reservationData, setReservationData] = useState([]);
  const [selectedDay, setselectedDay] = useState(new Date());
  const [makeTime, setMakeTime] = useState([]);
  const [anchor, setAnchor] = useState(-1);
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

  const toggleHourSelection = (hour) => {
    for (let item of dayData) {
      if (item.time.includes(hour)) {
        return;
      }
    }
    if (makeTime.length < 1) {
      setAnchor(hour);
      setMakeTime([hour]);
      return;
    }
    if (hour < anchor) {
      setAnchor(hour);
      setMakeTime([hour]);
      return;
    } else if (hour > anchor) {
      let newHours = [];
      for (let i = 0; i < hour - anchor + 1; i++) {
        newHours.push(anchor + i);
        for (let item of dayData) {
          if (item.time.includes(anchor + i)) {
            return;
          }
        }
      }
      setMakeTime(newHours);
      return;
    } else {
      setMakeTime([]);
      setAnchor(-1);
      return;
    }
  };

  const clickDate = (date) => {
    setOpenInfo(true);
    setselectedDay(date);
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
    setLoading(true);
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

      setMakeTime([]);
      setOpenInfo(false);
    } catch (error) {
      alert("오류가 발생하였습니다.");
    } finally {
      fetchReservation();
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
      setLoading(true);
      try {
        const response = await axios.delete(
          `${serverUrl}/api/reservation/${data._id}`,
          { withCredentials: true }
        );
      } catch (error) {
        alert("오류가 발생하였습니다.");
      } finally {
        fetchReservation();
      }
    }
  };
  const fetchReservation = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${serverUrl}/api/reservation`, {
        withCredentials: true,
      });
      setReservationData(response.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservation();
  }, []);
  return (
    <div className="reservation">
      {loading ? (
        <div>
          <Loading />
        </div>
      ) : (
        <></>
      )}
      <div className="reserv-calendar-section">
        <Calender selectedDay={selectedDay} clickDate={clickDate} />
      </div>

      <div className="info-section">
        <div className="reservationText">나의 예약</div>

        <div className="my-reservation">
          <div className="card-bar">
            {reservationData.map((data, index) =>
              data.agentId === user._id ? (
                <div key={index} className="card">
                  <div className="card-inner">
                    <div className="card-date">{`${data.date}`}</div>
                    <div className="card-time">{`${Math.min(
                      ...data.time
                    )}시 - ${Math.max(...data.time) + 1}시`}</div>
                    <div className="card-buttons">
                      <button
                        className="cancle-reservation"
                        onClick={() => deleteHandle(data)}
                      >
                        취소
                      </button>
                      <button className="share">
                        <IoMdShare className="share-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : null
            )}
          </div>{" "}
          {openInfo ? (
            <div className="date-info">
              <h5 className="dateText">
                {`${selectedDay.getFullYear()}년 ${
                  selectedDay.getMonth() + 1
                }월 ${selectedDay.getDate()}일`}{" "}
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
                      onClick={() => toggleHourSelection(index)}
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
    </div>
  );
};

export default Reservation;

// 예약 제한이랑 거시기 뭐냐 공유기능 만들어야함
