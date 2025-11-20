import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import "./Practice.css";
import { IoAdd } from "react-icons/io5";
import { BsBoxArrowInRight } from "react-icons/bs";
import { useEffect } from "react";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
import { useState } from "react";
const serverUrl = import.meta.env.VITE_SERVER_URL;

//내가 가입된 팀만 가져오기
//팀 id로 메인 이동

const Practice = () => {
  const [myTeams, setMyTeams] = useState([]);
  const [practices, setPractices] = useState([]);
  const [seePractices, setSeePractices] = useState([]);
  const [selcetDay, setSelcetDay] = useState(new Date());
  const { user } = useOutletContext();
  const nav = useNavigate();
  const nextDate = (num) => {
    const nextDate = new Date();
    nextDate.setDate(selcetDay.getDate() + num);
    setSelcetDay(nextDate);
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
    const getMyTeams = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/team/user/${user._id}`,
          {
            withCredentials: true,
          }
        );
        setMyTeams(response.data.myTeam);
      } catch {
        alert(error.response.data.message);
      }
    };
    const getPractices = async () => {
      try {
        const response = await axios.get(`${serverUrl}/api/practice`, {
          withCredentials: true,
        });
        const sortedPractices = response.data.practices.sort((a, b) => {
          const aFirst = a.time.split("~")[0];
          const bFirst = b.time.split("~")[0];
          if (aFirst > bFirst) return 1;
          if (aFirst === bFirst) return 0;
          if (aFirst < bFirst) return -1;
        });
        setPractices(sortedPractices);
        setSeePractices(sortedPractices);
      } catch {
        alert(error.response.data.message);
      }
    };
    getPractices();
    getMyTeams();
  }, []);
  return (
    <div className="practice">
      <div className="weekSelector">엄;</div>
      <div className="myPractice">
        <div className="topMenu"></div>
        <div className="practicesBottom">
          <div className="listControler">
            <div onClick={() => nextDate(-1)}>전날</div>
            <div onClick={() => changeUser(user._id)} className="">
              내 연습만 보기
            </div>
            <div onClick={() => changeUser("All")} className="">
              모두 보기
            </div>
            <div onClick={() => nextDate(1)}>다음날</div>
          </div>
          <div className="practiceList">
            <div>{selcetDay.toLocaleDateString()}</div>
            <div className="listPracticeCard listIndex">
              <div>팀</div>
              <div>시간</div>
              <div>연습실</div>
            </div>
            {seePractices
              .filter(
                (practice) =>
                  new Date(practice.date).toLocaleDateString() ===
                  selcetDay.toLocaleDateString()
              )
              .map((practice) => (
                <div key={practice._id} className="listPracticeCard">
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

                  <div>{practice.place}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className="floatAddPractice">+새 연습</div>
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

*/
