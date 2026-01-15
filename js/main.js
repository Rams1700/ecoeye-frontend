/* ===============================
   Utility helpers
   =============================== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);

/* ===============================
   DOM ready helper
   =============================== */
function onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

/* ===============================
   GEOLOCATION (FIXED & GLOBAL)
   =============================== */
function getLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  const latInput = byId("lat");
  const lngInput = byId("lng");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (latInput) latInput.value = position.coords.latitude.toFixed(6);
      if (lngInput) lngInput.value = position.coords.longitude.toFixed(6);
      alert("✅ Location detected successfully!");
    },
    (error) => {
      alert("❌ Unable to retrieve location. Please enter manually.");
      console.error("Geolocation error:", error);
    }
  );
}

window.getLocation = getLocation;

/* ===============================
   REPORT FORM (localStorage)
   =============================== */
// (function reportModule() {
//   const STORAGE_KEY = "ecoeye_reports";

//   function getReports() {
//     try {
//       return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
//     } catch {
//       return [];
//     }
//   }

//   function saveReports(list) {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
//   }

//   function escapeHtml(str = "") {
//     return String(str)
//       .replace(/&/g, "&amp;")
//       .replace(/</g, "&lt;")
//       .replace(/>/g, "&gt;")
//       .replace(/"/g, "&quot;")
//       .replace(/'/g, "&#039;");
//   }

//   function renderReports() {
//     const feed = byId("reportsFeed");
//     if (!feed) return;

//     const reports = getReports();
//     if (!reports.length) {
//       feed.innerHTML = "<p>No reports yet 🌱</p>";
//       return;
//     }

//     feed.innerHTML = reports.map(r => `
//       <article class="report-card">
//         ${r.img ? `<img src="${r.img}" alt="Report image">` : ""}
//         <p><strong>${escapeHtml(r.desc)}</strong></p>
//         <small>📍 ${r.lat}, ${r.lng}</small>
//       </article>
//     `).join("");
//   }

//   onReady(() => {
//     const form = byId("reportForm");
//     renderReports();

//     if (!form) return;

//     form.addEventListener("submit", async (e) => {
//       e.preventDefault();

//       const desc = byId("description")?.value || "";
//       const lat = byId("lat")?.value || "N/A";
//       const lng = byId("lng")?.value || "N/A";
//       const imgInput = byId("image");

//       let imgUrl = "";
//       if (imgInput?.files?.[0]) {
//         const file = imgInput.files[0];
//         const reader = new FileReader();
//         imgUrl = await new Promise((res) => {
//           reader.onload = () => res(reader.result);
//           reader.readAsDataURL(file);
//         });
//       }

//       const list = getReports();
//       list.unshift({
//         desc,
//         lat,
//         lng,
//         img: imgUrl,
//         ts: Date.now()
//       });

//       saveReports(list);
//       byId("successPopup").style.display = "flex";
//       form.reset();
//       renderReports();
//     });
//   });
// })();

function closePopup() {
  byId("successPopup").style.display = "none";
}
window.closePopup = closePopup;

/* ===============================
   NAV MENU
   =============================== */
onReady(() => {
  const toggle = $(".menu-toggle");
  const links = $(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });
});

/* ===============================
   BACK TO TOP BUTTON
   =============================== */
onReady(() => {
  if (byId("backToTop")) return;

  const btn = document.createElement("button");
  btn.id = "backToTop";
  btn.textContent = "↑";
  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    btn.style.display = window.scrollY > 400 ? "block" : "none";
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

/* =======================
   CART SYSTEM
   ======================= */
const CART_KEY = "ecoeye_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}
const MAX_QTY_PER_ITEM = 5;


function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    if (existing.quantity >= MAX_QTY_PER_ITEM) {
      alert("⚠️ Out of Order: Maximum 5 units allowed per product");
      return;
    }
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
  alert("✅ Added to cart");
  updateImpactStrip();
}


function updateCartCount() {
  const cartCount = document.getElementById("cartCount");
  if (!cartCount) return;

  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = total;
  updateImpactStrip();

}

/* ===============================
   IMPACT STRIP (NEW)
   =============================== */
function updateImpactStrip() {
  const impactCount = document.getElementById("impactCount");
  const impactCO2 = document.getElementById("impactCO2");

  if (!impactCount || !impactCO2) return;

  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const CO2_PER_ITEM = 2.5; // kg/year
  const totalCO2 = (totalItems * CO2_PER_ITEM).toFixed(1);

  impactCount.textContent = totalItems;
  impactCO2.textContent = totalCO2;
}

/* ===============================
   PAGE LOAD UPDATES
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateImpactStrip();   // ✅ ADDED
});
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      message: document.getElementById("message").value
    };

    const res = await fetch("http://localhost:5000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    alert("Message sent successfully ✅");
    form.reset();
  });
});
document.getElementById("reportForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const imageInput = document.getElementById("image");
  const file = imageInput?.files?.[0];

  if (!file || !file.type.startsWith("image/")) {
    alert("❌ Please upload a valid image file");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("❌ Image size must be under 5MB");
    return;
  }

  // Generate Complaint ID
  const complaintId = "ECO-" + Date.now();

  const reportData = {
    complaintId,
    category: document.getElementById("category").value,
    urgency: document.getElementById("urgency").value,
    description: document.getElementById("description").value,
    latitude: document.getElementById("lat").value || "Not provided",
    longitude: document.getElementById("lng").value || "Not provided",
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch("http://localhost:5000/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportData)
    });

    if (res.ok) {
      document.getElementById("successPopup").style.display = "flex";
      alert(`✅ Report submitted!\nComplaint ID: ${complaintId}`);
      document.getElementById("reportForm").reset();
    } else {
      alert("❌ Failed to submit report");
    }
  } catch (err) {
    alert("❌ Backend not reachable");
    console.error(err);
  }
});

async function sendOrderToBackend(orderData) {
  try {
    const res = await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });

    if (res.ok) {
      // clear cart
      localStorage.removeItem("ecoeye_cart");
      updateCartCount();

      // redirect to success page
      window.location.href = "order-success.html";
    } else {
      alert("❌ Order failed");
    }
  } catch (err) {
    alert("❌ Backend not reachable");
    console.error(err);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const checkoutForm = document.getElementById("checkoutForm");
  if (!checkoutForm) return;

  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // 🔒 Address validation
    const address = document.getElementById("address").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const pincode = document.getElementById("pincode").value.trim();

    if (!address || !city || !state || !pincode) {
      alert("❗ Please fill complete delivery address");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("ecoeye_cart")) || [];

    if (cart.length === 0) {
      alert("🛒 Cart is empty");
      return;
    }

    const orderData = {
      items: cart,
      total: cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
      deliveryAddress: {
        address,
        city,
        state,
        pincode
      }
    };

    sendOrderToBackend(orderData);
  });
});










