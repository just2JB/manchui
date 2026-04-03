import { Link, useLocation } from "react-router-dom";
import { scrollWindowTopAfterNav } from "../../utils/navScroll";
import "./NotFound.css";

function NotFound() {
  const location = useLocation();
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>페이지를 찾을 수 없습니다.</p>

      <Link to="/" onClick={() => scrollWindowTopAfterNav("/", location)}>
        <button className="home-button">홈으로 돌아가기</button>
      </Link>
    </div>
  );
}

export default NotFound;
