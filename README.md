# 📸 오늘의 여행 사진 한 컷 & 한 줄 감상

공공데이터포털의 관광사진 API를 통해 여행지 사진을 불러오고, 마음에 드는 사진에 한 줄 감상을 작성해 Firebase Firestore에 저장 및 실시간 조회하는 웹 애플리케이션입니다.



## ✨ 주요 기능
1. **여행지 사진 5선 조회 및 새로고침**
   - 한국관광공사 관광사진 정보 API에서 사진과 제목 5개를 불러옵니다.
   - `다른 사진 불러오기` 버튼을 누르면 랜덤 페이지(`pageNo`)를 호출해 새로운 여행 사진 5장을 보여줍니다.
2. **사진 선택 및 한 줄 감상 저장 (Create)**
   - 마음에 드는 사진 1장을 클릭하면 하단 입력창이 활성화됩니다.
   - 감상을 입력하고 저장하면 Firebase Firestore의 `reviews` 컬렉션에 사진 정보와 함께 저장됩니다.
3. **저장된 여행 감상 실시간 조회 (Read)**
   - Firestore에 저장된 감상 목록을 최신순(`createdAt` 내림차순)으로 불러와 화면 하단에 실시간으로 출력합니다.

## 🛠 사용 기술 및 API
- **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
- **Database:** Firebase Firestore
- **Open API:** 공공데이터포털 — 한국관광공사_관광사진 정보_GW (`galleryList1`)
- **Deployment:** GitHub Pages

## 📂 파일 구조
```text
├── index.html   # 메인 화면 구조 (사진 목록, 감상 입력창, 조회 영역)
├── style.css    # 카드 그리드 및 전체 레이아웃 스타일
├── app.js       # 공공 API 호출 및 Firebase Firestore 연동 로직
└── README.md    # 프로젝트 설명 문서
