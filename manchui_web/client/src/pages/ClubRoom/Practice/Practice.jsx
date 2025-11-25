import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import "./Practice.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import { useEffect } from "react";
import {
  MdOutlineOutlinedFlag,
  MdOutlineAccessTime,
  MdOutlinePlace,
} from "react-icons/md";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
import { useState } from "react";
const serverUrl = import.meta.env.VITE_SERVER_URL;

//내가 가입된 팀만 가져오기
//팀 id로 메인 이동
const toKrDay = ({ day }) => {
  if (day === 0) return <div className={`day sunday`}>일</div>;
  else if (day === 1) return <div className="day">월</div>;
  else if (day === 2) return <div className="day">화</div>;
  else if (day === 3) return <div className="day">수</div>;
  else if (day === 4) return <div className="day">목</div>;
  else if (day === 5) return <div className="day">금</div>;
  else if (day === 6) return <div className={`day saturday`}>토</div>;
};
const Practice = () => {
  const [seeSelect, setSeeSelect] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [practices, setPractices] = useState([]);
  const [seePractices, setSeePractices] = useState([]);
  const [seeOption, setSeeOption] = useState("내 연습");
  const [selcetDay, setSelcetDay] = useState(new Date());
  const [weekPractice, setWeekPractice] = useState([[], [], []]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const { user } = useOutletContext();
  const nav = useNavigate();

  const openNewPractice = () => {
    setNewOpen(true);
  };
  const setDayArray = (date, index) => {
    const firstDate = new Date(date).setDate(
      date.getDate() - date.getDay() - 7
    );
    const first = new Date(firstDate);
    const dayArray = [];
    for (let i = 0; i < 21; i++) {
      const next = new Date(first).setDate(first.getDate() + i);
      dayArray.push(new Date(next));
    }
    setMonth(dayArray[10].getMonth() + 1);
    if (index === 0) {
      setWeekPractice([
        dayArray.slice(7, 14),
        dayArray.slice(14, 21),
        dayArray.slice(0, 7),
      ]);
    } else if (index === 1) {
      setWeekPractice([
        dayArray.slice(0, 7),
        dayArray.slice(7, 14),
        dayArray.slice(14, 21),
      ]);
    } else if (index === 2) {
      setWeekPractice([
        dayArray.slice(14, 21),
        dayArray.slice(0, 7),
        dayArray.slice(7, 14),
      ]);
    }
  };

  const handleSwiper = (swiper) => {
    setSwiperInstance(swiper);
  };
  const toToday = () => {
    if (swiperInstance) {
      setDayArray(new Date(), swiperInstance.realIndex);
    }
    setSelcetDay(new Date());
  };
  const toFomatDate = (date) => {
    const FomatDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return FomatDate;
  };

  useEffect(() => {
    if (seeOption === "내 연습") {
      const filteredPractices = practices.filter((practice) =>
        practice.members.includes(user._id)
      );
      setSeePractices(filteredPractices);
    } else if (seeOption === "전체 연습") {
      setSeePractices(practices);
    } else {
      setSeePractices([]);
    }
  }, [practices, seeOption]);

  useEffect(() => {
    setDayArray(new Date(), 0);
    const getPractices = async () => {
      try {
        const response = await axios.get(`${serverUrl}/api/practice`, {
          withCredentials: true,
        });
        const dateSorted = response.data.practices.sort((a, b) => {
          if (
            Number(a.date.split("-").join("")) >
            Number(b.date.split("-").join(""))
          )
            return 1;
          if (
            Number(a.date.split("-").join("")) ===
            Number(b.date.split("-").join(""))
          ) {
            const aFirst = a.time.split("~")[0];
            const bFirst = b.time.split("~")[0];
            if (aFirst > bFirst) return 1;
            if (aFirst === bFirst) return 0;
            if (aFirst < bFirst) return -1;
          }
          if (
            Number(a.date.split("-").join("")) <
            Number(b.date.split("-").join(""))
          )
            return -1;
        });
        setPractices(dateSorted);
      } catch {
        alert(error.response.data.message);
      }
    };
    getPractices();
  }, []);

  const changeSlideHandle = (e) => {
    setDayArray(weekPractice[e.realIndex][0], e.realIndex);
    setSwiping(false);
  };
  return (
    <div className="practice">
      <div className="topMenu">
        <div className="weekInfo">{month}월</div>
        <div className="weekSelector">
          <Swiper
            onSlideChangeTransitionStart={() => setSwiping(true)}
            onSlideChangeTransitionEnd={(e) => changeSlideHandle(e)}
            onSwiper={handleSwiper}
            className="weekSwiper"
            loop="true"
            slidesPerView={1}
            spaceBetween={10}
            resistanceRatio={0}
            speed={400}
          >
            {weekPractice.map((week) => (
              <SwiperSlide key={week[0]} className="weekSlide">
                <div className="weeks">
                  {week.map((date) => (
                    <div
                      key={date}
                      className="weekDay mok"
                      onClick={() => setSelcetDay(date)}
                    >
                      <div className="dateText">
                        {toKrDay({ day: date.getDay() })}
                        {date.getDate()}
                      </div>

                      <div className="datePractices">
                        {seePractices
                          .filter((prac) => prac.date === toFomatDate(date))
                          .map((practice, index) => (
                            <div
                              key={index}
                              className="datePracticeObject"
                            ></div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="listControler">
          <div
            className="seeSelect"
            onClick={() =>
              seeSelect ? setSeeSelect(false) : setSeeSelect(true)
            }
          >
            {seeOption}
            {seeSelect ? (
              <div className={`seeOption`}>
                <div
                  className="controlButton"
                  onClick={() => setSeeOption("내 연습")}
                >
                  내 연습
                </div>
                <div
                  className="controlButton"
                  onClick={() => setSeeOption("전체 연습")}
                >
                  전체 연습
                </div>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
      <div className="myPractice">
        <div className="practicesBottom">
          <div className="practiceList">
            {seePractices.map((practice, index) => (
              <div
                key={practice._id}
                className={`practiceCard ${
                  new Date(practice.date).toLocaleDateString() ===
                  selcetDay.toLocaleDateString()
                    ? "selectDateCard"
                    : ""
                }`}
                onClick={() => setSelcetDay(new Date(practice.date))}
              >
                {index === 0 ||
                practice.date !== seePractices[index - 1].date ? (
                  <div className={`practiceDateText`}>
                    {practice.date.split("-")[0]}년{" "}
                    {Number(practice.date.split("-")[1])}월{" "}
                    {Number(practice.date.split("-")[2])}일
                  </div>
                ) : (
                  ""
                )}
                <div className="listPracticeCard">
                  <span
                    style={{
                      padding: "2px",
                      marginRight: "3px",
                      borderRadius: "5px",
                      backgroundColor: `${practice.teamColor}`,
                    }}
                  ></span>
                  <div>{practice.teamName}</div>
                  <div>
                    {(practice.time.split("~")[0] * 2) % 2 === 0
                      ? `${practice.time.split("~")[0]}:00`
                      : `${practice.time.split("~")[0] - 0.5}:30`}
                    ~
                    {(practice.time.split("~")[1] * 2) % 2 === 0
                      ? `${practice.time.split("~")[1]}:00`
                      : `${practice.time.split("~")[1] - 0.5}:30`}
                  </div>

                  <div>
                    <MdOutlinePlace />
                    {practice.place}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="floatAddPractice" onClick={() => openNewPractice()}>
        +새 연습
      </div>
      {newOpen ? (
        <div className="newPractice">
          <div className="closeSection" onClick={() => setNewOpen(false)}></div>
          <div className="buttonBox">
            <button onClick={() => nav("/club/team/create-team")}>
              새 팀에서 만들기
            </button>
            <button onClick={() => nav("/club/team")}>
              기존 팀 연습 추가하기
            </button>
          </div>
        </div>
      ) : (
        ""
      )}{" "}
      <div className={`${swiping ? "swiping" : ""}`}></div>
    </div>
  );
};

export default Practice;

/*
1. 주간 선택, 보기를 만들어서 원하는 날짜 볼 수 있게 하기
2. 연습들 리스트로 보이기
3. 연습 생성 플로트 시키기
4. 연습 추가 누르면  / [새로운 팀 만들기 => 팀 만들기 => 링크 공유 유도] / [기존팀에서 추가 => 팀 페이지로 이동]
5. 월간 선택, 보기 만들어서 한눈에 보기
6. 스케줄 작성 페이지 만들고 홈, 스케줄 페이지에 에 팀 스케줄 요청된 날짜 강조해주는 효과 만들기
7. 연습데이터가 나중엔 개 많을거니까 잘라서 가져오게 바꿔야할듯 (ALL) (date~date)
*/
