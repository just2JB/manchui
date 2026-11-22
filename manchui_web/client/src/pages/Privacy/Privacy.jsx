import React, { useEffect } from "react";
import LegalDocument from "../../components/LegalDocument/LegalDocument";
import { useAppSettings } from "../../context/AppSettingsContext";

const CONTACT_EMAIL = "jb040222@naver.com";

/** 개인정보 처리방침 — 실제로 저장하는 정보 기준으로 작성 */
const Privacy = () => {
  const { joinConfig, ensureJoinConfigLoaded } = useAppSettings();
  useEffect(() => {
    void ensureJoinConfigLoaded();
  }, [ensureJoinConfigLoaded]);

  const president = joinConfig?.president ?? {};
  const officer = president.name
    ? `${president.name} (만취 회장${president.contact ? ` · ${president.contact}` : ""})`
    : "만취 회장 (동아리 운영진)";

  const sections = [
    {
      id: "purpose",
      title: "누가, 왜 개인정보를 처리하나요",
      blocks: [
        {
          type: "p",
          text: "한양대학교 ERICA 종합예술 댄스 동아리 MANCHUI(만취, 이하 '동아리')는 동아리 지원 접수와 동아리방·팀 연습 운영을 위해 꼭 필요한 개인정보만 처리합니다.",
        },
        {
          type: "list",
          items: [
            "동아리 지원서 접수, 선발, 합격 안내",
            "부원 계정 로그인과 본인 확인",
            "동아리방 예약, 팀·연습 일정 관리, 연습실 예약",
            "곡 추천, 공연 조명 큐시트 등 동아리 활동 기능 제공",
          ],
        },
      ],
    },
    {
      id: "items",
      title: "어떤 정보를 받고, 얼마나 보관하나요",
      blocks: [
        {
          type: "table",
          columns: ["구분", "받는 정보", "보관 기간"],
          rows: [
            [
              "동아리 지원",
              "이름, 학적 상태, 학년, 학번, 단과대학, 학과, 연락처, 지원 동기(선택)",
              "해당 기수 모집·선발이 끝나면 파기",
            ],
            [
              "부원 계정",
              "이름, 이메일, 비밀번호(암호화), 동아리방 아이디, 직책",
              "탈퇴할 때까지",
            ],
            [
              "카카오 로그인",
              "카카오 회원번호, 닉네임, 카카오 계정 이메일",
              "탈퇴하거나 카카오 연결을 끊을 때까지",
            ],
            [
              "활동 기록",
              "가능한 시간(개인 일정), 팀 소속·연습 참석, 곡 추천·좋아요·스크랩, 조명 큐시트",
              "탈퇴하거나 팀·글이 삭제될 때까지 (연습실 사용 기록은 결산을 위해 팀 이름·날짜·시간·연습실만 남겨요)",
            ],
            [
              "동아리방 예약",
              "예약 날짜·시간, 팀 이름, 인원",
              "이용 시간이 끝나고 6개월 뒤 자동 삭제",
            ],
            [
              "일정 종합 (비회원 응답)",
              "응답자 이름, 비밀번호(암호화), 가능한 시간",
              "해당 일정 종합이 삭제될 때까지",
            ],
          ],
        },
        {
          type: "note",
          text: "법령에 따라 보관해야 하는 정보가 있으면 그 기간 동안만 따로 보관합니다.",
        },
      ],
    },
    {
      id: "auto",
      title: "자동으로 저장되는 정보",
      blocks: [
        {
          type: "p",
          text: "광고나 방문 분석 도구는 쓰지 않습니다. 서비스를 쓰는 데 필요한 정보만 브라우저에 저장합니다.",
        },
        {
          type: "list",
          items: [
            { label: "로그인 쿠키", text: "로그인 상태 유지용 (짧게는 15분, 길게는 30일 뒤 만료)" },
            { label: "브라우저 저장소", text: "로그인 정보, 화면 테마(다크·라이트), 마지막에 입력한 예약 팀 이름, 언어 설정" },
          ],
        },
        {
          type: "p",
          text: "브라우저 설정에서 쿠키와 저장소를 지울 수 있습니다. 지우면 다시 로그인해야 합니다.",
        },
      ],
    },
    {
      id: "share",
      title: "공유 링크로 보이는 정보",
      blocks: [
        {
          type: "p",
          text: "부원이 공유 링크를 만들어 보내면, 링크를 받은 사람은 로그인 없이 아래 정보만 볼 수 있습니다.",
        },
        {
          type: "list",
          items: [
            { label: "동아리방 예약 공유", text: "예약 날짜·시간, 팀 이름, 인원" },
            { label: "팀 연습 일정 공유", text: "팀 이름, 연습 날짜·시간·장소 (참석한 사람의 이름은 보이지 않습니다)" },
            { label: "일정 종합 링크", text: "응답한 사람의 이름과 가능한 시간" },
          ],
        },
      ],
    },
    {
      id: "third",
      title: "다른 곳에 주거나 맡기는 경우",
      blocks: [
        {
          type: "p",
          text: "동아리는 개인정보를 다른 사람이나 단체에 팔거나 넘기지 않습니다. 서비스를 운영하기 위해 아래 서비스를 이용합니다.",
        },
        {
          type: "list",
          items: [
            { label: "카카오", text: "카카오 로그인을 고른 경우 로그인 확인" },
            { label: "이메일 발송 서비스", text: "이메일 인증 메일 발송" },
            { label: "웹 호스팅·데이터베이스 서비스", text: "웹사이트 운영과 정보 저장" },
          ],
        },
      ],
    },
    {
      id: "rights",
      title: "내 정보, 이렇게 관리할 수 있어요",
      blocks: [
        {
          type: "list",
          items: [
            { label: "보기·고치기", text: "동아리방 › 마이페이지에서 이름, 아이디, 비밀번호를 바꿀 수 있습니다." },
            { label: "탈퇴", text: "마이페이지에서 탈퇴하면 계정 정보가 삭제됩니다." },
            { label: "그 밖의 요청", text: "열람·정정·삭제·처리정지를 원하면 아래 연락처로 요청해 주세요. 지체 없이 처리하겠습니다." },
          ],
        },
      ],
    },
    {
      id: "destroy",
      title: "정보를 지우는 방법",
      blocks: [
        {
          type: "p",
          text: "보관 기간이 끝나거나 목적을 이룬 정보는 바로 지웁니다. 전자 파일은 되살릴 수 없게 삭제하고, 종이 문서는 분쇄하거나 태웁니다.",
        },
      ],
    },
    {
      id: "safety",
      title: "정보를 지키기 위해 하는 일",
      blocks: [
        {
          type: "list",
          items: [
            "비밀번호는 원래 값을 알 수 없게 암호화해서 저장합니다.",
            "관리 화면은 임원진 계정만 들어갈 수 있습니다.",
            "모든 통신은 암호화된 연결(HTTPS)로 주고받습니다.",
          ],
        },
      ],
    },
    {
      id: "contact",
      title: "책임자와 문의",
      blocks: [
        {
          type: "list",
          items: [
            { label: "개인정보 보호 책임자", text: officer },
            { label: "문의 메일", text: CONTACT_EMAIL },
          ],
        },
        {
          type: "p",
          text: "개인정보 침해에 대한 상담은 개인정보침해신고센터(국번 없이 118, privacy.kisa.or.kr)에서도 받을 수 있습니다.",
        },
      ],
    },
    {
      id: "change",
      title: "방침이 바뀌면",
      blocks: [
        {
          type: "p",
          text: "법령이나 서비스가 바뀌어 방침을 고치면, 시행 7일 전에 웹사이트에 알립니다. 중요한 내용이 바뀌면 30일 전에 알립니다.",
        },
      ],
    },
  ];

  return (
    <LegalDocument
      title="개인정보 처리방침"
      effectiveDate="2026년 11월 23일"
      previousDate="2025년 1월 1일"
      intro="만취 웹사이트와 동아리방 서비스에서 어떤 정보를 받고, 어디에 쓰고, 언제 지우는지 알려 드립니다."
      summary={[
        { title: "꼭 필요한 것만", text: "지원 접수와 동아리방·연습 운영에 필요한 정보만 받아요." },
        { title: "팔거나 넘기지 않아요", text: "광고·분석 도구 없이, 동아리 운영에만 써요." },
        { title: "예약 기록은 6개월만", text: "동아리방 예약 기록은 이용 후 6개월이 지나면 자동 삭제돼요." },
        { title: "언제든 탈퇴", text: "마이페이지에서 정보를 고치거나 탈퇴할 수 있어요." },
      ]}
      sections={sections}
      otherDoc={{ to: "/terms", label: "이용약관" }}
    />
  );
};

export default Privacy;
