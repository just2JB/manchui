import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";

import AuthWindow from "./AuthWindow/AuthWindow";
import "./ClubRoom.css";
import Loading from "../../components/Loading/Loading";
import Beams from "../../components/Beams/Beams";
import { RiMenuFoldFill, RiMenuFold2Fill } from "react-icons/ri";
import { TbClockEdit } from "react-icons/tb";
import { RiArrowGoBackLine } from "react-icons/ri";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const toKrDay = ({ day }) => {
  if (day === 0) return <div className={`day sunday`}>일</div>;
  else if (day === 1) return <div className="day">월</div>;
  else if (day === 2) return <div className="day">화</div>;
  else if (day === 3) return <div className="day">수</div>;
  else if (day === 4) return <div className="day">목</div>;
  else if (day === 5) return <div className="day">금</div>;
  else if (day === 6) return <div className={`day saturday`}>토</div>;
};

const ClubRoom = () => {
  const [swiping, setSwiping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [user, setUser] = useState({ username: "" });
  const { isLogin, setIsLogin, authIsOpen, setAuthIsOpen } = useOutletContext();
  const [profilSpeed, setProfilSpeed] = useState(4);
  const [profilMenu, setProfilMenu] = useState(false);
  const [schedule, setSchedule] = useState([[], [], []]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [scheduleData, setScheduleData] = useState([]);

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
      setSchedule([
        dayArray.slice(7, 14),
        dayArray.slice(14, 21),
        dayArray.slice(0, 7),
      ]);
    } else if (index === 1) {
      setSchedule([
        dayArray.slice(0, 7),
        dayArray.slice(7, 14),
        dayArray.slice(14, 21),
      ]);
    } else if (index === 2) {
      setSchedule([
        dayArray.slice(14, 21),
        dayArray.slice(0, 7),
        dayArray.slice(7, 14),
      ]);
    }
  };
  const thisWeek = new Date().setDate(
    new Date().getDate() - new Date().getDay() - 1
  );
  const getFomatDate = (localeDateString) => {
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
  const changeSlideHandle = (e) => {
    setDayArray(schedule[e.realIndex][0], e.realIndex);
    setSwiping(false);
  };
  const getSchedule = async (userId) => {
    try {
      const response = await axios.get(`${serverUrl}/api/schedule/${userId}`, {
        withCredentials: true,
      });

      setScheduleData(response.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setLoading(true);
    setDayArray(new Date(), 0);
    const verifyToken = async () => {
      try {
        const response = await axios.post(
          `${serverUrl}/api/auth/verify-token`,
          {},
          { withCredentials: true }
        );
        if (response.data.isValid) {
          setUser(response.data.user);
          setIsLogin(true);
          await getSchedule(response.data.user._id);
          return;
        }

        return;
      } catch (error) {
        console.log("토큰 인증 실패", error);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  useEffect(() => {
    if (user.username !== "") {
      getSchedule(user._id);
    }
  }, [user.username]);

  const handleLogout = async (e) => {
    if (confirm(`로그아웃 하시겠습니까?`)) {
      try {
        const response = await axios.post(
          `${serverUrl}/api/auth/logout`,
          {},
          { withCredentials: true }
        );
        alert(response.data.message);
        setIsLogin(false);
        setUser({ username: "" });
      } catch (error) {
        console.log("토큰인증 실패");
      }
    }
  };
  const handleSwiper = (swiper) => {
    setSwiperInstance(swiper);
  };

  const toToday = () => {
    if (swiperInstance) {
      setDayArray(new Date(), swiperInstance.realIndex);
    }
  };
  return (
    <div className="club-room">
      <div className="my-info">
        <div className="infoBack">
          <Beams
            beamWidth={3.2}
            beamHeight={40}
            beamNumber={10}
            lightColor="rgba(184, 184, 184, 1)"
            speed={profilSpeed}
            noiseIntensity={2}
            scale={0.2}
            rotation={315}
          />
        </div>
        <div className="profil">
          <div className="topMenu">
            <h3 className="title">- 내 정보</h3>

            <div className="profilMenu">
              <div
                className="menuButton"
                onClick={() => setProfilMenu(profilMenu ? false : true)}
              >
                <RiMenuFoldFill className="menuIcon" />
              </div>
              <div
                className={`menuContent ${profilMenu ? "profilMenuOn" : ""}`}
              >
                <div
                  className="menuButton"
                  onClick={() => setProfilMenu(profilMenu ? false : true)}
                >
                  <RiMenuFold2Fill className="menuIcon" />
                </div>
                <div className="myPage">수정하기</div>

                {user.position === "임원진" ? (
                  <div className="toAdmin">
                    <Link to="/admin">관리자페이지</Link>
                  </div>
                ) : (
                  ""
                )}

                {isLogin ? (
                  <>
                    <div className="logout" onClick={handleLogout}>
                      로그아웃
                    </div>
                  </>
                ) : (
                  <div className="authOpen" onClick={() => setAuthIsOpen(true)}>
                    로그인
                  </div>
                )}
              </div>
            </div>
          </div>
          <div
            className="profilCard"
            onClick={() => setProfilSpeed(profilSpeed + 0.5)}
          >
            <div className="user">
              <div className="userImage">
                <img
                  src="/profilIcon.png"
                  alt="Logo"
                  className="defaultImage"
                />
              </div>
              <div className="userText">
                <div className="aka">{user.aka} </div>
                <div className="username">{user.username} </div>
                <div className="position">직책: {user.position}</div>
              </div>
            </div>
            <div className="nextPractice"></div>
          </div>
        </div>
      </div>
      <div className="content">
        <div className="schedule">
          <div className="topMenu">
            <div className="left">
              <h3 className="title">- 내 일정</h3>
              <div className="month">{month}월</div>
            </div>
            <div className="right">
              <div className="toToday" onClick={() => toToday()}>
                오늘 <RiArrowGoBackLine />
              </div>
              <Link className="createSchedule" to="/club/schedule">
                일정등록
              </Link>
            </div>
          </div>

          <Swiper
            onSlideChangeTransitionStart={() => setSwiping(true)}
            onSlideChangeTransitionEnd={(e) => changeSlideHandle(e)}
            onSwiper={handleSwiper}
            loop="true"
            className="swiper"
            slidesPerView={1}
            spaceBetween={1}
            resistanceRatio={0}
            speed={400}
          >
            {schedule.map((array, index) => (
              <SwiperSlide className="swiperBox" key={index}>
                <div className="swipeContent">
                  {array.map((date) => (
                    <div className="days" key={date}>
                      <div
                        className={`top ${
                          date.toLocaleDateString() ===
                          new Date().toLocaleDateString()
                            ? "isToday"
                            : ""
                        }`}
                      >
                        {toKrDay({ day: date.getDay() })}
                        <div
                          className="date"
                          style={{
                            color: `${date < thisWeek ? "gray" : ""}`,
                          }}
                        >
                          {date.getDate()}
                        </div>
                      </div>
                      <div className="isWritten">
                        {scheduleData.some(
                          (data) =>
                            data.date ===
                            getFomatDate(date.toLocaleDateString())
                        ) ? (
                          scheduleData.find(
                            (data) =>
                              data.date ===
                              getFomatDate(date.toLocaleDateString())
                          ).category === "confirm" ? (
                            <div className="confirm"></div>
                          ) : (
                            <div className="temp"></div>
                          )
                        ) : (
                          <div className="notWritten"></div>
                        )}
                      </div>
                      <div className="bottom">
                        <Link
                          className="editSchedule"
                          to={`/club/edit-schedule/${getFomatDate(
                            date.toLocaleDateString()
                          )}`}
                          style={{
                            color: `${date < thisWeek ? "gray" : ""}`,
                            zIndex: `${date < thisWeek ? "-3" : ""}`,
                          }}
                        >
                          <TbClockEdit />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="explanation">
            <div>
              <div className="confirm"></div>
              <div className="explanText">일정 확정</div>
            </div>
            <div>
              <div className="temp"></div>
              <div className="explanText">임시 저장</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div>
          <Loading />
        </div>
      ) : (
        <></>
      )}

      {authIsOpen ? (
        <AuthWindow
          setIsLogin={setIsLogin}
          setUser={setUser}
          setAuthIsOpen={setAuthIsOpen}
        />
      ) : (
        <></>
      )}
      <div className={`${swiping ? "swiping" : ""}`}></div>
    </div>
  );
};

export default ClubRoom;

/*
해야할 것:
1. 바텀 바 애니메이션 추가하기, 디자인 수정하기
2. 마이페이지 만들기
3. 동방 예약 디자인 통일하기 및 스와이퍼 오류 수정, 연습 갯수 제한 걸기, 연습 보는 방법 리스트로 변경
4. 임원진 기능 만들기
5. 네이바 만들어서 로그아웃 등 만들기
6. 로그인 안하면 화면 안보이게 로그인 화면만 보이도록 하자
7. 홈 일정 등록창 연결?
*/
