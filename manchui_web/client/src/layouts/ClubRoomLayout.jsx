import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import ClubRoomNavbar from "../pages/ClubRoom/ClubRoomNavbar";
import AuthWindow from "../pages/ClubRoom/AuthWindow/AuthWindow";
import { ScrollToTopOnRoute } from "../components/ScrollToTopOnRoute/ScrollToTopOnRoute";
import PreparingPage from "./PreparingPage";

const serverUrl = import.meta.env.VITE_SERVER_URL;

/** 공개 예약 공유 링크만 어시스턴트 비활성화 시에도 표시 */
function isReservationSharePath(pathname) {
  return /^\/club\/reservation\/share\/[^/]+$/.test(pathname);
}

const ClubRoomLayout = () => {
  const location = useLocation();
  const [siteRestricted, setSiteRestricted] = useState(false);
  const [assistantEnabled, setAssistantEnabled] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [user, setUser] = useState({});

  useEffect(() => {
    if (!serverUrl) {
      setConfigLoading(false);
      return;
    }
    axios
      .get(`${serverUrl}/api/join/config`)
      .then((res) => {
        setSiteRestricted(Boolean(res.data.siteRestricted));
        setAssistantEnabled(res.data.assistantEnabled !== false);
      })
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, []);

  if (!configLoading && siteRestricted) {
    return (
      <div className="clubRoomLayout preparingWrapper">
        <PreparingPage variant="club" reason="siteRestricted" />
      </div>
    );
  }

  if (
    !configLoading &&
    assistantEnabled === false &&
    !isReservationSharePath(location.pathname)
  ) {
    return (
      <div className="clubRoomLayout preparingWrapper">
        <PreparingPage variant="club" reason="assistantDisabled" />
      </div>
    );
  }

  return (
    <>
      <ScrollToTopOnRoute />
      <div className="clubRoomLayout">
        {assistantEnabled ? <ClubRoomNavbar /> : null}
        <div className="clubRoombody">
          <Outlet context={{ user, setUser }} />
        </div>
        {user ? "" : <AuthWindow setUser={setUser} />}
      </div>
    </>
  );
};

export default ClubRoomLayout;
