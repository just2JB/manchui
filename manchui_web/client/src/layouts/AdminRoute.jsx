import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { ScrollToTopOnRoute } from "../components/ScrollToTopOnRoute/ScrollToTopOnRoute";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const AdminRoute = () => {
  const [isAuthenticated, setIsauthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const nav = useNavigate();

  const notAuth = () => {
    nav("/club");
    alert("임원진이 아닙니다.");
  };

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const responsse = await axios.post(
          `${serverUrl}/api/auth/verify-token`,
          {},
          { withCredentials: true },
        );
        setIsauthenticated(responsse.data.isValid);
        setUser(responsse.data.user);
        if (responsse.data.user.position !== "임원진") {
          notAuth();
        }
      } catch (error) {
        console.log("토큰 인증 실패", error);
        setIsauthenticated(false);
        setUser(null);
      }
    };
    verifyToken();
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  return isAuthenticated ? (
    <>
      <ScrollToTopOnRoute />
      <Outlet context={{ user }} />
    </>
  ) : (
    notAuth()
  );
};

export default AdminRoute;
