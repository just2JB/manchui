import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { ScrollToTopOnRoute } from "../components/ScrollToTopOnRoute/ScrollToTopOnRoute";
import PreparingPage from "./PreparingPage";
import { useAppSettings } from "../context/AppSettingsContext";
import { useAuth } from "../context/AuthContext";
import { LOADING_TEXT } from "../constants/loadingText";

const JOIN_PATHS = ["/join", "/join/check", "/join/form"];

const MainLayout = () => {
  const location = useLocation();
  const { joinConfig, joinConfigLoading } = useAppSettings();
  const { user } = useAuth();

  const isJoinPath = JOIN_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/"),
  );
  const showPreparing = joinConfig.siteRestricted && !isJoinPath;

  return (
    <div className="layout-wrapper">
      <ScrollToTopOnRoute />
      <Navbar
        siteRestricted={joinConfig.siteRestricted}
        assistantEnabled={joinConfig.assistantEnabled}
        user={user}
      />
      {joinConfigLoading ? (
        <p className="layout-loading" aria-live="polite">
          {LOADING_TEXT}
        </p>
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
