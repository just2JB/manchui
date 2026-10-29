import React, { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import Loading from "../../../components/Loading/Loading";
import ClubHomeScheduleEditor from "../Home/ClubHomeScheduleEditor";
import {
  buildRequestDateSetFromTeamRequests,
  buildUserScheduleMap,
} from "../Home/clubHomeUtils";
import { normalizeDateKey } from "../Team/teamCalendarUtils";
import { clubKeys } from "../../../queries/clubQueryKeys";
import {
  isClubInitialLoading,
  useClubQueryInvalidationOnFocus,
  useInvalidateClubHome,
  useMyScheduleRequestsQuery,
  useMySchedulesQuery,
} from "../../../queries/useClubQueries";
import "../Home/ClubHome.css";
import "./Mypage.css";

const MypageSchedule = () => {
  const nav = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?._id;

  const initialDateKey = useMemo(() => {
    const fromQuery = normalizeDateKey(searchParams.get("date"));
    return fromQuery ?? normalizeDateKey(new Date());
  }, [searchParams]);

  const returnTo =
    typeof location.state?.returnTo === "string"
      ? location.state.returnTo
      : "/club/mypage";

  const schedulesQuery = useMySchedulesQuery(userId);
  const scheduleRequestsQuery = useMyScheduleRequestsQuery(userId);
  const invalidateHome = useInvalidateClubHome(userId);
  useClubQueryInvalidationOnFocus(invalidateHome);

  const scheduleMap = useMemo(
    () => buildUserScheduleMap(schedulesQuery.data ?? []),
    [schedulesQuery.data],
  );

  const requestDateSet = useMemo(
    () => buildRequestDateSetFromTeamRequests(scheduleRequestsQuery.data ?? []),
    [scheduleRequestsQuery.data],
  );

  const todayKey = initialDateKey;

  const handleScheduleSaved = (dateKey, schedule) => {
    if (!userId) return;
    queryClient.setQueryData(clubKeys.schedules(userId), (prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const next = list.filter(
        (item) => normalizeDateKey(item.date) !== dateKey,
      );
      if (schedule && schedule.category !== "temp") {
        next.push(schedule);
      }
      return next;
    });
  };

  const handleClose = () => {
    nav(returnTo);
  };

  const handleSaveComplete = () => {
    void invalidateHome();
    nav(returnTo);
  };

  if (isClubInitialLoading(schedulesQuery) || isClubInitialLoading(scheduleRequestsQuery)) {
    return (
      <div className="mypageSchedule mypageSchedule--loading">
        <Loading overlay={false} />
      </div>
    );
  }

  return (
    <ClubHomeScheduleEditor
      open
      dateKey={todayKey}
      scheduleMap={scheduleMap}
      requestDateSet={requestDateSet}
      onClose={handleClose}
      onSaveComplete={handleSaveComplete}
      onScheduleSaved={handleScheduleSaved}
    />
  );
};

export default MypageSchedule;
