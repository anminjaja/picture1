// 1. Firebase SDK 불러오기 (CDN 방식 - Realtime Database 버전)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// 2. 내 설정값 입력 (공공데이터 키만 넣어주세요!)
const SERVICE_KEY = "bd21b12db0e288c3985b09ce34dad04c43e57ea2693be743697926278f106d4d";

const firebaseConfig = {
  apiKey: "AIzaSyD2DHKV4ZaPxNj6VRtMcH87p2IuvKdijTI",
  authDomain: "picture-6c79f.firebaseapp.com",
  databaseURL: "https://picture-6c79f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "picture-6c79f",
  storageBucket: "picture-6c79f.firebasestorage.app",
  messagingSenderId: "621068352095",
  appId: "1:621068352095:web:a2131cb7752d4805afb9ea"
};

// 3. Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

let currentUser = null;     // 현재 로그인한 사용자 정보
let selectedPhoto = null;   // 현재 선택한 사진 정보

// ==========================================
// [기능 A] Firebase Google 로그인 및 상태 감지
// ==========================================
const authBox = document.getElementById("auth-box");

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    authBox.innerHTML = `
      <span style="font-size: 14px; margin-right: 10px;">👤 ${user.email}</span>
      <button id="logout-btn" class="btn btn-secondary">로그아웃</button>
    `;
    document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));
  } else {
    authBox.innerHTML = `<button id="login-btn" class="btn btn-outline">Google 로그인</button>`;
    document.getElementById("login-btn").addEventListener("click", () => {
      signInWithPopup(auth, provider).catch((err) => alert("로그인 실패: " + err.message));
    });
  }
});

// ==========================================
// [기능 B] 공공데이터포털 여행 사진 불러오기
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
// [기능 C] Realtime Database에 한 줄 감상 저장하기
// ==========================================
document.getElementById("save-btn").addEventListener("click", async () => {
  if (!currentUser) {
    alert("감상을 저장하려면 먼저 Google 로그인을 해주세요!");
    return;
  }

  const commentText = document.getElementById("comment-input").value.trim();
  if (!selectedPhoto || !commentText) {
    alert("사진을 선택하고 한 줄 감상을 입력해 주세요.");
    return;
  }

  try {
    // 'reviews' 경로 아래에 고유 키를 생성하여 데이터 저장
    const newReviewRef = push(ref(db, "reviews"));
    await set(newReviewRef, {
      uid: currentUser.uid,
      email: currentUser.email,
      photoTitle: selectedPhoto.title,
      photoUrl: selectedPhoto.imgUrl,
      comment: commentText,
      createdAt: serverTimestamp()
    });

    alert("감상이 저장되었습니다!");
    resetSelection();
    document.querySelectorAll(".card").forEach((c) => c.classList.remove("selected"));
  } catch (error) {
    console.error("저장 실패:", error);
    alert("저장 중 오류가 발생했습니다: " + error.message);
  }
});

// ==========================================
// [기능 D] Realtime Database에서 저장된 감상 실시간 조회
// ==========================================
const reviewList = document.getElementById("review-list");
const reviewsRef = ref(db, "reviews");

onValue(reviewsRef, (snapshot) => {
  reviewList.innerHTML = "";
  if (!snapshot.exists()) {
    reviewList.innerHTML = `<li class="empty-msg">아직 등록된 여행 감상이 없습니다. 첫 감상을 남겨보세요!</li>`;
    return;
  }

  // 최신 글이 맨 위로 오도록 배열에 담은 뒤 뒤집기
  const items = [];
  snapshot.forEach((childSnapshot) => {
    items.push(childSnapshot.val());
  });

  items.reverse().forEach((data) => {
    const li = document.createElement("li");
    li.className = "review-item";
    li.innerHTML = `
      <img src="${data.photoUrl}" alt="${data.photoTitle}" />
      <div class="review-content">
        <div class="review-title">[${data.photoTitle}]</div>
        <div class="review-comment">${data.comment}</div>
        <div class="review-author">작성자: ${data.email}</div>
      </div>
    `;
    reviewList.appendChild(li);
  });
});

// 초기 실행
loadPhotos(1);
