import React from "react";
import "./Goods.css";

const Goods = () => {
  return (
    <div className="goods">
      <div className="goodsInner">
        <h1 className="goodsTitle">만취 굿즈</h1>
        <p className="goodsDesc">
          도바, 티셔츠, 모자 등 만취 동아리 공식 굿즈를 만나보세요.
        </p>
        <a
          href="https://marpple.shop/kr/manchui10007"
          target="_blank"
          rel="noopener noreferrer"
          className="goodsLink"
        >
          <span className="goodsLinkLabel">굿즈 쇼핑하기</span>
          <span className="goodsLinkSub">Marpple 스토어에서 보기</span>
        </a>
      </div>
    </div>
  );
};

export default Goods;
