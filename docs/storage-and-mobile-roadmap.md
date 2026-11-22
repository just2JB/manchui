# 만취 자료 저장과 React Native 앱 배포 계획

작성 기준: 2026-11-21. 상태: 도입 제안 및 실행 계획. 서비스 가입·결제·기능 구현·배포는 아직 진행하지 않았다.

MongoDB는 회원·행사·예약과 파일 메타데이터를 관리하고, 이미지와 문서 원본은 Cloudflare R2 Standard에 저장하는 구성을 권장한다. 먼저 웹 임원진 아카이브에 첨부 기능을 적용한 뒤, 같은 Express API를 사용하는 Expo 기반 React Native 앱을 추가한다. 초기 앱 범위는 로그인, 동아리 방 홈, 예약, 팀 일정, 마이페이지다.

## 현재 코드에서 확인한 출발점

경로는 저장소 루트 기준이다. 실제 클라우드 계약 요금제와 청구서는 별도 확인이 필요하다.

| 영역 | 현재 상태 | 계획에 미치는 영향 |
| --- | --- | --- |
| 웹 | `manchui_web/client/package.json`: React 19, Vite 7, React Router, Axios, TanStack Query | API·순수 계산 로직은 공유 후보지만 DOM·CSS 화면은 네이티브 화면으로 다시 구현 |
| 서버 | `manchui_web/server/index.js`: Express, Mongoose, `/api/archive` 등 등록 | 기존 API에 파일 API와 모바일 인증 경로 추가 |
| 아카이브 | `server/models/ArchiveEvent.js`: 행사와 notices 하위 문서, 첨부 필드 없음 | 행사 및 개별 공지에 파일 ID 연결 |
| 아카이브 권한 | `server/routes/archive.js`: 전체 라우터에 `requireExecutive` 적용 | 첨부 원본과 썸네일도 임원진 전용으로 시작 |
| 웹 인증 | `client/src/api/tokenStorage.js`: localStorage, `apiClient.js`: 토큰 갱신 | 모바일 저장소·갱신 어댑터 필요 |
| 서버 인증 | `server/utils/getToken.js`: access는 쿠키/Bearer, refresh는 쿠키만 수신 | 모바일 refresh 전달·회전·폐기 계약 추가 필요 |
| 기타 자료 | 곡 추천은 외부 링크 미리보기, 조명 화면에는 기기 음악 사용 흐름 존재 | 링크 미리보기나 로컬 음악을 자동으로 클라우드 업로드하지 않음 |

표 안의 `server/`, `client/` 단축 경로는 `manchui_web/` 아래를 가리킨다.

## 자료 저장 서비스 선택

| 선택지 | 적합한 경우 | 이번 판단 |
| --- | --- | --- |
| Cloudflare R2 Standard | 이미지·PDF 등 파일 저장, 다운로드 트래픽 증가 | 1순위. S3 호환 API, 인터넷 전송료 무료, 소규모 무료 구간 |
| AWS S3 | AWS 기반 운영·리전·세부 수명주기 정책이 우선 | 대안. 저장·요청·전송 비용을 함께 산정해야 함 |
| Cloudinary | 자동 이미지 변환과 미디어 관리가 핵심 | 변환 업무가 커지면 재검토. 현재는 별도 서비스 비용·운영 추가를 보류 |
| MongoDB GridFS | DB와 파일을 함께 운영해야 하는 특별한 제약 | 이번 용도에서는 DB 저장·백업 부담을 분리하는 객체 저장소 구성이 적합 |

