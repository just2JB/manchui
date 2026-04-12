import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { ScrollToTopOnRoute } from "../components/ScrollToTopOnRoute/ScrollToTopOnRoute";
import PreparingPage from "./PreparingPage";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const JOIN_PATHS = ["/join", "/join/check", "/join/form"];

const MainLayout = () => {
  const location = useLocation();
  const [joinConfig, setJoinConfig] = useState({
    formOpen: true,
    currentGeneration: null,
    siteRestricted: false,
    assistantEnabled: true,
    president: { name: "", contact: "", major: "" },
  });
  const [joinConfigLoading, setJoinConfigLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!serverUrl) {
      setJoinConfigLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const responsse = await axios.post(
          `${serverUrl}/api/auth/verify-token`,
          {},
          { withCredentials: true },
        );
        setUser(responsse.data.user);
      } catch (error) {
        console.log("토큰 인증 실패", error);
      }
    };
    verifyToken();

    axios
      .get(`${serverUrl}/api/join/config`)
      .then((res) => {
        setJoinConfig({
          formOpen: res.data.formOpen !== false,
          currentGeneration: res.data.currentGeneration ?? null,
          siteRestricted: Boolean(res.data.siteRestricted),
          assistantEnabled: res.data.assistantEnabled !== false,
          president: res.data.president
            ? {
                name: res.data.president.name ?? "",
                contact: res.data.president.contact ?? "",
                major: res.data.president.major ?? "",
              }
            : { name: "", contact: "", major: "" },
        });
      })
      .catch(() => {})
      .finally(() => setJoinConfigLoading(false));
  }, []);

  const isJoinPath = JOIN_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/"),
  );
  const showPreparing = joinConfig.siteRestricted && !isJoinPath;

  return (
    <div className="layout-wrapper">
      <ScrollToTopOnRoute />
      <Navbar siteRestricted={joinConfig.siteRestricted} user={user} />
      {showPreparing ? (
        <PreparingPage variant="main" />
      ) : (
        <Outlet context={{ joinConfig, joinConfigLoading }} />
      )}
      <Footer />
    </div>
  );
};

export default MainLayout;
