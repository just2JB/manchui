import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ScrollToTopOnRoute } from "../components/ScrollToTopOnRoute/ScrollToTopOnRoute";
import { useManchuiModal } from "../hooks/ManchuiModal";
import { useAuth } from "../context/AuthContext";
import "./AdminRoute.css";

const AdminRoute = () => {
  const manchuiModal = useManchuiModal();
  const nav = useNavigate();
  const location = useLocation();

  const { user, sessionReady } = useAuth();
  const [routeStatus, setRouteStatus] = useState(null);

  useEffect(() => {
    if (!sessionReady) return;
    if (!user) {
      setRouteStatus("unauthenticated");
      return;
    }
    if (user.position !== "임원진") {
      setRouteStatus("forbidden");
      return;
    }
    setRouteStatus("ready");
  }, [sessionReady, user]);

  useEffect(() => {
    if (routeStatus !== "forbidden") return;
    let cancelled = false;
    (async () => {
      await manchuiModal("임원진만 관리자 페이지에 접근할 수 있습니다.");
      if (!cancelled) nav("/club");
    })();
    return () => {
      cancelled = true;
    };
  }, [routeStatus, manchuiModal, nav]);

  if (!sessionReady || routeStatus === null) {
    return (
      <div className="admin-route-loading" aria-busy="true" aria-live="polite">
        확인 중…
      </div>
    );
  }

  if (routeStatus === "forbidden") {
    return null;
  }

  if (routeStatus === "unauthenticated") {
    const from = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/club/login?from=${encodeURIComponent(from)}`}
        replace
      />
    );
  }

  return (
    <>
      <ScrollToTopOnRoute />
      <Outlet />
    </>
  );
};

export default AdminRoute;
