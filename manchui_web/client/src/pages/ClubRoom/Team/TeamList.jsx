import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoAdd, IoPeopleOutline } from "react-icons/io5";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import TeamListCard from "./TeamListCard";
import TeamListSkeleton from "./TeamListSkeleton";
import { isTeamLeader } from "./teamUtils";
import "./Team.css";

const TeamList = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [teams, setTeams] = useState([]);
  const [activeTeamIds, setActiveTeamIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTeams = useCallback(async () => {
    if (!user?._id) {
      setTeams([]);
      setActiveTeamIds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/team/user/${user._id}`, {
        withCredentials: true,
      });
      setTeams(Array.isArray(res.data?.myTeam) ? res.data.myTeam : []);
      setActiveTeamIds(
        Array.isArray(res.data?.activeTeam)
          ? res.data.activeTeam.map(String)
          : [],
      );
    } catch (e) {
      console.error(e);
      setTeams([]);
      setActiveTeamIds([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const teamCountLabel = useMemo(() => {
    if (teams.length === 0) return null;
    return `내 팀 ${teams.length}개`;
  }, [teams.length]);

  return (
    <div className="teamPage teamPage--list">
      <header className="teamPage__header">
        <div className="teamPage__headerText">
          <h1 className="teamPage__title">팀</h1>
        </div>
        <button
          type="button"
          className="teamPage__headerAction"
          onClick={() => nav("/club/team/new")}
          disabled={loading}
          aria-busy={loading || undefined}
        >
          <IoAdd aria-hidden />
          만들기
        </button>
      </header>

      {loading ? (
        <TeamListSkeleton />
      ) : teams.length === 0 ? (
        <div className="teamPage__empty">
          <span className="teamPage__emptyIconWrap" aria-hidden>
            <IoPeopleOutline className="teamPage__emptyIcon" />
          </span>
          <p className="teamPage__emptyTitle">아직 가입한 팀이 없어요</p>
          <p className="teamPage__emptyDesc">
            팀을 만들면 멤버와 함께
            <br />
            연습 일정을 쉽게 맞출 수 있어요.
          </p>
          <button
            type="button"
            className="teamPage__emptyBtn"
            onClick={() => nav("/club/team/new")}
          >
            <IoAdd aria-hidden />팀 만들기
          </button>
        </div>
      ) : (
        <>
          {teamCountLabel ? (
            <p className="teamPage__sectionLabel">{teamCountLabel}</p>
          ) : null}
          <div className="teamPage__list">
            {teams.map((team) => {
              const id = String(team._id);
              return (
                <TeamListCard
                  key={id}
                  team={team}
                  isLeader={isTeamLeader(team, user?._id)}
                  isActive={activeTeamIds.includes(id)}
                  onClick={() => nav(`/club/team/${team._id}`)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TeamList;
