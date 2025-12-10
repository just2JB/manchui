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
  const [newOpen, setNewOpen] = useState(false);
  const [practices, setPractices] = useState([]);
  const [seePractices, setSeePractices] = useState([]);
  const [seeOption, setSeeOption] = useState("내 연습");
  const { user } = useOutletContext();
  const [swiperInstance, setSwiperInstance] = useState(null);
  const handleSwiper = (swiper) => {
    setSwiperInstance(swiper);
  };
  const nav = useNavigate();
  const [selcetDay, setSelcetDay] = useState(new Date());

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

  const getLastDate = (date) => {
    const lastDate = new Date(date);
    lastDate.setMonth(date.getMonth() + 1);
    lastDate.setDate(0);
    return lastDate;
  };
  const makeMonthData = (year, month) => {
    const date = new Date(year, month, 1);
    const last = getLastDate(date);
    let monthData = [];
    for (let i = 0; i < last.getDate() - 0; i++) {
      monthData.push(new Date(year, month, i + 1));
    }
    return monthData;
  };
  const [calenders, setCalenders] = useState([
    makeMonthData(new Date().getFullYear(), new Date().getMonth()),
    makeMonthData(new Date().getFullYear(), new Date().getMonth() + 1),
    makeMonthData(new Date().getFullYear(), new Date().getMonth() - 1),
  ]);

  const openNewPractice = () => {
    setNewOpen(true);
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
  }, [practices, seeOption, selcetDay]);

  useEffect(() => {
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
        setSelcetDay(new Date());
      } catch {
        alert(error.response.data.message);
      }
    };
    getPractices();
  }, []);

  const toToday = () => {
    setSelcetDay(new Date());
  };
  const dateClickHandle = (date) => {
    setSelcetDay(date);
  };
  const slideChangeHandle = (e) => {
    if (swiperInstance.slides.length - e.realIndex < 4) {
      setSelcetDay(
        [...calenders[0], ...calenders[1], ...calenders[2]][
          3 - (swiperInstance.slides.length - e.realIndex)
        ]
      );
    } else {
      setSelcetDay(
        [...calenders[0], ...calenders[1], ...calenders[2]][
          swiperInstance.realIndex + 3
        ]
      );
    }
  };
  useEffect(() => {
    if (swiperInstance) {
      const selcetDayEl = document.getElementById(
        getFomatDate(selcetDay.toLocaleDateString())
      );
      if (selcetDayEl.swiperSlideIndex < 3) {
        swiperInstance.slideToLoop(
          swiperInstance.slides.length - 3 + selcetDayEl.swiperSlideIndex,
          300
        );
      } else {
        swiperInstance.slideToLoop(selcetDayEl.swiperSlideIndex - 3);
      }
    }
  }, [selcetDay]);
  return (
    <div className="practice">
      <div className="topMenu">
        <div className="monthSelector">
          <div>ㅇㅇ</div>
          <div>{selcetDay.getMonth() + 1}월</div>
          <div onClick={() => toToday()}>오늘로</div>
        </div>
        <div className="dateSelector">
          <Swiper
            loop="false"
            className="swiper"
            spaceBetween={9}
            slidesPerView={7}
            onSwiper={handleSwiper}
            onSlideChangeTransitionStart={(e) => slideChangeHandle(e)}
          >
            {calenders[0].map((date) => (
              <SwiperSlide
                key={date}
                id={getFomatDate(date.toLocaleDateString())}
                className={`dateBox ${
                  selcetDay.toLocaleDateString() === date.toLocaleDateString()
                    ? "selectDateBox"
                    : ""
                }`}
                onClick={() => dateClickHandle(date)}
              >
                <div className="dateText"> {date.getDate()}</div>
                {toKrDay({ day: date.getDay() })}
                <div className="practiceCountBox">
                  {seePractices
                    .filter(
                      (prac) =>
                        prac.date === getFomatDate(date.toLocaleDateString())
                    )
                    .map((count, index) => (
                      <div className="practiceCount"></div>
                    ))}
                </div>
              </SwiperSlide>
            ))}
            {calenders[1].map((date) => (
              <SwiperSlide
                key={date}
                id={getFomatDate(date.toLocaleDateString())}
                className={`dateBox ${
                  selcetDay.toLocaleDateString() === date.toLocaleDateString()
                    ? "selectDateBox"
                    : ""
                }`}
                onClick={() => dateClickHandle(date)}
              >
                <div className="dateText"> {date.getDate()}</div>
                {toKrDay({ day: date.getDay() })}
                <div className="practiceCountBox">
                  {seePractices
                    .filter(
                      (prac) =>
                        prac.date === getFomatDate(date.toLocaleDateString())
                    )
                    .map((count, index) => (
                      <div className="practiceCount"></div>
                    ))}
                </div>
              </SwiperSlide>
            ))}
            {calenders[2].map((date) => (
              <SwiperSlide
                key={date}
                id={getFomatDate(date.toLocaleDateString())}
                className={`dateBox ${
                  selcetDay.toLocaleDateString() === date.toLocaleDateString()
                    ? "selectDateBox"
                    : ""
                }`}
                onClick={() => dateClickHandle(date)}
              >
                <div className="dateText"> {date.getDate()}</div>
                {toKrDay({ day: date.getDay() })}
                <div className="practiceCountBox">
                  {seePractices
                    .filter(
                      (prac) =>
                        prac.date === getFomatDate(date.toLocaleDateString())
                    )
                    .map((count, index) => (
                      <div className="practiceCount"></div>
                    ))}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="seeOptionSelector">
          <div onClick={() => setSeeOption("내 연습")}>내 팀 연습</div>
          <div onClick={() => setSeeOption("전체 연습")}>전체 연습</div>
        </div>
      </div>
      <div className="myPractice">
        <div className="practiceList">
          {seePractices.filter(
            (prac) => prac.date === getFomatDate(selcetDay.toLocaleDateString())
          ).length < 1 ? (
            <div className="practiceCard">오늘은 연습이 없습니다.</div>
          ) : (
            ""
          )}
          {seePractices
            .filter(
              (prac) =>
                prac.date === getFomatDate(selcetDay.toLocaleDateString())
            )
            .map((practice) => (
              <div key={practice._id} className="practiceCard">
                <span
                  style={{
                    padding: "2px",
                    marginRight: "3px",
                    padding: "5px",
                    marginLeft: "5px",
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
            ))}
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
      )}
    </div>
  );
};

export default Practice;

/*
<div className="practicesBottom">
          <div className="practiceList">
            {seePractices.map((practice, index) => (
              <div key={practice._id} className={`practiceCard`}>
                {index === 0 ||
                practice.date !== seePractices[index - 1].date ? (
                  <div
                    className={`practiceDateText ${
                      new Date(practice.date).toLocaleDateString() ===
                      selcetDay.toLocaleDateString()
                        ? "selectDateCard"
                        : ""
                    }`}
                  >
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
                      padding: "5px",
                      marginLeft: "5px",
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
1. 주간 선택, 보기를 만들어서 원하는 날짜 볼 수 있게 하기
2. 연습들 리스트로 보이기
3. 연습 생성 플로트 시키기
4. 연습 추가 누르면  / [새로운 팀 만들기 => 팀 만들기 => 링크 공유 유도] / [기존팀에서 추가 => 팀 페이지로 이동]
5. 월간 선택, 보기 만들어서 한눈에 보기
6. 스케줄 작성 페이지 만들고 홈, 스케줄 페이지에 에 팀 스케줄 요청된 날짜 강조해주는 효과 만들기
7. 연습데이터가 나중엔 개 많을거니까 잘라서 가져오게 바꿔야할듯 (ALL) (date~date)
*/
