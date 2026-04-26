// app.js — Public site (Firebase Realtime Database)
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

const fbApp = initializeApp(firebaseConfig);
getAnalytics(fbApp);
const db = getDatabase(fbApp);

// Sticky Nav
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 50));

// Load data
const dataRef = ref(db, 'siteData');
onValue(dataRef, (snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.val();
    renderVibe(data.vibe);
    renderLocation(data.location);
    renderDeals(data.deals);
    renderMenu(data.menu);
    applyOrder(data.sectionOrder);
  } else {
    fetch('site-data.json').then(r => r.json()).then(data => {
      set(dataRef, data);
      renderVibe(data.vibe);
      renderLocation(data.location);
      renderDeals(data.deals);
      renderMenu(data.menu);
      applyOrder(data.sectionOrder);
    });
  }
}, { onlyOnce: true });

// --- Section Ordering ---
function applyOrder(order) {
  if (!order) return;
  const wrapper = document.getElementById('sections-wrapper');
  if (!wrapper) return;
  const arr = Array.isArray(order) ? order : Object.values(order);
  arr.forEach(id => {
    const el = document.getElementById(id);
    if (el) wrapper.appendChild(el); // moves to end in order
  });
}

// --- Vibe Section ---
function renderVibe(vibe) {
  if (!vibe) return;
  // Merged Hero+Vibe — single set of IDs
  setEl('vibe-heading', vibe.heading);
  setEl('vibe-tagline', vibe.subheading);
  setEl('vibe-body',    vibe.body);
  // Polaroids
  renderPolaroids('vibe-photos-left',  toArr(vibe.leftPhotos));
  renderPolaroids('vibe-photos-right', toArr(vibe.rightPhotos));
  initScrollObserver();
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el && text !== undefined) el.textContent = text;
}

function toArr(v) { return Array.isArray(v) ? v : v ? Object.values(v) : []; }

function renderPolaroids(containerId, photos) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  photos.forEach(p => {
    const d = document.createElement('div');
    d.className = 'polaroid';
    d.innerHTML = `<img src="${p.url}" alt="${p.caption}" loading="lazy"><div class="polaroid-caption">${p.caption}</div>`;
    c.appendChild(d);
  });
}

function initScrollObserver() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), e.target.dataset.delay || 0);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.polaroid').forEach((el, i) => {
    el.dataset.delay = i * 150;
    obs.observe(el);
  });
}

// --- Location ---
function renderLocation(loc) {
  const el = document.getElementById('tracker-content');
  if (!loc || !el) return;
  if (!loc.isOpen) {
    el.innerHTML = `<h3>סגורים היום</h3><p>עקבו אחרינו באינסטגרם לעדכון מיקום!</p>`;
    return;
  }
  el.innerHTML = `
    <h3>אנחנו כאן!</h3>
    <div class="tracker-status">📍 ${loc.name}</div>
    <div class="tracker-hours">🕐 ${loc.hours}</div>
    ${loc.mapEmbedUrl ? `<div class="map-container"><iframe src="${loc.mapEmbedUrl}" allowfullscreen loading="lazy"></iframe></div>` : ''}
    <a href="${loc.directionsUrl}" target="_blank" class="btn btn--cta">נווט אלינו</a>`;
}

// --- Menu ---
function renderMenu(menuItems) {
  const grid = document.getElementById('menu-grid');
  if (!grid) return;
  const items = toArr(menuItems);
  if (!items.length) { grid.innerHTML = '<p class="loading-text">התפריט יעלה בקרוב!</p>'; return; }
  grid.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = `menu-card${item.soldOut ? ' sold-out' : ''}`;
    card.innerHTML = `
      <img src="${item.image || 'assets/burger.png'}" alt="${item.name}" class="menu-image" loading="lazy">
      <div class="menu-content"><h3>${item.name}</h3><p>${item.description}</p><div class="menu-price">₪${item.price}</div></div>`;
    grid.appendChild(card);
  });
}

// --- Deals ---
function renderDeals(deals) {
  const grid = document.getElementById('deals-grid');
  if (!grid) return;
  const items = toArr(deals);
  if (!items.length) { grid.innerHTML = '<p class="loading-text" style="color:var(--cream-base)">אין עסקיות כרגע</p>'; return; }
  grid.innerHTML = '';
  items.forEach(deal => {
    const includes = toArr(deal.includes).map(t => `<span class="deal-tag">✓ ${t}</span>`).join('');
    const card = document.createElement('div');
    card.className = 'deal-card';
    card.innerHTML = `
      <img src="${deal.image || 'assets/burger.png'}" alt="${deal.name}" class="deal-image" loading="lazy">
      <div class="deal-content">
        <h3>${deal.name}</h3>
        <p class="deal-desc">${deal.description}</p>
        <div class="deal-includes">${includes}</div>
        <div class="deal-footer"><div class="deal-price">₪${deal.price}</div><div class="deal-saving">🔥 עסקה משתלמת</div></div>
      </div>`;
    grid.appendChild(card);
  });
}
