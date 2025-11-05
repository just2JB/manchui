import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import "swiper/swiper-bundle.css";
import "./TeamCalender.css";
export const TeamCalender = ({
  selectedDay,
  clickDate,
  requestSchedules,
  teamPractice,
}) => {
  const [swiperInstance, setSwiperInstance] = useState(null);

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
  const [calenders, setCalenders] = useState([
    makeRows(new Date().getFullYear(), new Date().getMonth()),
    makeRows(new Date().getFullYear(), new Date().getMonth() + 1),
    makeRows(new Date().getFullYear(), new Date().getMonth() - 1),
  ]);
  const setCalenderArray = (dateIn, index) => {
    if (index === 0) {
      setCalenders([
        makeRows(dateIn.getFullYear(), dateIn.getMonth()),
        makeRows(dateIn.getFullYear(), dateIn.getMonth() + 1),
        makeRows(dateIn.getFullYear(), dateIn.getMonth() - 1),
      ]);
    } else if (index === 1) {
      setCalenders([
        makeRows(dateIn.getFullYear(), dateIn.getMonth() - 1),
        makeRows(dateIn.getFullYear(), dateIn.getMonth()),
        makeRows(dateIn.getFullYear(), dateIn.getMonth() + 1),
      ]);
    } else if (index === 2) {
      setCalenders([
        makeRows(dateIn.getFullYear(), dateIn.getMonth() + 1),
        makeRows(dateIn.getFullYear(), dateIn.getMonth() - 1),
        makeRows(dateIn.getFullYear(), dateIn.getMonth()),
      ]);
    }
  };
  const changeSlideHandle = (e) => {
    setCalenderArray(calenders[e.realIndex][2][0].date, e.realIndex);
  };
  const clickDateHandle = (date) => {
    clickDate(date);
    if (
      date.getMonth() !==
      calenders[swiperInstance.realIndex][2][0].date.getMonth()
    ) {
      if (date > calenders[swiperInstance.realIndex][2][0].date) {
        swiperInstance.slideNext(300, true);
      } else if (date < calenders[swiperInstance.realIndex][2][0].date) {
        swiperInstance.slidePrev(300, true);
      }
    }
  };
  const handleSwiper = (swiper) => {
    setSwiperInstance(swiper);
  };
  return (
    <div className="calender">
      <div className="date-bar">
        <IoIosArrowBack
          className="lastMonth"
          onClick={() => swiperInstance.slidePrev(300, true)}
        >
          저번 달
        </IoIosArrowBack>
        <h4 className="year-month">
          {swiperInstance
            ? calenders[swiperInstance.realIndex][2][0].date.getFullYear()
            : new Date().getFullYear()}
          년{" "}
          {swiperInstance
            ? calenders[swiperInstance.realIndex][2][0].date.getMonth() + 1
            : new Date().getMonth() + 1}
          월
        </h4>
        <IoIosArrowForward
          className="lastMonth"
          onClick={() => swiperInstance.slideNext(300, true)}
        >
          다음 달
        </IoIosArrowForward>
      </div>
      <table className="calendar-day">
        <thead>
          <tr>
            <td>일</td>
            <td>월</td>
            <td>화</td>
            <td>수</td>
            <td>목</td>
            <td>금</td>
            <td>토</td>
          </tr>
        </thead>
      </table>
      <Swiper
        onSlideChangeTransitionEnd={(e) => changeSlideHandle(e)}
        onSwiper={handleSwiper}
        loop="true"
        className="swiper"
        spaceBetween={50}
        slidesPerView={1}
      >
        {calenders.map((item, index) => (
          <SwiperSlide key={index}>
            <table className="calendar-table">
              <tbody>
                {item.map((row, index) => (
                  <tr key={index}>
                    {row.map((data) => (
                      <td
                        key={data.date}
                        className={data.isThisMonth ? "this-month" : ""}
                        onClick={() => clickDateHandle(data.date)}
                      >
                        {data.date.getDate()}

                        {data.date.toDateString() ===
                        selectedDay.toDateString() ? (
                          <div className="selectedDay"></div>
                        ) : (
                          ""
                        )}
                        <div className="dateSchedule">
                          {requestSchedules.includes(
                            data.date.toLocaleDateString()
                          ) ? (
                            <div className="requestSchedule"></div>
                          ) : (
                            <div className=""></div>
                          )}
                          {teamPractice.includes(
                            data.date.toLocaleDateString()
                          ) ? (
                            <div className="teamPractice"></div>
                          ) : (
                            <div className=""></div>
                          )}
                        </div>

                        {data.date.toDateString() ===
                        new Date().toDateString() ? (
                          <div className="today"></div>
                        ) : (
                          ""
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr></tr>
              </tbody>
            </table>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
