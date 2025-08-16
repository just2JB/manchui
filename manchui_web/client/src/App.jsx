import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import MainPage from "./pages/MainPage/MainPage";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import ClubRoom from "./pages/ClubRoom/ClubRoom";
import Join from "./pages/Join/Join";

import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import ClubRoomNavbar from "./pages/ClubRoom/ClubRoomNavbar";
import Practice from "./pages/ClubRoom/Practice/Practice";

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
  return (
    <>
      <ClubRoomNavbar />
      <Outlet />
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
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