R2 무료 구간과 요금 근거는 [공식 가격표](https://developers.cloudflare.com/r2/pricing/)를 따른다. R2는 저장소이며 이미지 리사이징·영상 인코딩을 자동 제공하는 것으로 가정하지 않는다. 초기는 서버에서 제한된 크기의 이미지 파생본을 생성하고, 처리량이 늘면 작업 큐와 별도 워커를 분리한다.

구조: 웹/앱 → Express에서 권한 확인 및 업로드 발급 → R2 비공개 저장소에 업로드 → 서버 검증 → MongoDB에 첨부 연결. 다운로드는 Express에서 최신 권한을 확인한 후 짧게 유효한 서명 URL을 발급한다.

### 어디에 적용할지

| 순서 | 사용자 기능 | 기존 수정 위치 | 추가할 데이터 |
| --- | --- | --- | --- |
| 1 | 행사 자료와 공지에 이미지·PDF 첨부 | `client/src/pages/Admin/AdminArchive.jsx`, `ArchiveBody.jsx`, `server/routes/archive.js`, `server/models/ArchiveEvent.js` | 행사 `attachmentIds`, 공지 `attachmentIds`, 선택적 `coverAssetId` |
| 1 | 목록에서 자료 개수·대표 이미지 표시 | `client/src/pages/Admin/ArchiveCatalog.jsx`, archive 목록 직렬화 | `attachmentCount`, 권한 확인 후 제공하는 대표 이미지 |
| 2 | 팀 연습 자료 공유 | `client/src/pages/ClubRoom/Team/TeamDetail.jsx`, `server/routes/team.js`, `server/models/Team.js` | 팀 자료 ID, 팀 구성원 조회 권한 |
| 3 | 프로필 이미지 | `client/src/pages/ClubRoom/Mypage/EditProfile.jsx`, `MypageProfileCard.jsx`, `server/models/User.js`, `server/routes/user.js` | `avatarAssetId`, 본인 수정 권한, 공개 범위 별도 결정 |
| 이후 | 공개 공연 포스터·홍보 이미지 | 공개 페이지와 해당 콘텐츠 API | 공개 승인된 별도 파생본만 공개 저장소로 게시 |

최초 허용 범위 제안은 JPEG/PNG/WebP 이미지 10MB 이하, PDF 20MB 이하, 게시물당 10개다. 서버에서 크기·파일 시그니처를 검증하고 이미지 픽셀 수에도 상한을 둔다. SVG/HTML/실행파일은 허용 목록에서 제외한다. 문서 원본은 다운로드로 제공한다. HEIC 사진은 모바일에서 지원 포맷으로 변환하거나 명확한 안내를 표시한다. 동영상·대용량 음원은 1차 범위에서 제외하고 링크 공유를 유지한다.

### 파일 단위 구현 설계

아래 이름은 신규 파일 제안이며 아직 존재하는 구현이 아니다.

| 위치 | 역할 |
| --- | --- |
| `manchui_web/server/models/Asset.js` | 파일 메타데이터 및 처리 상태 |
| `manchui_web/server/services/storage.js` | R2 S3 클라이언트, 서명 URL, 조회·삭제 어댑터 |
| `manchui_web/server/routes/assets.js` | 발급, 완료 검증, 다운로드, 삭제 API |
| `manchui_web/server/services/assetValidation.js` | 실제 파일 검사·이미지 재인코딩·EXIF 제거·썸네일 |
| `manchui_web/server/scripts/cleanupAssets.js` | 미완료 업로드 및 삭제 대기 파일 재처리 |
| `manchui_web/server/index.js` | `/api/assets` 라우터 등록 |
| `manchui_web/client/src/api/assets.js` | 발급 → 업로드 → 완료 호출 |
| `manchui_web/client/src/components/attachments/` | 파일 선택, 진행률, 실패 재시도, 목록, 삭제 UI |

서버 패키지 후보는 `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `sharp`다. 파일 판별 라이브러리는 현재 CommonJS 서버와의 호환성을 확인해 선택한다. R2 계정·키·버킷은 서버 환경변수로만 설정하며 `VITE_*` 또는 `EXPO_PUBLIC_*`에 비밀 키를 넣지 않는다. 개발/운영 버킷을 분리하고 최소 권한 키를 발급한다.

Asset 필드 제안: `_id`, `provider`, `bucket`, `objectKey`, `originalName`, `mimeType`, `size`, `width`, `height`, `checksum`, `uploadedBy`, `scope`, `targetType`, `targetId`, `noticeId`, `status`, `thumbnailKey`, `createdAt`, `deletedAt`. 상태는 `pending → validating → ready` 및 `failed/deleting/deleted`로 관리한다. 만료되는 서명 URL은 DB에 영구 저장하지 않는다.

1. `POST /api/assets/upload-intents`: 로그인과 대상 행사·공지 수정 권한 확인, 사용량 예약, 서버 생성 UUID 키와 5분 유효 PUT URL 발급. 존재하는 초안 대상에 연결한다.
2. 클라이언트가 R2의 임시 키로 업로드한다. 웹용 R2 CORS는 실제 웹 origin과 필요한 메서드·헤더만 허용한다. 서명 URL 사용 방식은 [R2 공식 문서](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)를 따른다.
3. `POST /api/assets/:id/complete`: 소유자·대상 권한 재확인, HEAD와 실제 내용 검사 후 검증된 최종 키로 복사/재인코딩한다. 임시 PUT URL 재사용이 이미 승인된 파일을 덮어쓰지 못하게 한다. 요청은 멱등 처리한다.
4. 검증 성공한 `ready` 파일만 대상에 연결한다. 임의의 다른 사용자 파일 ID 연결을 차단한다. 요청 Content-Type과 클라이언트의 크기 값만 믿지 않는다. 직접 PUT은 초과 파일 자체의 수신을 완전히 막는 장치가 아니므로 발급 횟수·동시 업로드·총량 제한과 초과 파일 즉시 정리를 함께 둔다.
5. `GET /api/assets/:id/download`: 현재 행사·팀·회원 권한을 확인하고 1~5분 GET URL 발급. 썸네일에도 같은 정책을 적용한다. 발급된 URL은 만료 전까지 전달받은 사람이 사용할 수 있으므로 로그에 남기지 않는다.
6. `DELETE /api/assets/:id`: 관계 해제와 삭제 대기 표시 후 원본·파생본 삭제. R2 실패 시 재시도한다. MongoDB와 R2 간 단일 트랜잭션을 가정하지 않는다.

파일 ID는 원칙적으로 하나의 대상에 귀속시킨다. 공지 합치기는 대상 공지로 ID를 이동하고, 나누기는 사용자가 첨부를 옮길 공지를 선택하도록 한다. 행사 삭제 시 하위 공지 첨부도 정리한다. 기존 기록에는 빈 첨부 배열을 기본값으로 사용해 텍스트 자료를 보존한다. 24시간 이상 미완료 파일 정리, 삭제 재시도, DB 참조와 객체 목록 대조를 예약 작업으로 운영한다. DB 백업과 원본 객체 백업을 함께 복구하는 절차도 준비한다.

완료 기준: 임원진 업로드·보기·삭제, 일반 회원 접근 거부, 위장 확장자·초과 파일 거부, 업로드 중 이탈·재시도, 공지 분리·병합 후 참조 유지, 삭제 실패 재처리, 기존 텍스트 아카이브 회귀 확인. 모바일에서도 동일한 API로 업로드·다운로드가 되어야 한다.

## React Native 전환과 배포

`manchui_mobile/`에 Expo + React Native + TypeScript 프로젝트를 추가하고 기존 웹과 서버를 함께 운영한다. 화면 이동은 Expo Router, 서버 상태는 TanStack Query, 비밀 토큰 저장은 SecureStore를 우선 검토한다. Expo 클라우드 빌드로 Windows에서 iOS 빌드를 요청할 수 있지만, iOS 실기기 테스트는 별도로 필요하고 로컬 Xcode 디버깅에는 Mac이 필요하다. [Expo Build 안내](https://docs.expo.dev/build/introduction/)

| 기존 영역 | 전환 방법 |
| --- | --- |
| `client/src/api/` | API 계약·오류 처리 재사용, 환경변수·토큰 저장·refresh는 플랫폼 어댑터 분리 |
| 날짜·예약·팀 계산 유틸 | window/document/localStorage 의존성을 제거한 순수 함수부터 `packages/shared/`로 추출 |
| JSX·CSS·React Router | RN View/Text/Pressable, 네이티브 스타일, Expo Router로 재구현 |
| DOM 기반 차트·애니메이션·WebGL | MVP에서 제외하거나 필요한 화면만 네이티브 대체 검토 |
| 파일 선택 | 웹 input 대신 이미지/문서 picker, 업로드 계약은 공통 |
| 포커스 갱신 | 브라우저 visibility 이벤트 대신 AppState 및 화면 focus로 갱신 |

첫 출시는 로그인·홈·예약 생성/취소·팀 일정 조회·마이페이지에 집중한다. 2차로 투표·곡 추천·팀 자료 공유를 추가한다. 임원진 아카이브 편집과 조명 편집은 웹에서 유지하고 모바일 필요성이 확인된 화면부터 확장한다. 기존 전체 웹을 RN으로 한 번에 옮기는 일정으로 산정하지 않는다.

### 인증을 먼저 해결할 것

- `server/routes/user.js`, `utils/getToken.js`, `utils/tokens.js`, `models/RefreshToken.js`를 대상으로 모바일 세션 계약을 추가한다. 웹 쿠키 경로를 보존하면서 모바일 전용 로그인/refresh 경로는 토큰을 JSON으로 주고받도록 설계한다. 단순 클라이언트 플래그만으로 기존 웹 refresh 비밀을 노출하지 않는다.
- access token은 메모리 중심, refresh token은 SecureStore에 저장한다. 세션별 해시 저장, 회전, 동시 갱신 단일화, 로그아웃·탈퇴 시 폐기를 검증한다. 앱 재설치·토큰 만료 시 재로그인 흐름을 둔다.
- `server/routes/kakaoAuth.js`와 웹 `KakaoAuthCallback.jsx`의 브라우저 redirect를 그대로 복사하지 않는다. 시스템 브라우저 로그인 후 검증된 app/universal link로 짧은 일회용 교환 코드만 반환하고 서버에서 토큰으로 교환한다. state, 허용 redirect, 코드 만료·재사용 방지 및 PKCE 적용 가능 경로를 검토한다. 실제 카카오 콘솔의 플랫폼·redirect 등록과 개발 빌드 실기기 검증이 선행되어야 한다.
- iOS에 카카오 소셜 로그인을 제공할 때 Apple의 동등한 로그인 옵션 요구와 예외 적용 여부를 확인하고, 해당하면 Sign in with Apple을 포함한다. 회원가입을 제공하므로 앱 내 계정 삭제도 출시 범위에 둔다. [Apple 심사 지침 4.8 및 5.1.1](https://developer.apple.com/app-store/review/guidelines/)

### 출시 순서와 완료 기준

1. Expo 개발 빌드와 staging API 연결. `development`, `preview`, `production` 빌드 프로필 및 dev/prod 앱 식별자를 분리한다. Expo Go만으로 네이티브 로그인·파일·권한 검증이 완료됐다고 판단하지 않는다.
2. Android 실기기에서 로그인·갱신·예약·첨부 실패 복구 확인. iOS 실기기에서도 같은 흐름 및 사진 접근 권한, 딥링크, 백그라운드 복귀를 확인한다.
3. 동아리 운영 계정과 계정 인계 담당자를 정하고 Apple Developer/Play Console 등록. 서명키, EAS 프로젝트 소유권, 복구 수단을 개인 졸업 후에도 인계 가능하게 관리한다.
4. Android 내부/비공개 테스트와 iOS TestFlight. 2023-11-13 이후 생성한 Google Play 개인 계정은 프로덕션 접근 신청 전에 최소 12명의 테스터가 연속 14일 참여해야 한다. 조건 충족 후 별도 심사가 있으므로 승인 날짜를 확정하지 않는다. [Google 공식 테스트 요건](https://support.google.com/googleplay/android-developer/answer/14151465)
5. 개인정보처리방침 URL, 지원 연락처, 데이터 수집 공개, 계정 삭제 경로, 스토어 스크린샷, 심사용 계정을 준비한다. 외부 가입이 제한된 동아리 앱도 심사자가 핵심 기능을 확인할 수 있어야 한다.
6. EAS Build로 Android AAB/iOS 빌드를 생성하고 EAS Submit으로 업로드한 후 스토어 심사를 진행한다. 서버 API는 이전 앱 버전과 호환되게 유지한다. OTA 업데이트는 네이티브 모듈 변경을 대체하지 않으며 런타임 호환성과 스토어 정책 범위 안에서 사용한다.

## 예상 비용

달러 요금은 2026-11-21 공식 페이지 확인 기준이다. 원화는 **예산 계산용 가정인 1달러 = 1,400원**을 사용하며 실시간 환율이 아니다. 세금·환전 수수료·지역별 결제가는 별도다. 개발 인건비, 장비, 기존 웹·MongoDB·이메일·도메인 비용은 아래 추가 비용과 구분한다.

### 자료 저장 비용

R2 Standard는 월 10GB-month, Class A 100만 회, Class B 1,000만 회 무료이고 초과 저장은 $0.015/GB-month, A 요청은 $4.50/100만 회, B 요청은 $0.36/100만 회다. 인터넷 전송료는 무료다. 요청 과금 단위 반올림은 제공자 규칙을 따른다. [R2 공식 요금](https://developers.cloudflare.com/r2/pricing/)

| 시나리오 | 월평균 보관량 가정 | 월 A/B 요청 가정 | R2 월 예상 |
| --- | --- | --- | --- |
| 초기 | 원본·파생본 합계 5GB | 1만 / 10만 | $0 |
| 자료 축적 | 합계 50GB | 10만 / 100만 | $0.60, 약 840원 |
| 확대 | 합계 200GB | 50만 / 500만 | $2.85, 약 3,990원 |

보관량은 해당 달 업로드량이 아니라 누적 파일의 월평균 용량이다. 예를 들어 평균 2MB 사진 2,000장이면 원본만 약 4GB다. 원본·썸네일·검증 중 임시 객체·백업을 합산한다. 무료 구간은 계정의 다른 사용량과 공유될 수 있다. 이미지 처리 서버·백업·모니터링·Workers 사용료는 위 R2 값에 포함하지 않았다. 초기는 저장 관련 운영 준비금 월 5,000~10,000원을 잡고 실제 사용량에 맞춰 조정한다.

### 앱 빌드와 스토어 비용

| 항목 | 공식 요금 | 원화 가정 | 결제 시점 |
| --- | --- | --- | --- |
| Apple Developer | $99/년 | 약 138,600원/년 | iOS 배포, 매년 갱신 |
| Google Play 등록 | $25 1회 | 약 35,000원 | Android 스토어 계정 등록 |
| Expo Free | $0 | 0원 | 월 Android 15회 + iOS 15회 빌드, 낮은 우선순위 |
| Expo Starter 선택 | $19/월 + 초과 사용 | 약 26,600원/월 + 초과 | 빌드 빈도·대기 시간이 필요할 때 |

Starter에는 $45 빌드 크레딧이 포함되며 무제한 빌드가 아니다. EAS Update 무료 범위는 1,000 MAU이므로 사용자 수·전송량 한도를 출시 때 다시 확인한다. [Expo 가격](https://expo.dev/pricing/), [Apple 등록비](https://developer.apple.com/programs/enroll/), [Google 등록비](https://support.google.com/googleplay/android-developer/answer/6112435)

### 첫해 추가 예산과 운영 준비금

공통 가정: 양대 스토어 출시, 기존 백엔드·DB 용량으로 운영 가능, R2 월평균 50GB가 12개월 유지, 요청은 무료 구간 이내, 추가 유료 변환 서비스 없음.

| 운영안 | 첫해 추가 서비스 비용 계산 | 세금 전 합계 |
| --- | --- | --- |
| 절약형 | Apple $99 + Google $25 + R2 $0.60 × 12 + Expo Free | $131.20, 약 183,680원 |
| 출시 집중형 | 절약형 + Expo Starter 2개월 $38 | $169.20, 약 236,880원 |
| 연중 유료 빌드 | 절약형 + Expo Starter 12개월 $228 | $359.20, 약 502,880원 |

출시 집중형에 여유분을 붙여 **첫해 추가 예산 30만원**을 우선 확보하는 것을 제안한다. Android만 먼저 출시하면 첫해 계산에서 Apple 약 138,600원을 뺄 수 있다. 이후에도 iOS를 유지하면 Apple 연회비가 반복되고 Google 등록비는 반복되지 않는다.

서버·DB 증설까지 고려한 **전체 운영 준비금은 월 3만~7만원, 연 36만~84만원**을 별도로 가정한다. 이는 확인된 서비스 견적이 아니라 백엔드 상시 가동·DB·메일·도메인·백업·저장소를 포괄하는 예산 상한 후보이며, 기존 청구액을 먼저 대입해야 한다. 이 준비금에 R2가 포함되므로 추가 예산 표의 R2를 다시 더하지 않는다.

따라서 전체 준비금과 스토어·출시 2개월 빌드를 합친 첫해 현금 확보 범위는 약 **59만~107만원**이다: 36만~84만원 + Apple 138,600원 + Google 35,000원 + Expo 53,200원. 기존 운영비가 이미 확보돼 있다면 신규 요청 예산은 위 추가 예산 30만원을 기준으로 삼는다. 테스트용 휴대폰·Mac 구매 및 외주비는 포함하지 않는다.

### 개발 일정과 인력 가정

1명이 기존 코드를 아는 상태에서 집중 개발하는 경우의 추정이며 외주 견적이 아니다.

| 단계 | 예상 공수 | 산출물 |
| --- | --- | --- |
| 파일 저장·아카이브 연동 | 1~2주 | 권한·검증·정리 작업을 포함한 웹 첨부 기능 |
| 모바일 기반·인증 | 1~2주 | Expo 개발 빌드, refresh·카카오 로그인 |
| 핵심 화면 전환 | 3~5주 | 홈·예약·팀 일정·프로필 및 필요한 첨부 UI |
| 실기기 QA·출시 준비 | 1~2주 | 회귀 검증, 개인정보·계정 삭제·스토어 자료 |

합계 6~11 인주에 스토어 테스트·심사 대기 여유를 추가한다. Google 비공개 테스트 14일은 QA와 일부 병행할 수 있다. 시간제 작업이면 달력상 일정은 더 길어진다. 기획 추가·Apple 로그인·기존 버그 수정 규모에 따라 재산정한다. 외주 인건비는 `6~11 인주 × 합의된 주당 단가`로 별도 견적을 받고, 셀프 개발도 이 시간을 비용으로 본다.

## 실제 착수 순서

- [ ] 현재 서버·MongoDB·웹 호스팅·도메인·메일 청구액과 저장 여유 확인
- [ ] R2 개발/운영 비공개 버킷, 최소 권한 키, CORS, 사용량 알림 설정
- [ ] Asset 모델 및 업로드 발급·검증·다운로드·삭제·정리 작업 구현
- [ ] 아카이브 행사·공지 첨부 UI와 분리·병합 처리 연결
- [ ] 권한·파일 위장·중단 복구·원본/DB 복구 검증 후 웹 배포
- [ ] Expo 프로젝트 추가 및 모바일 인증을 실제 기기에서 먼저 검증
- [ ] 핵심 화면 이식과 Android/iOS 베타 테스트
- [ ] 계정 인계, 스토어 정책·가격 재확인, 심사 제출 후 단계적 출시

다음 구현의 첫 작업 단위는 **아카이브에 이미지와 PDF를 첨부하는 기능**이다. 이를 완료하면 웹과 앱이 공유할 저장·권한 API가 마련되어 모바일 기능을 중복 구현하지 않아도 된다.
