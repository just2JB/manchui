import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "./Calender.css";
import "swiper/swiper-bundle.css";

export const Calender = ({
  rows,
  selectedDay,
  clickDate,
  changeMonthHandle,
}) => {
  const onSlideHandle = (e) => {
    if (e.translate < 0) {
      changeMonthHandle(1);
    } else {
      changeMonthHandle(-1);
    }
  };
  return (
    <div className="calender">
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
        className="swiper"
        onSlideChangeTransitionEnd={(e) => onSlideHandle(e)}
        loop={true}
        spaceBetween={50}
        slidesPerView={1}
      >
        <SwiperSlide>
          <table className="calendar-table">
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {row.map((data) => (
                    <td
                      key={data.date}
                      className={data.isThisMonth ? "this-month" : ""}
                      onClick={() => clickDate(data.date)}
                    >
                      {data.date.getDate()}

                      {data.date.toDateString() ===
                      selectedDay.toDateString() ? (
                        <div className="selectedDay"></div>
                      ) : (
                        ""
                      )}
                      {data.date.toDateString() ===
                      new Date().toDateString() ? (
                        <div className="today">ToDay</div>
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
        <SwiperSlide>
          <table className="calendar-table">
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {row.map((data) => (
                    <td
                      key={data.date}
                      className={data.isThisMonth ? "this-month" : ""}
                      onClick={() => clickDate(data.date)}
                    >
                      {data.date.getDate()}
                      {data.date.toDateString() ===
                      selectedDay.toDateString() ? (
                        <div className="selectedDay"></div>
                      ) : (
                        ""
                      )}
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
      </Swiper>
    </div>
  );
};
