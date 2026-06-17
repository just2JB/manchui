import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user, sessionReady } = useAuth();
  const location = useLocation();

  if (!sessionReady) {
    return (
      <div className="club-route-session-pending" aria-busy="true">
        확인 중…
      </div>
    );
  }

  if (!user) {
    const from = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/club/login?from=${encodeURIComponent(from)}`}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
