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

const Practice = () => {
  const [newOpen, setNewOpen] = useState(false);
  const [practices, setPractices] = useState([]);
  const [seePractices, setSeePractices] = useState([]);
  const [selcetDay, setSelcetDay] = useState(new Date());
  const { user } = useOutletContext();
  const nav = useNavigate();

  const openNewPractice = () => {
    setNewOpen(true);
  };

  const changeUser = (userId) => {
    if (userId === "All") {
      return setSeePractices(practices);
    }
    const filteredPractices = practices.filter((practice) =>
      practice.members.includes(userId)
    );
    return setSeePractices(filteredPractices);
  };

  useEffect(() => {
    const getPractices = async () => {
      try {
        const response = await axios.get(`${serverUrl}/api/practice`, {
          withCredentials: true,
        });
        const dateSorted = response.data.practices.sort((a, b) => {
          if (
            Number(a.date.split("- ").join("")) >
            Number(b.date.split("- ").join(""))
          )
            return 1;
          if (
            Number(a.date.split("- ").join("")) ===
            Number(b.date.split("- ").join(""))
          ) {
            const aFirst = a.time.split("~")[0];
            const bFirst = b.time.split("~")[0];
            if (aFirst > bFirst) return 1;
            if (aFirst === bFirst) return 0;
            if (aFirst < bFirst) return -1;
          }
          if (
            Number(a.date.split("- ").join("")) <
            Number(b.date.split("- ").join(""))
          )
            return -1;
        });
        setPractices(dateSorted);
        setSeePractices(dateSorted);
      } catch {
        alert(error.response.data.message);
      }
    };
    getPractices();
  }, []);
  return (
    <div className="practice">
      <div className="topMenu">
        <div className="weekInfo">11월</div>
        <div className="weekSelector">
          <Swiper
            className="weekSwiper"
            loop="true"
            slidesPerView={1}
            spaceBetween={10}
            resistanceRatio={0}
            speed={400}
          >
            <SwiperSlide className="weekSlide">
              <div className="weeks">
                {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                  <div key={item} className="weekDay mok">
                    <div className="dateText">{item}</div>
                    <div className="dayText">요일</div>
                    <div className="datePractices">
                      {["연습1", "연습2", "연습3"].map((practice) => (
                        <div
                          key={practice}
                          className="datePracticeObject"
                        ></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SwiperSlide>
            <SwiperSlide className="weekSlide"></SwiperSlide>
            <SwiperSlide className="weekSlide"></SwiperSlide>
          </Swiper>
        </div>
        <div className="listControler">
          <div className="controlButton" onClick={() => changeUser(user._id)}>
            내 연습만 보기
          </div>
          <div className="controlButton" onClick={() => changeUser("All")}>
            모두 보기
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
                    {practice.date.slice(0, 4)}년 {practice.date.slice(5, 8)}월{" "}
                    {practice.date.slice(9, 12)}일
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
      )}
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
