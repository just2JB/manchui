/** 동아리방 위치 (Footer·예약 공유 등 공통) */
export const CLUB_ROOM_PLACE_NAME = "만취 동아리방";

export const CLUB_ROOM_ADDRESS =
  "경기도 안산시 상록구 한양대학로55 한양대학교 ERICA캠퍼스 학생복지관 422호";

/** 한양대 ERICA 학생복지관(102) 대략 좌표 */
export const CLUB_ROOM_COORDS = { lat: 37.2974, lng: 126.8358 };

/** 카카오맵 지도 퍼가기 (map.kakao.com 약도 만들기) */
export const CLUB_ROOM_KAKAO_ROUGHMAP = {
  timestamp: "1780948562049",
  key: "p7u6qr89ndq",
};

/** 카카오맵 공유 링크 */
export const CLUB_ROOM_KAKAO_MAP_URL =
  "https://map.kakao.com/?urlX=463290.99999999825&urlY=1055303.0000000016&itemId=17564653&q=%ED%95%9C%EC%96%91%EB%8C%80%ED%95%99%EA%B5%90%20ERICA%EC%BA%A0%ED%8D%BC%EC%8A%A4%20%ED%95%99%EC%83%9D%EB%B3%B5%EC%A7%80%EA%B4%80&srcid=17564653&map_type=TYPE_MAP&from=roughmap";

export function getKakaoMapLinkUrl() {
  return CLUB_ROOM_KAKAO_MAP_URL;
}

/** 네이버 지도 공유 링크 */
export const CLUB_ROOM_NAVER_MAP_URL = "https://naver.me/FeXjZARQ";

export function getNaverMapLinkUrl() {
  return CLUB_ROOM_NAVER_MAP_URL;
}
