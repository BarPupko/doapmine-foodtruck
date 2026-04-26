// app.js — Public site script (Firebase Realtime Database)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBLA3a9yczrR27eK16Ri5gIxN7WMWzF2Zg",
  authDomain: "dopamine-86b22.firebaseapp.com",
  databaseURL: "https://dopamine-86b22-default-rtdb.firebaseio.com",
  projectId: "dopamine-86b22",
  storageBucket: "dopamine-86b22.firebasestorage.app",
  messagingSenderId: "412700112120",
  appId: "1:412700112120:web:004bb894680fbad8d7f70d",
  measurementId: "G-ZX6FXNMQNR"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// ---- Sticky Nav ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ---- Load data from Firebase, fallback to site-data.json ----
const dataRef = ref(db, 'siteData');
onValue(dataRef, (snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.val();
    renderLocation(data.location);
    renderMenu(data.menu);
  } else {
    // First visit: seed from JSON
    fetch('site-data.json')
      .then(r => r.json())
      .then(data => {
        set(dataRef, data);       // write to Firebase for future loads
        renderLocation(data.location);
        renderMenu(data.menu);
      });
  }
}, { onlyOnce: true });

// ---- Render Functions ----
function renderLocation(loc) {
  const el = document.getElementById('tracker-content');
  if (!loc) return;

  if (!loc.isOpen) {
    el.innerHTML = `
      <h3>סגורים היום</h3>
      <p>נחזור מחר — עקבו אחרינו באינסטגרם לעדכון מיקום!</p>`;
    return;
  }

  el.innerHTML = `
    <h3>אנחנו כאן!</h3>
    <div class="tracker-status">📍 ${loc.name}</div>
    <div class="tracker-hours">🕐 ${loc.hours}</div>
    ${loc.mapEmbedUrl ? `<div class="map-container"><iframe src="${loc.mapEmbedUrl}" allowfullscreen loading="lazy"></iframe></div>` : ''}
    <a href="${loc.directionsUrl}" target="_blank" class="btn btn--cta">נווט אלינו</a>`;
}

function renderMenu(menuItems) {
  const grid = document.getElementById('menu-grid');
  if (!menuItems || !menuItems.length) {
    grid.innerHTML = '<p class="loading-text">התפריט יעלה בקרוב!</p>';
    return;
  }
  grid.innerHTML = '';

  // Support both array and Firebase object-key format
  const items = Array.isArray(menuItems) ? menuItems : Object.values(menuItems);

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = `menu-card${item.soldOut ? ' sold-out' : ''}`;
    const img = item.image || 'assets/burger.png';
    card.innerHTML = `
      <img src="${img}" alt="${item.name}" class="menu-image" loading="lazy">
      <div class="menu-content">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="menu-price">₪${item.price}</div>
      </div>`;
    grid.appendChild(card);
  });
}
