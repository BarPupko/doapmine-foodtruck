// admin.js — Admin dashboard (Firebase Realtime Database)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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
const db  = getDatabase(app);
const dataRef = ref(db, 'siteData');

// ---- Sticky Nav ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

let siteData = { location: {}, menu: [] };

// ---- Status helper ----
function showStatus(msg, type = 'success') {
  const el = document.getElementById('admin-status');
  el.textContent = msg;
  el.className = `admin-status ${type}`;
  setTimeout(() => el.className = 'admin-status', 3000);
}

// ---- Load from Firebase (fallback: JSON) ----
async function loadData() {
  try {
    const snap = await get(dataRef);
    if (snap.exists()) {
      siteData = snap.val();
      // Convert Firebase object keys to array if needed
      if (siteData.menu && !Array.isArray(siteData.menu)) {
        siteData.menu = Object.values(siteData.menu);
      }
    } else {
      const resp = await fetch('site-data.json');
      siteData = await resp.json();
      await set(dataRef, siteData);
    }
    populateForms();
  } catch (err) {
    console.error(err);
    showStatus('שגיאה בטעינת נתונים: ' + err.message, 'error');
  }
}

// ---- Save to Firebase ----
async function saveData() {
  try {
    await set(dataRef, siteData);
    showStatus('נשמר בהצלחה! 🎉');
    populateForms();
  } catch (err) {
    showStatus('שגיאה בשמירה: ' + err.message, 'error');
  }
}

// ---- Populate forms from siteData ----
function populateForms() {
  const loc = siteData.location || {};
  document.getElementById('loc-name').value       = loc.name || '';
  document.getElementById('loc-directions').value = loc.directionsUrl || '';
  document.getElementById('loc-embed').value      = loc.mapEmbedUrl || '';
  document.getElementById('loc-hours').value      = loc.hours || '';
  document.getElementById('loc-open').checked     = !!loc.isOpen;

  renderAdminMenu();
}

// ---- Render admin menu list ----
function renderAdminMenu() {
  const list = document.getElementById('admin-menu-list');
  const items = Array.isArray(siteData.menu) ? siteData.menu : Object.values(siteData.menu || {});

  if (!items.length) {
    list.innerHTML = '<p>אין מנות עדיין.</p>';
    return;
  }

  list.innerHTML = '';
  items.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'admin-menu-item';
    div.innerHTML = `
      <div class="admin-item-info">
        <strong>${item.name}</strong>
        <span>₪${item.price} · ${item.soldOut ? '🔴 אזל' : '🟢 זמין'}</span>
      </div>
      <div class="admin-actions">
        <button class="btn btn-sm btn-warn" data-action="toggle" data-idx="${i}">
          ${item.soldOut ? 'החזר למלאי' : 'סמן כאזל'}
        </button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-idx="${i}">מחק</button>
      </div>`;
    list.appendChild(div);
  });

  // Bind action buttons
  list.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      if (btn.dataset.action === 'delete') {
        if (confirm('למחוק מנה זו?')) deleteDish(idx);
      } else {
        toggleSoldOut(idx);
      }
    });
  });
}

// ---- Location save ----
function saveLocation() {
  siteData.location = {
    name: document.getElementById('loc-name').value,
    directionsUrl: document.getElementById('loc-directions').value,
    mapEmbedUrl: document.getElementById('loc-embed').value,
    hours: document.getElementById('loc-hours').value,
    isOpen: document.getElementById('loc-open').checked
  };
  saveData();
}

// ---- Menu operations ----
function addMenuItem() {
  const name  = document.getElementById('new-item-name').value.trim();
  const price = document.getElementById('new-item-price').value;
  const desc  = document.getElementById('new-item-desc').value.trim();
  const image = document.getElementById('new-item-image').value.trim() || 'assets/burger.png';

  if (!name || !price) { showStatus('שם ומחיר הם שדות חובה', 'error'); return; }

  if (!Array.isArray(siteData.menu)) siteData.menu = [];

  siteData.menu.push({
    id: name.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now(),
    name, description: desc,
    price: Number(price),
    soldOut: false, image
  });

  document.getElementById('new-item-name').value  = '';
  document.getElementById('new-item-price').value = '';
  document.getElementById('new-item-desc').value  = '';
  document.getElementById('new-item-image').value = '';

  saveData();
}

function toggleSoldOut(idx) {
  siteData.menu[idx].soldOut = !siteData.menu[idx].soldOut;
  saveData();
}

function deleteDish(idx) {
  siteData.menu.splice(idx, 1);
  saveData();
}

async function resetToDefault() {
  if (!confirm('לאפס את כל הנתונים לברירת המחדל?')) return;
  const resp = await fetch('site-data.json');
  siteData = await resp.json();
  await saveData();
}

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('save-location-btn').addEventListener('click', saveLocation);
  document.getElementById('add-item-btn').addEventListener('click', addMenuItem);
  document.getElementById('reset-data-btn').addEventListener('click', resetToDefault);
});
