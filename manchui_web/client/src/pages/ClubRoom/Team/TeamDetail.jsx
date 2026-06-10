import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import Loading from "../../../components/Loading/Loading";
import "./Team.css";

const TeamDetail = () => {
  const { teamId } = useParams();
  const nav = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadTeam = useCallback(async () => {
    if (!teamId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    try {
      const res = await apiClient.get(`/api/team/${teamId}`, {
        withCredentials: true,
      });
      setTeam(res.data?.team ?? null);
      if (!res.data?.team) setNotFound(true);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
        setNotFound(true);
      }
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  if (loading) {
    return (
      <div className="teamPage">
        <Loading />
      </div>
    );
  }

  if (notFound || !team) {
    return (
      <div className="teamPage">
        <button
          type="button"
          className="teamPage__back"
          onClick={() => nav("/club/team")}
        >
          ← 팀 목록
        </button>
        <p className="teamPage__intro">팀을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const members = Array.isArray(team.members) ? team.members : [];
  const leaderId = team.leaderId ? String(team.leaderId) : "";

  return (
    <div className="teamPage">
      <button
        type="button"
        className="teamPage__back"
        onClick={() => nav("/club/team")}
      >
        ← 팀 목록
      </button>

      <div className="teamDetail__header">
        <span
          className="teamDetail__swatch"
          style={{ backgroundColor: team.teamColor || "#E87070" }}
          aria-hidden
        />
        <div className="teamDetail__headerMain">
          <h1 className="teamDetail__name">{team.name}</h1>
          <p className="teamDetail__meta">멤버 {members.length}명</p>
        </div>
      </div>

      <section className="teamDetail__section">
        <h2 className="teamDetail__sectionTitle">팀 소개</h2>
        <p className="teamDetail__comment">{team.comment || "작성해 주세요."}</p>
      </section>

      <section className="teamDetail__section">
        <h2 className="teamDetail__sectionTitle">멤버</h2>
        <ul className="teamDetail__members">
          {members.map((member) => {
            const id = String(member._id ?? member);
            const isLeader = leaderId && id === leaderId;
            return (
              <li key={id} className="teamDetail__member">
                <span>{member.username ?? "이름 없음"}</span>
                {isLeader ? (
                  <span className="teamDetail__leaderBadge">팀장</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

export default TeamDetail;
