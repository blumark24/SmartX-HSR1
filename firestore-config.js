// 🔹 استيراد مكتبات Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// 🔹 إعداد مشروع Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC5HTAq-LeJn4GObn08REwKdqIeokKmwds",
  authDomain: "smart-hsr.firebaseapp.com",
  projectId: "smart-hsr",
  storageBucket: "smart-hsr.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔹 مفتاح Imgbb (مخصص لك)
const IMGBB_API_KEY = "fa1275ad54913c2eada7b0ea054dae80";

// ======================================================================
// ✅ رفع صورة إلى Imgbb وإرجاع رابطها
// ======================================================================
async function uploadImageToImgbb(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();
  if (!data.success) throw new Error("فشل رفع الصورة إلى Imgbb");
  return data.data.url;
}

// ======================================================================
// ✅ تحديد الموقع الجغرافي (GPS)
// ======================================================================
async function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject("المتصفح لا يدعم تحديد الموقع الجغرافي.");
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err.message)
    );
  });
}

// ======================================================================
// ✅ إضافة ملاحظة جديدة إلى Firestore
// ======================================================================
window.addNewObservation = async function () {
  try {
    const title = prompt("أدخل عنوان الملاحظة:");
    if (!title) return;

    const description = prompt("أدخل وصف الملاحظة:");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*,video/*";
    fileInput.click();

    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      const imageUrl = file ? await uploadImageToImgbb(file) : null;

      const coords = await getLocation().catch(() => null);
      const data = {
        title,
        description: description || "",
        image: imageUrl,
        status: "OPEN",
        createdAt: serverTimestamp(),
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
      };

      await addDoc(collection(db, "observations"), data);
      alert("✅ تمت إضافة الملاحظة بنجاح!");
    };
  } catch (error) {
    alert("❌ حدث خطأ أثناء الإرسال: " + error.message);
  }
};

// ======================================================================
// ✅ تحميل الملاحظات وعرضها بشكل لحظي
// ======================================================================
const listContainer = document.getElementById("observationsList");
const detailTitle = document.getElementById("detailTitle");
const detailDescription = document.getElementById("detailDescription");

onSnapshot(collection(db, "observations"), (snapshot) => {
  listContainer.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = data.title;
    div.onclick = () => {
      detailTitle.textContent = data.title;
      detailDescription.innerHTML = `
        <p>${data.description}</p>
        ${data.image ? `<img src="${data.image}" width="100%" style="border-radius:12px;margin-top:10px;">` : ""}
        <p style="color:#555;margin-top:8px;">📍 ${data.latitude ? `الموقع: ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}` : "الموقع غير محدد"}</p>
      `;
    };
    listContainer.appendChild(div);
  });
});
