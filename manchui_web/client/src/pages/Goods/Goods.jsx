import { Link } from "react-router-dom";
import PublicPage from "../../components/PublicPage/PublicPage";
import "./Goods.css";

export default function Goods() {
  return (
    <PublicPage label="MANCHUI GOODS" title="만취 굿즈"
      description="무대 밖에서도, 일상 속에서도. 만취의 에너지를 함께 입어요."
      note="상품 구성과 판매 여부는 공식 스토어에서 확인해주세요.">
      <div className="goods-brand" aria-hidden="true">
        <img src="/logos/longLogo_white.png" alt="" />
        <span>WEAR THE CREW.</span>
      </div>
      <h2>만취 공식 스토어</h2>
      <p>과잠, 맨투맨, 모자 등 만취의 공식 굿즈를 만나보세요.</p>
      <a href="https://marpple.shop/kr/manchui10007" target="_blank" rel="noopener noreferrer" className="public-page__action">
        굿즈 쇼핑하기 <span className="public-page__action-arrow" aria-hidden="true">↗</span>
      </a>
      <span className="public-page__hint">마플샵이 새 탭에서 열립니다.</span>
      <Link to="/contact" className="public-page__action public-page__action--secondary">굿즈 관련 문의 <span aria-hidden="true">→</span></Link>
    </PublicPage>
  );
}
