import React from "react";
import "./MainPage.css";
import LiquidChrome from "../../components/LiquidChrome/LiquidChrome";

import { MdAddAlarm } from "react-icons/md";

const MainPage = () => {
  return (
    <div className="main-page">
      <div className="background">
        <div className="liquid">
          <div
            style={{ width: "100%", height: "1000px", position: "relative" }}
          >
            <LiquidChrome
              baseColor={[0.05, 0.05, 0.05]}
              speed={0.15}
              amplitude={0.3}
              interactive={false}
            />
          </div>
        </div>
        <div className="cover"></div>
      </div>

      <div className="main-content">
        <p>종합예술 댄스 동아리 만가지를 취하다, 만취</p>
      </div>
    </div>
  );
};

export default MainPage;
