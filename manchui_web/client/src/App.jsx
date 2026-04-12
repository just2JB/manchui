import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ModalProvider } from "./hooks/ManchuiModal";

import MainPage from "./pages/MainPage/MainPage";
import Goods from "./pages/Goods/Goods";
import ClubRoom from "./pages/ClubRoom/ClubRoom";
import Join from "./pages/Join/Join";
import Contact from "./pages/Contact/Contact";
import Privacy from "./pages/Privacy/Privacy";
import Terms from "./pages/Terms/Terms";
import Mypage from "./pages/ClubRoom/Mypage/Mypage";
import EditProfile from "./pages/ClubRoom/Mypage/EditProfile";
import EditUser from "./pages/ClubRoom/Mypage/EditUser";
import Reservation from "./pages/ClubRoom/Reservation/Reservation";
import ReservationShare from "./pages/ClubRoom/Reservation/ReservationShare";
import AdminHome from "./pages/Admin/AdminHome";
import AdminJoin from "./pages/Admin/AdminJoin";
import AdminSetting from "./pages/Admin/AdminSetting";
import AdminMember from "./pages/Admin/AdminMember";
import AdminReservation from "./pages/Admin/AdminReservation";
import AdminLayout from "./pages/Admin/AdminLayout";
import JoinForm from "./pages/Join/JoinForm";
import JoinCheck from "./pages/Join/JoinCheck";
import NotFound from "./pages/NotFound/NotFound";
import MainLayout from "./layouts/MainLayout";
import ClubRoomLayout from "./layouts/ClubRoomLayout";
import ProtectedRoute from "./layouts/ProtectedRoute";
import AdminRoute from "./layouts/AdminRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <MainPage /> },
      { path: "/contact", element: <Contact /> },
      { path: "/privacy", element: <Privacy /> },
      { path: "/terms", element: <Terms /> },
      { path: "/goods", element: <Goods /> },
      { path: "/join", element: <Join /> },
      { path: "/join/check", element: <JoinCheck /> },
      { path: "/join/form", element: <JoinForm /> },
    ],
  },
  {
    path: "/club",
    element: <ClubRoomLayout />,
    children: [
      {
        path: "reservation/share/:id",
        element: <ReservationShare />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <ClubRoom /> },
          { path: "reservation", element: <Reservation /> },
          { path: "mypage", element: <Mypage /> },
          { path: "mypage/profile", element: <EditProfile /> },
          { path: "mypage/:data", element: <EditUser /> },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminHome /> },
          { path: "join", element: <AdminJoin /> },
          { path: "member", element: <AdminMember /> },
          { path: "reservation", element: <AdminReservation /> },
          { path: "setting", element: <AdminSetting /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

function App() {
  return (
    <ModalProvider>
      <RouterProvider router={router} />
    </ModalProvider>
  );
}

export default App;
