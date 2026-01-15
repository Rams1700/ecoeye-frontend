/* ===============================
   Utility helpers
   =============================== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);

/* ===============================
   BACKEND BASE URL (PRODUCTION)
   =============================== */
const API_BASE_URL = "https://ecoeye-backend.onrender.com";

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
const MAX_QTY_PER_ITEM = 5;

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
   IMPACT STRIP
   =============================== */
function updateImpactStrip() {
  const impactCount = document.getElementById("impactCount");
  const impactCO2 = document.getElementById("impactCO2");
  if (!impactCount || !impactCO2) return;

  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const CO2_PER_ITEM = 2.5;
  impactCount.textContent = totalItems;
  impactCO2.textContent = (totalItems * CO2_PER_ITEM).toFixed(1);
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateImpactStrip();
});

/* ===============================
   CONTACT FORM
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      name: byId("name").value,
      email: byId("email").value,
      message: byId("message").value
    };

    await fetch(`${API_BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    alert("Message sent successfully ✅");
    form.reset();
  });
});

/* ===============================
   REPORT FORM
   =============================== */
document.getElementById("reportForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const complaintId = "ECO-" + Date.now();

  const reportData = {
    complaintId,
    category: byId("category").value,
    urgency: byId("urgency").value,
    description: byId("description").value,
    latitude: byId("lat").value || "Not provided",
    longitude: byId("lng").value || "Not provided",
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  const res = await fetch(`${API_BASE_URL}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reportData)
  });

  if (res.ok) {
    alert(`✅ Report submitted!\nComplaint ID: ${complaintId}`);
    byId("successPopup").style.display = "flex";
    byId("reportForm").reset();
  } else {
    alert("❌ Failed to submit report");
  }
});

/* ===============================
   ORDER SUBMISSION
   =============================== */
async function sendOrderToBackend(orderData) {
  const res = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
  });

  if (res.ok) {
    localStorage.removeItem("ecoeye_cart");
    updateCartCount();
    window.location.href = "order-success.html";
  } else {
    alert("❌ Order failed");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const checkoutForm = document.getElementById("checkoutForm");
  if (!checkoutForm) return;

  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const address = byId("address").value.trim();
    const city = byId("city").value.trim();
    const state = byId("state").value.trim();
    const pincode = byId("pincode").value.trim();

    if (!address || !city || !state || !pincode) {
      alert("❗ Please fill complete delivery address");
      return;
    }

    const cart = getCart();
    if (cart.length === 0) {
      alert("🛒 Cart is empty");
      return;
    }

    sendOrderToBackend({
      items: cart,
      total: cart.reduce((s, i) => s + i.price * i.quantity, 0),
      deliveryAddress: { address, city, state, pincode }
    });
  });
});
