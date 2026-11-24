// 1. Firebase 및 Firestore 기능 불러오기 (doc, updateDoc, deleteDoc 추가)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 2. 공공데이터포털 인증키 (Encoding 키 입력)
const SERVICE_KEY = "bd21b12db0e288c3985b09ce34dad04c43e57ea2693be743697926278f106d4d";

// 3. 본인 Firebase 프로젝트 설정 정보
const firebaseConfig = {
  apiKey: "AIzaSyD2DHKV4ZaPxNj6VRtMcH87p2IuvKdijTI",
  authDomain: "picture-6c79f.firebaseapp.com",
  projectId: "picture-6c79f",
  storageBucket: "picture-6c79f.firebasestorage.app",
  messagingSenderId: "621068352095",
  appId: "1:621068352095:web:a2131cb7752d4805afb9ea"
};

// 4. Firebase 및 Firestore 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let selectedPhoto = null;

// ==========================================
// [기능 1] 관광사진 API 불러오기 및 선택
// ==========================================
async function loadPhotos(pageNo = 1) {
  const container = document.getElementById("photo-list");
  container.innerHTML = "새로운 여행 사진을 불러오는 중...";
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
      card.addEventListener("click", () => selectPhoto(card, item.galTitle, secureImgUrl));
      container.appendChild(card);
    });
  } catch (error) {
    console.error("API 호출 실패:", error);
    container.innerText = "데이터를 불러오지 못했습니다.";
  }
}

function selectPhoto(cardElement, title, imgUrl) {
  document.querySelectorAll(".card").forEach((c) => c.classList.remove("selected"));
  cardElement.classList.add("selected");

  selectedPhoto = { title, imgUrl };
  document.getElementById("selected-photo-title").innerText = `선택된 사진: [${title}]`;
  document.getElementById("comment-input").disabled = false;
  document.getElementById("save-btn").disabled = false;
  document.getElementById("comment-input").focus();
}

function resetSelection() {
  selectedPhoto = null;
  document.getElementById("selected-photo-title").innerText = "위에서 사진 1장을 먼저 클릭해 주세요.";
  document.getElementById("comment-input").value = "";
  document.getElementById("comment-input").disabled = true;
  document.getElementById("save-btn").disabled = true;
}

document.getElementById("refresh-btn").addEventListener("click", () => {
  const randomPage = Math.floor(Math.random() * 100) + 1;
  loadPhotos(randomPage);
});

// ==========================================
// [기능 2] Firestore에 감상 저장 (Create)
// ==========================================
document.getElementById("save-btn").addEventListener("click", async () => {
  const commentText = document.getElementById("comment-input").value.trim();
  if (!selectedPhoto || !commentText) {
    alert("사진을 선택하고 한 줄 감상을 입력해 주세요.");
    return;
  }

  try {
    await addDoc(collection(db, "reviews"), {
      photoTitle: selectedPhoto.title,
      photoUrl: selectedPhoto.imgUrl,
      comment: commentText,
      createdAt: serverTimestamp()
    });

    alert("Firestore에 저장되었습니다!");
    resetSelection();
    document.querySelectorAll(".card").forEach((c) => c.classList.remove("selected"));
  } catch (error) {
    console.error("Firestore 저장 실패:", error);
    alert("저장 오류: " + error.message);
  }
});

// ==========================================
// [기능 3] 감상 수정(Update) 및 삭제(Delete) 함수
// ==========================================
async function editReview(docId, oldComment) {
  const newComment = prompt("수정할 한 줄 감상을 입력하세요:", oldComment);
  // 취소를 눌렀거나 빈 칸이면 중단
  if (newComment === null || newComment.trim() === "") return;

  try {
    const reviewRef = doc(db, "reviews", docId);
    await updateDoc(reviewRef, {
      comment: newComment.trim()
    });
  } catch (error) {
    console.error("수정 실패:", error);
    alert("수정 중 오류가 발생했습니다: " + error.message);
  }
}

async function deleteReview(docId) {
  if (!confirm("정말 이 감상을 삭제하시겠습니까?")) return;

  try {
    const reviewRef = doc(db, "reviews", docId);
    await deleteDoc(reviewRef);
  } catch (error) {
    console.error("삭제 실패:", error);
    alert("삭제 중 오류가 발생했습니다: " + error.message);
  }
}

// ==========================================
// [기능 4] Firestore에서 감상 실시간 조회 (Read)
// ==========================================
const reviewList = document.getElementById("review-list");
const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  reviewList.innerHTML = "";
  if (snapshot.empty) {
    reviewList.innerHTML = `<li class="empty-msg">아직 저장된 감상이 없습니다. 첫 감상을 남겨보세요!</li>`;
    return;
  }

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const docId = docSnapshot.id; // 각 문서의 고유 ID

    const li = document.createElement("li");
    li.className = "review-item";
    li.innerHTML = `
      <img src="${data.photoUrl}" alt="${data.photoTitle}" />
      <div class="review-content">
        <div class="review-title">[${data.photoTitle}]</div>
        <div class="review-comment">${data.comment}</div>
      </div>
      <div class="review-actions">
        <button class="btn-sm btn-edit">수정</button>
        <button class="btn-sm btn-delete">삭제</button>
      </div>
    `;

    // 수정·삭제 버튼 클릭 이벤트 연결
    li.querySelector(".btn-edit").addEventListener("click", () => editReview(docId, data.comment));
    li.querySelector(".btn-delete").addEventListener("click", () => deleteReview(docId));

    reviewList.appendChild(li);
  });
});

// 첫 화면 사진 5장 로드
loadPhotos(1);
