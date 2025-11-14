import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import "./Practice.css";
import { IoAdd } from "react-icons/io5";
import { useEffect } from "react";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
import { useState } from "react";
const serverUrl = import.meta.env.VITE_SERVER_URL;

//내가 가입된 팀만 가져오기
//팀 id로 메인 이동

const Practice = () => {
  const [myTeams, setMyTeams] = useState([]);
  const { user } = useOutletContext();
  const nav = useNavigate();
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
      } catch {}
    };
    getMyTeams();
  }, []);
  return (
    <div className="practice">
      <div className="teams">
        <div className="topMenu">
          <h4>내 팀</h4>
          <span>
            <IoAdd onClick={() => nav("/club/create-team")} />새 팀
          </span>
        </div>
        <div className="joinedList">
          {/* {
            <div className="noTeam">
              가입되어있는 팀이 없습니다. 팀을 만들어 시작해보세요!
              <button onClick={() => nav("/club/create-team")}>
                팀 만들기
              </button>
            </div>
          } */}
          {myTeams.map((item) => (
            <div
              className="joinedTeam"
              key={item._id}
              onClick={() => nav(`/club/team-main/:${item._id}`)}
            >
              <div className="teamName">{item.name}</div>
              <div className="toTeamMain">{">"}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="myPractice">
        <div className="topMenu">
          <h4>내 연습</h4>
          <div className="">월 별로 보기, 리스트로 보기</div>
        </div>
        <div className="practiceList"></div>
        <div className="practiceCalender"></div>
      </div>
    </div>
  );
};

export default Practice;
