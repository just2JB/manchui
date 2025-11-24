import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import "./Team.css";
import { IoAdd } from "react-icons/io5";
import { useEffect } from "react";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
import { useState } from "react";
const serverUrl = import.meta.env.VITE_SERVER_URL;
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
//내가 가입된 팀만 가져오기
//팀 id로 메인 이동

const Team = () => {
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
      } catch {
        alert(error.response.data.message);
      }
    };

    getMyTeams();
  }, []);
  return (
    <div className="teamPage">
      <div className="topMenu">
        <h4>내 팀</h4>
        <span
          className="newTeamButton"
          onClick={() => nav("/club/team/create-team")}
        >
          <IoAdd />새 팀
        </span>
      </div>
      <div className="listContainer">
        <div className="joinedList">
          {myTeams.map((item) => (
            <div
              className="joinedTeam"
              key={item._id}
              onClick={() => nav(`/club/team/team-main/:${item._id}`)}
            >
              <div className="labelColor"></div>
              <div className="teamName">{item.name}</div>
              <div className="toTeamMain">
                <MdOutlineKeyboardArrowRight />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;
