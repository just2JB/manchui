import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import axios from "axios";
import "./ClubRoom.css";
import Loading from "../../components/Loading/Loading";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const ClubRoom = () => {
  const [loading, setLoading] = useState(false);
  const [requestSchedules, setRequestSchedules] = useState([]);
  const [practices, setPractices] = useState([]);
  const [mySchedule, setMySchedule] = useState([]);
  const { user } = useOutletContext();
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
    } else {
      return 0;
    }
  };
  useEffect(() => {
    const getPractices = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/practice/today/${user._id}`,
          {
            withCredentials: true,
          }
        );
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
        const sortedreqs = uniqueArray.sort((a, b) => {
          if (getFomatDate(a) > getFomatDate(b)) {
            return 1;
          } else if (getFomatDate(a) === getFomatDate(b)) {
            return 0;
          } else if (getFomatDate(a) < getFomatDate(b)) {
            return -1;
          }
        });
        setRequestSchedules(sortedreqs);
      } catch (error) {
        alert(error.response.data.message);
      }
    };
    getPractices();
    getMySchedules();
    getRequestSchedules();
  }, []);
  return (
    <div className="club-room">
      <div className="my-info">
        <div className="profil">
          <div className="profilCard">
            <div className="user">
              <div className="userText">
                <div className="Identification">{user.Identification} </div>
                <div className="username">{user.username} </div>
                <div className="position">직책: {user.position}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="requestSchedule">
        스케줄 작성
        <div className="present">
          <div className="persentText">{rateSchedule()}%</div>
          <div className="barWarp">
            <div
              className="persentBar"
              style={{ width: `${rateSchedule()}%` }}
            ></div>
          </div>
        </div>
      </div>
      <div className="practiceView">
        <div className="pracToday">
          오늘의 연습
          <div className="pracList">
            {practices
              .filter(
                (prac) =>
                  prac.date === getFomatDate(new Date().toLocaleDateString())
              )
              .map((practice) => (
                <div key={practice._id} className="practiceCard">
                  <div className="teamName">{practice.teamName}</div>
                  <div className="pracTime">
                    {(practice.time.split("~")[0] * 2) % 2 === 0
                      ? `${practice.time.split("~")[0]}:00`
                      : `${practice.time.split("~")[0] - 0.5}:30`}
                    ~
                    {(practice.time.split("~")[1] * 2) % 2 === 0
                      ? `${practice.time.split("~")[1]}:00`
                      : `${practice.time.split("~")[1] - 0.5}:30`}
                  </div>
                </div>
              ))}
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
    </div>
  );
};

export default ClubRoom;

/*
------------------------------------------------------------

1. 로그인 안하면 화면 안보이게 로그인 화면 띄우기 

------------------------------------------------------------

2. 메인 홈을 대시보드처럼 만들기
> 내 정보
> 다음 연습, 예정된 연습 개수
> 스케줄 요청된 개수 > 클릭 시 일정 작성으로 이동
> 전체적으로 페이지 이동할 수 있는 기능 추가 필요(마이페이지, 연습, 팀, 일정 작성)

------------------------------------------------------------

3. 일정 작성 페이지
> 달력으로 요청된 날짜 보기
> 클릭하여 수정 페이지로 이동
> 상단 메뉴에 요청 날짜순 나열
> 기회가 되면 프리셋 만들어보기(시간표 미리 입력해서 안되는 시간 제외)

------------------------------------------------------------

4. 연습 페이지 
> 내연습만 보기, 전체 보기 UI 완성
> 전체적 구성 및 디자인 수정

------------------------------------------------------------

5. 팀 페이지 

> 구분 아이디 볼 수 있게 업데이트
> 설명 수정하기 완성
> 리더 권한 설정
> 비리더 팀원 전용 UI구성
> 팀 정보 수정 페이지 만들기
> 디자인 수정
> 연습 생성, 편집 시 연습실 정보 열람 가능하도록
> 팀 목록 구성 변경 필요

 -----------------------------------------------------------

6. 동방 예약 말고 연습실 예약 관련 페이지로 변경
> 주변 연습실 정보
> 주변 엽습실 예약 정보
> 동아리방 예약
> 동아리방 이용 안내 
> 동방 예약 공유 페이지 만들기

------------------------------------------------------------

7. 임원진 기능 만들기 < 후순위

------------------------------------------------------------

8. 디자인에 맞는 알림박스, 확인 박스 만들기

------------------------------------------------------------
*/
