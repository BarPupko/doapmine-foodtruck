// admin.js — Full admin dashboard
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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
const db = getDatabase(fbApp);
const dataRef = ref(db, 'siteData');
const eventsRef = ref(db, 'events');

let siteData = { sectionOrder: ['vibe','menu','deals','location'], location: {}, vibe: { leftPhotos: [], rightPhotos: [] }, menu: [], deals: [] };

// ===================== HELPERS =====================
function toArr(v) { return Array.isArray(v) ? v : v ? Object.values(v) : []; }

function showStatus(msg, type = 'success') {
  const el = document.getElementById('admin-status');
  el.textContent = msg;
  el.className = `admin-status ${type}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => el.className = 'admin-status', 4500);
}

async function saveData(msg = 'נשמר בהצלחה! 🎉') {
  try {
    await set(dataRef, siteData);
    showStatus(msg);
    populateForms();
  } catch (err) { showStatus('שגיאה: ' + err.message, 'error'); }
}

// ===================== COLLAPSIBLE PANELS =====================
const PANEL_KEY = 'dopamine_panels';

function setupCollapsible() {
  const stored = JSON.parse(localStorage.getItem(PANEL_KEY) || '{}');
  document.querySelectorAll('.admin-panel[data-panel-id]').forEach(panel => {
    const id = panel.dataset.panelId;
    const btn = panel.querySelector('.panel-toggle-btn');
    const header = panel.querySelector('.panel-header');
    if (!btn) return;

    if (stored[id]) { panel.classList.add('collapsed'); btn.textContent = '+'; }

    const toggle = () => {
      const collapsed = panel.classList.toggle('collapsed');
      btn.textContent = collapsed ? '+' : '−';
      const state = JSON.parse(localStorage.getItem(PANEL_KEY) || '{}');
      state[id] = collapsed;
      localStorage.setItem(PANEL_KEY, JSON.stringify(state));
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    header.addEventListener('click', toggle);
  });
}

// ===================== LOAD / POPULATE =====================
async function loadData() {
  try {
    const snap = await get(dataRef);
    if (snap.exists()) {
      siteData = snap.val();
      siteData.menu   = toArr(siteData.menu);
      siteData.deals  = toArr(siteData.deals);
      if (!siteData.vibe) siteData.vibe = { leftPhotos: [], rightPhotos: [] };
      siteData.vibe.leftPhotos  = toArr(siteData.vibe.leftPhotos);
      siteData.vibe.rightPhotos = toArr(siteData.vibe.rightPhotos);
      if (!Array.isArray(siteData.sectionOrder)) siteData.sectionOrder = ['vibe','menu','deals','location'];
    } else {
      const r = await fetch('site-data.json');
      siteData = await r.json();
      await set(dataRef, siteData);
    }
    populateForms();
  } catch (err) { showStatus('שגיאה בטעינה: ' + err.message, 'error'); }
}

function populateForms() {
  populateVibeText();
  populatePolaroids('vibe-left-list',  siteData.vibe.leftPhotos,  'left');
  populatePolaroids('vibe-right-list', siteData.vibe.rightPhotos, 'right');
  populateLocation();
  populateMenuList();
  populateDealsList();
  populateSectionOrder();
}

// ===================== SECTION ORDER =====================
const SECTION_LABELS = {
  vibe:     '🌈 מקטע הויב (פולרויד)',
  menu:     '🍔 תפריט מנות',
  deals:    '🔥 עסקיות',
  location: '📍 מיקום ואינסטגרם'
};

function populateSectionOrder() {
  const list = document.getElementById('section-order-list');
  if (!list) return;
  const order = siteData.sectionOrder;
  list.innerHTML = '';
  order.forEach((id, i) => {
    const div = document.createElement('div');
    div.className = 'section-order-item';
    div.innerHTML = `
      <span>${SECTION_LABELS[id] || id}</span>
      <div class="section-order-btns">
        <button data-oi="${i}" data-dir="up"   ${i === 0 ? 'disabled' : ''}>↑</button>
        <button data-oi="${i}" data-dir="down" ${i === order.length-1 ? 'disabled' : ''}>↓</button>
      </div>`;
    list.appendChild(div);
  });
  list.querySelectorAll('button[data-oi]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.oi);
      const d = btn.dataset.dir;
      const o = siteData.sectionOrder;
      if (d === 'up' && i > 0) [o[i], o[i-1]] = [o[i-1], o[i]];
      else if (d === 'down' && i < o.length-1) [o[i], o[i+1]] = [o[i+1], o[i]];
      populateSectionOrder();
    });
  });
}

// ===================== VIBE TEXT =====================
function populateVibeText() {
  const v = siteData.vibe || {};
  document.getElementById('vibe-heading').value    = v.heading    || '';
  document.getElementById('vibe-subheading').value = v.subheading || '';
  document.getElementById('vibe-body').value       = v.body       || '';
}
function saveVibeText() {
  if (!siteData.vibe) siteData.vibe = {};
  siteData.vibe.heading    = document.getElementById('vibe-heading').value;
  siteData.vibe.subheading = document.getElementById('vibe-subheading').value;
  siteData.vibe.body       = document.getElementById('vibe-body').value;
  saveData('טקסט Hero נשמר! ✏️');
}

// ===================== LOCATION =====================
function populateLocation() {
  const loc = siteData.location || {};
  document.getElementById('loc-name').value       = loc.name || '';
  document.getElementById('loc-directions').value = loc.directionsUrl || '';
  document.getElementById('loc-embed').value      = loc.mapEmbedUrl || '';
  document.getElementById('loc-hours').value      = loc.hours || '';
  document.getElementById('loc-open').checked     = !!loc.isOpen;
}
function saveLocation() {
  siteData.location = {
    name: document.getElementById('loc-name').value,
    directionsUrl: document.getElementById('loc-directions').value,
    mapEmbedUrl:   document.getElementById('loc-embed').value,
    hours:         document.getElementById('loc-hours').value,
    isOpen:        document.getElementById('loc-open').checked
  };
  saveData('מיקום נשמר! 📍');
}

// ===================== POLAROIDS =====================
function populatePolaroids(containerId, photos, side) {
  const list = document.getElementById(containerId);
  if (!list) return;
  list.innerHTML = '';
  photos.forEach((photo, i) => {
    const div = document.createElement('div');
    div.className = 'polaroid-item';
    div.innerHTML = `
      <img src="${photo.url}" onerror="this.src='assets/burger.png'" alt="">
      <div class="polaroid-item-fields">
        <input type="text" value="${photo.url}"     placeholder="URL" data-f="url"     data-s="${side}" data-i="${i}">
        <input type="text" value="${photo.caption}" placeholder="כיתוב" data-f="caption" data-s="${side}" data-i="${i}">
      </div>
      <div class="polaroid-item-actions">
        <button class="btn btn-sm btn-edit"   data-pa="save"   data-s="${side}" data-i="${i}">שמור</button>
        <button class="btn btn-sm btn-danger" data-pa="delete" data-s="${side}" data-i="${i}">מחק</button>
      </div>`;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-pa]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i), s = btn.dataset.s;
      const arr = s === 'left' ? siteData.vibe.leftPhotos : siteData.vibe.rightPhotos;
      if (btn.dataset.pa === 'delete') {
        if (confirm('למחוק?')) { arr.splice(i, 1); saveData('נמחק!'); }
      } else {
        const u = list.querySelector(`[data-i="${i}"][data-s="${s}"][data-f="url"]`);
        const c = list.querySelector(`[data-i="${i}"][data-s="${s}"][data-f="caption"]`);
        if (u) arr[i].url = u.value;
        if (c) arr[i].caption = c.value;
        saveData('עודכן! 🖼️');
      }
    });
  });
}

function addPolaroid(side) {
  const u = document.getElementById(`new-${side}-url`).value.trim();
  const c = document.getElementById(`new-${side}-caption`).value.trim();
  if (!u) { showStatus('כתובת תמונה נדרשת', 'error'); return; }
  const key = side === 'left' ? 'leftPhotos' : 'rightPhotos';
  siteData.vibe[key].push({ url: u, caption: c });
  document.getElementById(`new-${side}-url`).value = '';
  document.getElementById(`new-${side}-caption`).value = '';
  saveData('פולרויד נוסף! 📸');
}

// ===================== MENU =====================
function populateMenuList() {
  const list = document.getElementById('admin-menu-list');
  const items = siteData.menu;
  if (!items.length) { list.innerHTML = '<p>אין מנות עדיין.</p>'; return; }
  list.innerHTML = '';
  items.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'admin-menu-item';
    div.innerHTML = `
      <div class="admin-menu-item-header">
        <div class="admin-item-info"><strong>${item.name}</strong><span>₪${item.price} · ${item.soldOut ? '🔴 אזל' : '🟢 זמין'}</span></div>
        <div class="admin-actions">
          <button class="btn btn-sm btn-edit"   data-a="edit"   data-i="${i}">עריכה</button>
          <button class="btn btn-sm btn-warn"   data-a="sold"   data-i="${i}">${item.soldOut ? 'החזר' : 'אזל'}</button>
          <button class="btn btn-sm btn-danger" data-a="del"    data-i="${i}">מחק</button>
        </div>
      </div>
      <div class="admin-item-edit" id="mef-${i}">
        <div class="form-row">
          <div class="form-group"><label>שם</label><input class="e-name" value="${item.name}"></div>
          <div class="form-group"><label>מחיר</label><input type="number" class="e-price" value="${item.price}"></div>
        </div>
        <div class="form-group"><label>תיאור</label><input class="e-desc" value="${item.description}"></div>
        <div class="form-group"><label>URL תמונה</label><input class="e-img" value="${item.image || ''}"></div>
        <button class="btn btn-sm btn--secondary" data-a="save" data-i="${i}">שמור</button>
      </div>`;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-a]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i);
      if (btn.dataset.a === 'edit') document.getElementById(`mef-${i}`).classList.toggle('open');
      else if (btn.dataset.a === 'sold') { siteData.menu[i].soldOut = !siteData.menu[i].soldOut; saveData(siteData.menu[i].soldOut ? 'סומן אזל 🔴' : 'הוחזר 🟢'); }
      else if (btn.dataset.a === 'del') { if (confirm('למחוק?')) { siteData.menu.splice(i, 1); saveData('נמחק!'); } }
      else if (btn.dataset.a === 'save') {
        const f = document.getElementById(`mef-${i}`);
        siteData.menu[i] = { ...siteData.menu[i], name: f.querySelector('.e-name').value, price: Number(f.querySelector('.e-price').value), description: f.querySelector('.e-desc').value, image: f.querySelector('.e-img').value };
        saveData('מנה עודכנה! 🍔');
      }
    });
  });
}

function addMenuItem() {
  const name = document.getElementById('new-item-name').value.trim();
  const price = document.getElementById('new-item-price').value;
  if (!name || !price) { showStatus('שם ומחיר חובה', 'error'); return; }
  siteData.menu.push({ id: 'item-' + Date.now(), name, description: document.getElementById('new-item-desc').value.trim(), price: Number(price), soldOut: false, image: document.getElementById('new-item-image').value.trim() || 'assets/burger.png' });
  ['new-item-name','new-item-price','new-item-desc','new-item-image'].forEach(id => document.getElementById(id).value = '');
  saveData('מנה נוספה! 🎉');
}

// ===================== DEALS =====================
function populateDealsList() {
  const list = document.getElementById('admin-deals-list');
  const note = document.getElementById('deals-count-note');
  const form = document.getElementById('add-deal-form');
  const count = siteData.deals.length;
  note.textContent = `${count}/3 עסקיות מוגדרות`;
  form.style.display = count >= 3 ? 'none' : 'block';
  if (!count) { list.innerHTML = '<p>אין עסקיות עדיין.</p>'; return; }
  list.innerHTML = '';
  siteData.deals.forEach((deal, i) => {
    const inc = toArr(deal.includes).join(', ');
    const div = document.createElement('div');
    div.className = 'admin-deal-item';
    div.innerHTML = `
      <div class="admin-deal-header">
        <div class="admin-item-info"><strong>${deal.name}</strong><span>₪${deal.price} — ${inc}</span></div>
        <div class="admin-actions">
          <button class="btn btn-sm btn-edit"   data-da="edit" data-i="${i}">עריכה</button>
          <button class="btn btn-sm btn-danger" data-da="del"  data-i="${i}">מחק</button>
        </div>
      </div>
      <div class="admin-item-edit" id="def-${i}">
        <div class="form-row">
          <div class="form-group"><label>שם</label><input class="d-name" value="${deal.name}"></div>
          <div class="form-group"><label>מחיר</label><input type="number" class="d-price" value="${deal.price}"></div>
        </div>
        <div class="form-group"><label>תיאור</label><input class="d-desc" value="${deal.description}"></div>
        <div class="form-group"><label>מה כלול (פסיקים)</label><input class="d-inc" value="${inc}"></div>
        <div class="form-group"><label>URL תמונה</label><input class="d-img" value="${deal.image || ''}"></div>
        <button class="btn btn-sm btn--secondary" data-da="save" data-i="${i}">שמור</button>
      </div>`;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-da]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i);
      if (btn.dataset.da === 'edit') document.getElementById(`def-${i}`).classList.toggle('open');
      else if (btn.dataset.da === 'del') { if (confirm('למחוק?')) { siteData.deals.splice(i, 1); saveData('עסקית נמחקה!'); } }
      else if (btn.dataset.da === 'save') {
        const f = document.getElementById(`def-${i}`);
        siteData.deals[i] = { ...siteData.deals[i], name: f.querySelector('.d-name').value, price: Number(f.querySelector('.d-price').value), description: f.querySelector('.d-desc').value, includes: f.querySelector('.d-inc').value.split(',').map(s => s.trim()).filter(Boolean), image: f.querySelector('.d-img').value };
        saveData('עסקית עודכנה! 🔥');
      }
    });
  });
}

function addDeal() {
  if (siteData.deals.length >= 3) { showStatus('מקסימום 3 עסקיות', 'error'); return; }
  const name = document.getElementById('new-deal-name').value.trim();
  const price = document.getElementById('new-deal-price').value;
  if (!name || !price) { showStatus('שם ומחיר חובה', 'error'); return; }
  siteData.deals.push({ id: 'deal-' + Date.now(), name, description: document.getElementById('new-deal-desc').value.trim(), price: Number(price), includes: document.getElementById('new-deal-includes').value.split(',').map(s => s.trim()).filter(Boolean), image: document.getElementById('new-deal-image').value.trim() || 'assets/burger.png' });
  ['new-deal-name','new-deal-price','new-deal-desc','new-deal-includes','new-deal-image'].forEach(id => document.getElementById(id).value = '');
  saveData('עסקית נוספה! 🔥');
}

// ===================== EVENTS INBOX =====================
function loadEvents() {
  onValue(eventsRef, (snap) => {
    const tbody = document.getElementById('events-table-body');
    const table = document.getElementById('events-table');
    const empty = document.getElementById('events-inbox-empty');
    if (!snap.exists()) { empty.textContent = 'אין פניות עדיין.'; return; }
    const events = snap.val();
    const keys = Object.keys(events);
    tbody.innerHTML = '';
    keys.sort((a,b) => (events[b].timestamp||0) - (events[a].timestamp||0)).forEach(key => {
      const e = events[key];
      const d = e.timestamp ? new Date(e.timestamp).toLocaleDateString('he-IL') : '—';
      const typeMap = { birthday:'יום הולדת', corporate:'אירוע חברה', wedding:'חתונה', graduation:'מסיבת סיום', other:'אחר', '':'—' };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="${!e.seen ? 'ev-new' : ''}">${e.name}</td>
        <td><a href="tel:${e.phone}">${e.phone}</a></td>
        <td>${typeMap[e.type]||e.type||'—'}</td>
        <td>${e.date||'—'}</td>
        <td>${e.guests||'—'}</td>
        <td style="max-width:200px;font-size:0.82rem">${e.message||'—'}</td>
        <td><button class="btn btn-sm btn-danger" data-del-ev="${key}">מחק</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('[data-del-ev]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('למחוק פניה?')) remove(ref(db, 'events/' + btn.dataset.delEv));
      });
    });
    empty.style.display = 'none';
    table.style.display = 'table';
  });
}

// ===================== RESET =====================
async function resetToDefault() {
  if (!confirm('לאפס הכל לברירת מחדל?')) return;
  const r = await fetch('site-data.json');
  siteData = await r.json();
  saveData('אופס לברירת מחדל ✅');
}

// ===================== BOOT =====================
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  loadEvents();
  setupCollapsible();

  document.getElementById('save-vibe-text-btn').addEventListener('click', saveVibeText);
  document.getElementById('save-location-btn').addEventListener('click', saveLocation);
  document.getElementById('add-item-btn').addEventListener('click', addMenuItem);
  document.getElementById('add-deal-btn').addEventListener('click', addDeal);
  document.getElementById('reset-data-btn').addEventListener('click', resetToDefault);
  document.getElementById('add-left-btn').addEventListener('click', () => addPolaroid('left'));
  document.getElementById('add-right-btn').addEventListener('click', () => addPolaroid('right'));
  document.getElementById('save-order-btn').addEventListener('click', () => saveData('סדר מקטעים נשמר! ✅'));
});
