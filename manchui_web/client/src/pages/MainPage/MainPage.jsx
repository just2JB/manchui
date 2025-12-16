import React from "react";
import "./MainPage.css";
import LiquidChrome from "../../components/LiquidChrome/LiquidChrome";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { MdAddAlarm } from "react-icons/md";

const MainPage = () => {
  const tet = useManchuiModal();

  const handelCheck = async () => {
    const isConfirmed = await tet("테스트", "confirm");
    if (isConfirmed) {
      console.log("서버 삭제 API 호출");
      alert("삭제되었습니다.");
    } else {
      console.log("삭제가 취소되었습니다.");
    }
  };

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
        <div className="" onClick={handleDelete}>
          아니
        </div>{" "}
        <div className="" onClick={handelCheck}>
          aa
        </div>
      </div>
    </div>
  );
};

export default MainPage;
