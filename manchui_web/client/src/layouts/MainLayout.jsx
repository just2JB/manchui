import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { ScrollToTopOnRoute } from "../components/ScrollToTopOnRoute/ScrollToTopOnRoute";
import Loading from "../components/Loading/Loading";
import PreparingPage from "./PreparingPage";
import { useAppSettings } from "../context/AppSettingsContext";

const JOIN_PATHS = ["/join", "/join/check", "/join/form"];

const MainLayout = () => {
  const location = useLocation();
  const { joinConfig, joinConfigLoading, joinConfigLoaded, ensureJoinConfigLoaded } =
    useAppSettings();
  const isJoinPath = JOIN_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/"),
  );

  useEffect(() => {
    if (isJoinPath) {
      void ensureJoinConfigLoaded();
    }
  }, [isJoinPath, ensureJoinConfigLoaded]);

  const showPreparing =
    joinConfigLoaded && joinConfig.siteRestricted && !isJoinPath;
  const navbarSiteRestricted = joinConfigLoaded ? joinConfig.siteRestricted : false;
  const navbarAssistantEnabled = joinConfigLoaded
    ? joinConfig.assistantEnabled
    : true;

  return (
    <div className="layout-wrapper">
      <ScrollToTopOnRoute />
      <Navbar
        siteRestricted={navbarSiteRestricted}
        assistantEnabled={navbarAssistantEnabled}
      />
      {isJoinPath && joinConfigLoading ? (
        <div className="join-route-loading">
          <Loading overlay={false} size="sm" />
        </div>
      ) : showPreparing ? (
        <PreparingPage variant="main" />
      ) : (
        <Outlet />
      )}
      <Footer />
    </div>
  );
};

export default MainLayout;
