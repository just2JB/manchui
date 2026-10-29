import { IoLogoInstagram } from "react-icons/io5";
import { Link } from "react-router-dom";
import PublicPage from "../../components/PublicPage/PublicPage";
import "./Contact.css";

const INSTAGRAM_URL = "https://www.instagram.com/maaaaaaanchui/";

export default function Contact() {
  return (
    <PublicPage label="LET’S TALK" title="문의하기"
      description="가입부터 활동, 공연까지. 만취에 궁금한 이야기를 들려주세요."
      note="만취의 일상과 새로운 소식도 인스타그램에서 만나보세요.">
      <h2>인스타그램 DM으로 만나요</h2>
      <p>궁금한 내용을 메시지로 남겨주세요.<br />@maaaaaaanchui</p>
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="public-page__action">
        <IoLogoInstagram size={22} aria-hidden="true" />
        인스타그램으로 문의하기 <span className="public-page__action-arrow" aria-hidden="true">↗</span>
      </a>
      <span className="public-page__hint">인스타그램이 새 탭에서 열립니다.</span>
      <div className="contact-help">
        <p>가입 전, 이런 점이 궁금하셨나요?</p>
        <details><summary>춤을 처음 춰도 괜찮나요?</summary><p>네! 처음 시작하는 분도 챌린지와 클래스에서 함께 배우며 참여할 수 있어요.</p></details>
        <details><summary>가입 오디션이 있나요?</summary><p>가입 오디션은 없습니다. 춤에 대한 관심이 있다면 누구나 함께할 수 있어요.</p></details>
        <Link to="/join">가입 안내 보기 <span aria-hidden="true">→</span></Link>
      </div>
    </PublicPage>
  );
}
