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
  const [activeTeam, setActiveTeam] = useState([]);

  const { user } = useOutletContext();
  const nav = useNavigate();
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
  const getDday = (goals) => {
    const today = getFomatDate(new Date().toLocaleDateString())
      .split("-")
      .join("");

    if (goals.find((goal) => goal.date.split("-").join("") > today)) {
      return {
        name: goals.find((goal) => goal.date.split("-").join("") > today).name,
        date:
          "D" +
          Math.floor(
            (new Date() -
              new Date(
                goals.find((goal) => goal.date.split("-").join("") > today).date
              )) /
              86400000 +
              1
          ),
      };
    } else if (goals.find((goal) => goal.date.split("-").join("") === today)) {
      return {
        name: goals.find((goal) => goal.date.split("-").join("") === today)
          .name,
        date: "D-day",
      };
    } else {
      return {
        name: goals[goals.length - 1].name,
        date:
          "D+" +
          Math.floor(
            (new Date() - new Date(goals[goals.length - 1].date)) / 86400000 + 1
          ),
      };
    }
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
        setActiveTeam(response.data.activeTeam);
      } catch (error) {
        alert(error.response.data.message);
      }
    };

    getMyTeams();
  }, []);
  return (
    <div className="teamPage">
      <div className="topMenu">
        <h4></h4>
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
              <div
                className="colorLabel"
                style={{
                  background: `${item.teamColor}`,
                }}
              ></div>
              <div className="left">
                <div className="teamName">{item.name}</div>
                <div className="dday">
                  {item.goals.length > 0 ? (
                    <div className="goalName">{getDday(item.goals).name}</div>
                  ) : (
                    "자유 연습"
                  )}
                  {item.goals.length > 0 ? (
                    <div className="goalDate">{`${
                      getDday(item.goals).date
                    }`}</div>
                  ) : (
                    ""
                  )}
                </div>
              </div>
              <div className="right">
                <div
                  className={`tag ${
                    activeTeam.includes(item._id) ? "active" : ""
                  }`}
                >
                  Active
                </div>

                <div className="teamInfo">
                  <div>
                    팀원<div>{item.members.length}</div>
                  </div>
                  <div>
                    연습횟수 <div>{item.numberofPractice}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;
