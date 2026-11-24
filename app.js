const SERVICE_KEY = "bd21b12db0e288c3985b09ce34dad04c43e57ea2693be743697926278f106d4d";

// 현재 사용자가 클릭해 선택한 사진 정보를 담는 변수
let selectedPhoto = null;

// 1. 사진 불러오기 함수 (페이지 번호를 받아서 호출)
async function loadPhotos(pageNo = 1) {
  const container = document.getElementById("photo-list");
  container.innerHTML = "새로운 여행 사진을 불러오는 중...";

  // 새로 불러올 때마다 기존 선택 초기화
  resetSelection();

  const API_URL = `https://apis.data.go.kr/B551011/PhotoGalleryService1/galleryList1?serviceKey=${SERVICE_KEY}&numOfRows=5&pageNo=${pageNo}&MobileOS=ETC&MobileApp=AppTest&_type=json`;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    const items = data.response.body.items.item;

    container.innerHTML = "";

    items.forEach((item) => {
      const secureImgUrl = item.galWebImageUrl.replace("http://", "https://");

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${secureImgUrl}" alt="${item.galTitle}" />
        <h3>${item.galTitle}</h3>
      `;

      // 카드 클릭 시 해당 사진 선택 처리
      card.addEventListener("click", () => selectPhoto(card, item.galTitle, secureImgUrl));
      container.appendChild(card);
    });
  } catch (error) {
    console.error("API 호출 실패:", error);
    container.innerText = "데이터를 불러오지 못했습니다.";
  }
}

// 2. 사진 선택 처리 함수
function selectPhoto(cardElement, title, imgUrl) {
  // 모든 카드의 선택 표시 제거 후 클릭한 카드만 강조
  document.querySelectorAll(".card").forEach((c) => c.classList.remove("selected"));
  cardElement.classList.add("selected");

  selectedPhoto = { title, imgUrl };

  // 입력창과 저장 버튼 활성화
  document.getElementById("selected-photo-title").innerText = `선택된 사진: [${title}]`;
  document.getElementById("comment-input").disabled = false;
  document.getElementById("save-btn").disabled = false;
  document.getElementById("comment-input").focus();
}

// 3. 선택 상태 초기화 함수
function resetSelection() {
  selectedPhoto = null;
  document.getElementById("selected-photo-title").innerText = "위에서 사진 1장을 먼저 클릭해 주세요.";
  document.getElementById("comment-input").value = "";
  document.getElementById("comment-input").disabled = true;
  document.getElementById("save-btn").disabled = true;
}

// 4. '다른 사진 불러오기' 버튼 클릭 시 1~100 사이의 랜덤 페이지 호출
document.getElementById("refresh-btn").addEventListener("click", () => {
  const randomPage = Math.floor(Math.random() * 100) + 1;
  loadPhotos(randomPage);
});

// 초기 실행 (첫 화면은 1페이지 호출)
loadPhotos(1);
