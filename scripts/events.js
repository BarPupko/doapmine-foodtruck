// events.js — Events page form submission to Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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
const eventsRef = ref(db, 'events');

document.getElementById('event-inquiry-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const successEl = document.getElementById('ev-success');
  const errorEl   = document.getElementById('ev-error');
  successEl.style.display = 'none';
  errorEl.style.display   = 'none';

  const name    = document.getElementById('ev-name').value.trim();
  const phone   = document.getElementById('ev-phone').value.trim();
  const guests  = document.getElementById('ev-guests').value;
  const type    = document.getElementById('ev-type').value;
  const date    = document.getElementById('ev-date').value;
  const message = document.getElementById('ev-message').value.trim();

  if (!name || !phone) {
    errorEl.textContent = 'אנא מלאו שם וטלפון';
    errorEl.style.display = 'block';
    return;
  }

  try {
    await push(eventsRef, {
      name, phone, guests: guests || '', type, date, message,
      timestamp: Date.now(),
      seen: false
    });
    successEl.style.display = 'block';
    e.target.reset();
  } catch (err) {
    errorEl.textContent = 'שגיאה בשליחה: ' + err.message;
    errorEl.style.display = 'block';
  }
});
