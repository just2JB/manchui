import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import axios from "axios";
import ClubRoomNavbar from "../pages/ClubRoom/ClubRoomNavbar";
import AuthWindow from "../pages/ClubRoom/AuthWindow/AuthWindow";
import { ScrollToTopOnRoute } from "../components/ScrollToTopOnRoute/ScrollToTopOnRoute";
import PreparingPage from "./PreparingPage";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const ClubRoomLayout = () => {
  const [siteRestricted, setSiteRestricted] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [user, setUser] = useState({});

  useEffect(() => {
    if (!serverUrl) {
      setConfigLoading(false);
      return;
    }
    axios
      .get(`${serverUrl}/api/join/config`)
      .then((res) => setSiteRestricted(Boolean(res.data.siteRestricted)))
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, []);

  if (!configLoading && siteRestricted) {
    return (
      <div className="clubRoomLayout preparingWrapper">
        <PreparingPage />
      </div>
    );
  }

  return (
    <>
      <ScrollToTopOnRoute />
      <div className="clubRoomLayout">
        <ClubRoomNavbar />
        <div className="clubRoombody">
          <Outlet context={{ user, setUser }} />
        </div>
        {user ? "" : <AuthWindow setUser={setUser} />}
      </div>
    </>
  );
};

export default ClubRoomLayout;
