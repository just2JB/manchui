import "./App.css";
import { useEffect, useState } from "react";
import {
  createBrowserRouter,
  useNavigate,
  Outlet,
  RouterProvider,
  useOutletContext,
} from "react-router-dom";

import axios from "axios";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import MainPage from "./pages/MainPage/MainPage";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import ClubRoom from "./pages/ClubRoom/ClubRoom";
import Join from "./pages/Join/Join";
import ClubRoomNavbar from "./pages/ClubRoom/ClubRoomNavbar";
import Reservation from "./pages/ClubRoom/Reservation/Reservation";
import Mypage from "./pages/ClubRoom/Mypage/Mypage";

import Practice from "./pages/ClubRoom/Practice/Practice";
import CreatePractice from "./pages/ClubRoom/Practice/CreatePractice";
import EditPractice from "./pages/ClubRoom/Practice/EditPractice";
import BottomBar from "./pages/ClubRoom/BottomBar";

import AdminHome from "./pages/Admin/AdminHome";
import AdminJoin from "./pages/Admin/AdminJoin";

const serverUrl = import.meta.env.VITE_SERVER_URL;

function ProtectedRoute() {
  const [isAuthenticated, setIsauthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const { setIsLogin } = useOutletContext();
  const nav = useNavigate();
  const notAuth = () => {
    nav("/club");
    alert("로그인 해야 사용할 수 있습니다.");
  };

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const responsse = await axios.post(
          `${serverUrl}/api/auth/verify-token`,
          {},
          { withCredentials: true }
        );
        setIsauthenticated(responsse.data.isValid);
        setUser(responsse.data.user);
        setIsLogin(true);
      } catch (error) {
        console.log("토큰 인증 실패", error);
        setIsauthenticated(false);
        setIsLogin(false);
        setUser(null);
      }
    };
    verifyToken();
  }, []);

  if (isAuthenticated === null) {
    return null;
  }
  return isAuthenticated ? <Outlet context={{ user }} /> : notAuth();
}

function AdminRoute() {
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
          { withCredentials: true }
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
  return isAuthenticated ? <Outlet context={{ user }} /> : notAuth();
}

function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

function ClubRoomLayout() {
  const [isLogin, setIsLogin] = useState(false);
  const [authIsOpen, setAuthIsOpen] = useState(false);

  return (
    <>
      <div className="clubRoomLayout">
        <div className="clubRoombody">
          <ClubRoomNavbar
            isLogin={isLogin}
            setIsLogin={setIsLogin}
            setAuthIsOpen={setAuthIsOpen}
          />
          <Outlet
            context={{
              isLogin,
              setIsLogin,
              authIsOpen,
              setAuthIsOpen,
            }}
          />
        </div>
        <BottomBar />
      </div>
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <MainPage /> },
      { path: "/about", element: <About /> },
      { path: "/contact", element: <Contact /> },
      { path: "/join", element: <Join /> },
    ],
  },
  {
    path: "/club",
    element: <ClubRoomLayout />,
    children: [{ index: true, element: <ClubRoom /> }],
  },
  {
    path: "/club",
    element: <ClubRoomLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { path: "practice", element: <Practice /> },
          { path: "create-practice", element: <CreatePractice /> },
          { path: "edit-practice/:id", element: <EditPractice /> },
          { path: "reservation", element: <Reservation /> },
          { path: "mypage", element: <Mypage /> },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      { index: true, element: <AdminHome /> },
      { path: "join", element: <AdminJoin /> },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
