import React from "react";
import { Link } from "react-router-dom";
import "./Privacy.css";

const Privacy = () => {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <h1 className="privacy-title">개인정보 처리방침</h1>
        <p className="privacy-updated">
          시행일: 2025년 1월 1일
        </p>

        <section className="privacy-section">
          <h2>1. 개인정보의 수집 및 이용 목적</h2>
          <p>
            MANCHUI(만취)는 한양대학교 ERICA 캠퍼스 댄스 동아리 운영, 동아리원
            지원 및 관리, 동아리 활동 안내와 소통을 위하여 최소한의 개인정보를
            수집·이용합니다.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. 수집하는 개인정보 항목</h2>
          <ul>
            <li>
              <strong>동아리 지원 시:</strong> 이름, 학적상태, 학년, 학번,
              단과대학, 학과, 연락처(전화번호 또는 이메일), 지원 동기(선택)
            </li>
            <li>
              <strong>동아리방(클럽룸) 이용 시:</strong> 이메일, 비밀번호(암호화
              저장), 동아리원 정보
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            수집된 개인정보는 동아리 지원·가입 처리 및 동아리 운영 목적 달성
            시까지 보유하며, 해당 목적이 종료된 후에는 지체 없이 파기합니다.
            단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안
            보관합니다.
          </p>
        </section>

        <section className="privacy-section">
          <h2>4. 개인정보의 제3자 제공</h2>
          <p>
            MANCHUI는 이용자의 개인정보를 제2조에서 명시한 범위 내에서만
            이용하며, 이용자의 동의 없이 제3자에게 제공하지 않습니다.
          </p>
        </section>

        <section className="privacy-section">
          <h2>5. 개인정보의 파기</h2>
          <p>
            보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 복구·재생이
            불가능한 방법으로 안전하게 파기합니다. 전자적 파일은 복구되지
            않도록 삭제하고, 종이에 출력된 문서는 분쇄 또는 소각합니다.
          </p>
        </section>

        <section className="privacy-section">
          <h2>6. 이용자의 권리</h2>
          <p>
            이용자는 자신의 개인정보에 대해 열람·정정·삭제·처리정지를 요구할
            수 있습니다. 문의는 인스타그램 DM 또는 개발자 연락처(
            <a href="mailto:jb040222@naver.com">jb040222@naver.com</a>)로
            요청하시면 됩니다.
          </p>
        </section>

        <section className="privacy-section">
          <h2>7. 개인정보의 안전성 확보</h2>
          <p>
            개인정보의 안전한 처리를 위해 비밀번호 암호화, 접근 권한 관리,
            접속 기록 보관 등 필요한 기술적·관리적 조치를 시행하고 있습니다.
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. 개인정보 처리방침 변경</h2>
          <p>
            본 방침은 법령·정책 또는 서비스 변경에 따라 수정될 수 있으며,
            변경 시 사이트 내 공지사항 등을 통해 안내합니다.
          </p>
        </section>

        <div className="privacy-back">
          <Link to="/" className="privacy-back-link">
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
