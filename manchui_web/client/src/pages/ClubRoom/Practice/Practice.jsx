import React from "react";
import "./Practice.css";
import Schedule from "../../../components/Schedule/Schedule";

const mokData = [
  {
    name: "지범팀",
    member: [],
    id: 0,
  },
  {
    name: "하경팀",
    member: [],
    id: 2,
  },
];

const Practice = () => {
  return (
    <div className="practice">
      <div className="state">
        <div className="myteams">
          내 팀
          <div className="teams">
            {mokData.map((team) => (
              <div key={team.id} className="team">
                {team.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mySchedule">
        <Schedule />
      </div>

      <div className="find">
        팀 참여하기 ex)3km20
        <div className="code">
          <input placeholder="코드를 입력하세요." />
          <div className="join">
            <button>참여!</button>
          </div>
        </div>
      </div>
      <div className="create">
        <button>만들기</button>
      </div>
    </div>
  );
};

export default Practice;
