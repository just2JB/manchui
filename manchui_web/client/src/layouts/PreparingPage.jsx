import { Link, useLocation } from "react-router-dom";
import { scrollWindowTopAfterNav } from "../utils/navScroll";

const PreparingPage = () => {
  const location = useLocation();
  return (
    <div className="preparingPage">
      <p className="preparingMessage">현재 준비중입니다.</p>
      <Link
        to="/join"
        className="preparingLink"
        onClick={() => scrollWindowTopAfterNav("/join", location)}
      >
        가입하러 가기
      </Link>
    </div>
  );
};

export default PreparingPage;
