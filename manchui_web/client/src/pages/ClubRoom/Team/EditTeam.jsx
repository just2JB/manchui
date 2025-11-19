import React, { useEffect, useState } from "react";
import "./EditTeam.css";
import axios from "axios";
import { useParams } from "react-router-dom";
const serverUrl = import.meta.env.VITE_SERVER_URL;
const EditTeam = () => {
  const [team, setTeam] = useState({
    name: "",
    members: [],
    requestSchedules: [],
  });
  const parmas = useParams();
  useEffect(() => {
    const getMyTeams = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/team/${parmas.id.slice(1)}`,
          {
            withCredentials: true,
          }
        );
        setTeam({
          ...response.data.team,
          memberSchedules: response.data.memberSchedules,
        });
      } catch {
        alert("존재하지 않는 팀 입니다.");
        nav("/club/practice");
      }
    };
    getMyTeams();
  }, []);

  return <div className="editTeam">{team.name}
    
  </div>;
};

export default EditTeam;
