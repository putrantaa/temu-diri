/* =========================================================
   BK SAHABAT — main.js
   Semua data (mood, jurnal, surat kaleng, booking) disimpan
   di localStorage browser. INI PROTOTIPE FRONTEND SAJA:
   tidak ada server, jadi data tidak benar-benar terkirim ke
   Guru BK. Lihat README.md untuk penjelasan lengkap & langkah
   menyambungkannya ke backend sungguhan.
   ========================================================= */

const BK = {
  keys: {
    consent: 'bk_consent',
    mood: 'bk_mood_history',
    bookings: 'bk_bookings',
    diary: 'bk_diary',
    surat: 'bk_surat',
  },

  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Gagal menyimpan ke localStorage', e);
    }
  },
  todayStr(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  },
  formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  },
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initFaq();
  initConsentModal();
  initCrisisModal();
  initMoodTracker();
  initBooking();
  initJournalTabs();
  initDiary();
  initSuratKaleng();
  initQuiz();
});

/* ---------------------------------------------------------
   NAVBAR (hamburger untuk mobile)
--------------------------------------------------------- */
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

/* ---------------------------------------------------------
   FAQ ACCORDION
--------------------------------------------------------- */
function initFaq() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.getAttribute('data-open') === 'true';
      item.setAttribute('data-open', (!isOpen).toString());
      btn.setAttribute('aria-expanded', (!isOpen).toString());
    });
  });
}

/* ---------------------------------------------------------
   MODAL PERSETUJUAN PRIVASI (muncul sekali di kunjungan pertama)
--------------------------------------------------------- */
function initConsentModal() {
  const modal = document.getElementById('consentModal');
  if (!modal) return;
  const already = BK.load(BK.keys.consent, false);
  const checkbox = modal.querySelector('#consentCheck');
  const confirmBtn = modal.querySelector('#consentConfirm');

  if (!already) {
    modal.classList.add('open');
  }

  if (checkbox && confirmBtn) {
    checkbox.addEventListener('change', () => {
      confirmBtn.disabled = !checkbox.checked;
    });
    confirmBtn.addEventListener('click', () => {
      BK.save(BK.keys.consent, true);
      modal.classList.remove('open');
    });
  }
}

/* ---------------------------------------------------------
   MODAL TOMBOL DARURAT
--------------------------------------------------------- */
function initCrisisModal() {
  const openBtn = document.getElementById('crisisFab');
  const modal = document.getElementById('crisisModal');
  const closeBtn = document.getElementById('crisisClose');
  if (!openBtn || !modal) return;

  openBtn.addEventListener('click', () => modal.classList.add('open'));
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.classList.remove('open');
  });
}

/* ---------------------------------------------------------
   MOOD TRACKER (mood.html)
--------------------------------------------------------- */
function initMoodTracker() {
  const picker = document.getElementById('moodPicker');
  if (!picker) return;

  const historyGrid = document.getElementById('moodHistoryGrid');
  const streakNotice = document.getElementById('moodStreakNotice');
  const savedNotice = document.getElementById('moodSavedNotice');

  const moodMeta = {
    1: { emoji: '😢', label: 'Sangat sedih', color: 'var(--mood-1)' },
    2: { emoji: '😟', label: 'Cemas', color: 'var(--mood-2)' },
    3: { emoji: '😐', label: 'Biasa saja', color: 'var(--mood-3)' },
    4: { emoji: '🙂', label: 'Senang', color: 'var(--mood-4)' },
    5: { emoji: '🤩', label: 'Bersemangat', color: 'var(--mood-5)' },
  };

  let history = BK.load(BK.keys.mood, []);
  const today = BK.todayStr();
  const todayEntry = history.find((h) => h.date === today);

  picker.querySelectorAll('.mood-option').forEach((btn) => {
    const val = btn.dataset.value;
    if (todayEntry && todayEntry.value === Number(val)) {
      btn.setAttribute('aria-pressed', 'true');
    }
    btn.addEventListener('click', () => {
      picker.querySelectorAll('.mood-option').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');

      const value = Number(val);
      history = history.filter((h) => h.date !== today);
      history.push({ date: today, value });
      history.sort((a, b) => a.date.localeCompare(b.date));
      BK.save(BK.keys.mood, history);

      if (savedNotice) {
        savedNotice.textContent = 'Tersimpan — moodmu hari ini: ' + moodMeta[value].label + ' ' + moodMeta[value].emoji;
        savedNotice.style.display = 'block';
      }

      renderHistory();
      checkStreak();
    });
  });

  function renderHistory() {
    if (!historyGrid) return;
    historyGrid.innerHTML = '';
    const days = [];
    for (let i = 29; i >= 0; i--) days.push(BK.todayStr(-i));

    days.forEach((d) => {
      const entry = history.find((h) => h.date === d);
      const cell = document.createElement('div');
      cell.className = 'mood-day';
      cell.title = BK.formatDate(d) + (entry ? ' — ' + moodMeta[entry.value].label : ' — belum diisi');
      if (entry) cell.style.background = moodMeta[entry.value].color;
      historyGrid.appendChild(cell);
    });
  }

  function checkStreak() {
    if (!streakNotice) return;
    let streak = 0;
    for (let i = 0; i < 5; i++) {
      const d = BK.todayStr(-i);
      const entry = history.find((h) => h.date === d);
      if (entry && entry.value <= 2) streak++;
      else break;
    }
    if (streak >= 3) {
      streakNotice.style.display = 'block';
    } else {
      streakNotice.style.display = 'none';
    }
  }

  renderHistory();
  checkStreak();
}

/* ---------------------------------------------------------
   BOOKING KONSULTASI (konsultasi.html)
--------------------------------------------------------- */
function initBooking() {
  const form = document.getElementById('bookingForm');
  const list = document.getElementById('bookingList');
  if (!form || !list) return;

  let bookings = BK.load(BK.keys.bookings, []);

  document.querySelectorAll('.pilih-guru-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const select = form.querySelector('#bookingTeacher');
      if (select) select.value = btn.dataset.teacher;
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstField = form.querySelector('select, input');
      if (firstField) firstField.focus();
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const teacher = form.bookingTeacher.value;
    const mode = form.bookingMode.value;
    const date = form.bookingDate.value;
    const time = form.bookingTime.value;
    const note = form.bookingNote.value.trim();

    if (!teacher || !mode || !date || !time) return;

    bookings.push({
      id: BK.uid(),
      teacher, mode, date, time, note,
      status: 'Menunggu Persetujuan',
    });
    BK.save(BK.keys.bookings, bookings);
    form.reset();
    render();
  });

  list.addEventListener('click', (e) => {
    const approveBtn = e.target.closest('[data-approve]');
    const cancelBtn = e.target.closest('[data-cancel]');
    if (approveBtn) {
      const id = approveBtn.dataset.approve;
      bookings = bookings.map((b) => (b.id === id ? { ...b, status: 'Disetujui' } : b));
      BK.save(BK.keys.bookings, bookings);
      render();
    }
    if (cancelBtn) {
      const id = cancelBtn.dataset.cancel;
      bookings = bookings.filter((b) => b.id !== id);
      BK.save(BK.keys.bookings, bookings);
      render();
    }
  });

  function badgeClass(status) {
    if (status === 'Disetujui') return 'badge-ok';
    if (status === 'Dijadwalkan Ulang') return 'badge-reschedule';
    return 'badge-wait';
  }

  function render() {
    if (bookings.length === 0) {
      list.innerHTML = '<p class="empty-state">Belum ada jadwal konsultasi. Isi form di atas untuk booking.</p>';
      return;
    }
    list.innerHTML = bookings
      .slice()
      .reverse()
      .map(
        (b) => `
      <div class="card" style="margin-bottom:14px;">
        <div class="entry-meta">
          <span class="entry-date">${BK.formatDate(b.date)} · ${b.time}</span>
          <span class="badge ${badgeClass(b.status)}">${b.status}</span>
        </div>
        <p style="margin:0 0 4px;"><strong>${b.teacher}</strong> · ${b.mode}</p>
        ${b.note ? `<p style="color:var(--color-ink-soft); font-size:0.9rem;">"${escapeHtml(b.note)}"</p>` : ''}
        <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;">
          ${b.status !== 'Disetujui' ? `<button class="btn btn-secondary btn-sm" data-approve="${b.id}">🔧 (Demo) Tandai Disetujui</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-cancel="${b.id}">Batalkan</button>
        </div>
      </div>`
      )
      .join('');
  }

  render();
}

/* ---------------------------------------------------------
   TAB JURNAL & CURHAT
--------------------------------------------------------- */
function initJournalTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  if (!tabs.length) return;
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      const panel = document.getElementById(tab.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ---------------------------------------------------------
   BUKU HARIAN RAHASIA (diary)
--------------------------------------------------------- */
function initDiary() {
  const form = document.getElementById('diaryForm');
  const list = document.getElementById('diaryList');
  if (!form || !list) return;

  let entries = BK.load(BK.keys.diary, []);
  pruneExpired();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = form.diaryText.value.trim();
    if (!text) return;
    const selfDestruct = form.diarySelfDestruct.checked;
    entries.push({
      id: BK.uid(),
      text,
      timestamp: Date.now(),
      selfDestruct,
    });
    BK.save(BK.keys.diary, entries);
    form.reset();
    render();
  });

  list.addEventListener('click', (e) => {
    const delBtn = e.target.closest('[data-del]');
    if (delBtn) {
      entries = entries.filter((en) => en.id !== delBtn.dataset.del);
      BK.save(BK.keys.diary, entries);
      render();
    }
  });

  function pruneExpired() {
    const now = Date.now();
    const before = entries.length;
    entries = entries.filter((en) => !(en.selfDestruct && now - en.timestamp > 24 * 60 * 60 * 1000));
    if (entries.length !== before) BK.save(BK.keys.diary, entries);
  }

  function render() {
    if (entries.length === 0) {
      list.innerHTML = '<p class="empty-state">Belum ada tulisan. Ini ruang pribadimu — hanya kamu yang bisa membacanya.</p>';
      return;
    }
    list.innerHTML = entries
      .slice()
      .reverse()
      .map((en) => {
        const date = new Date(en.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
        return `
        <div class="card entry-card">
          <div class="entry-meta">
            <span class="entry-date">${date}${en.selfDestruct ? ' · ⏳ hapus otomatis 24 jam' : ''}</span>
            <button class="entry-delete" data-del="${en.id}">Hapus</button>
          </div>
          <p class="entry-text">${escapeHtml(en.text)}</p>
        </div>`;
      })
      .join('');
  }

  render();
}

/* ---------------------------------------------------------
   SURAT KALENG (anonim)
--------------------------------------------------------- */
function initSuratKaleng() {
  const form = document.getElementById('suratForm');
  const countEl = document.getElementById('suratCount');
  const confirmEl = document.getElementById('suratConfirm');
  if (!form) return;

  let surat = BK.load(BK.keys.surat, []);
  updateCount();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = form.suratText.value.trim();
    if (!text) return;
    surat.push({ id: BK.uid(), text, timestamp: Date.now() });
    BK.save(BK.keys.surat, surat);
    form.reset();
    updateCount();
    if (confirmEl) {
      confirmEl.style.display = 'block';
      confirmEl.textContent = '📮 Suratmu tersimpan secara anonim (lihat catatan demo di atas).';
      setTimeout(() => { confirmEl.style.display = 'none'; }, 5000);
    }
  });

  function updateCount() {
    if (countEl) countEl.textContent = surat.length;
  }
}

/* ---------------------------------------------------------
   KUIS GAYA BELAJAR (literasi.html)
--------------------------------------------------------- */
function initQuiz() {
  const quiz = document.getElementById('learningQuiz');
  if (!quiz) return;

  const tally = { visual: 0, auditori: 0, kinestetik: 0 };
  const resultEl = document.getElementById('quizResult');
  const questions = quiz.querySelectorAll('.quiz-question');

  questions.forEach((q) => {
    const options = q.querySelectorAll('.quiz-option');
    options.forEach((opt) => {
      opt.addEventListener('click', () => {
        options.forEach((o) => o.setAttribute('aria-pressed', 'false'));
        opt.setAttribute('aria-pressed', 'true');
        checkComplete();
      });
    });
  });

  function checkComplete() {
    const answered = quiz.querySelectorAll('.quiz-option[aria-pressed="true"]');
    if (answered.length < questions.length) return;

    tally.visual = 0; tally.auditori = 0; tally.kinestetik = 0;
    answered.forEach((a) => { tally[a.dataset.type] = (tally[a.dataset.type] || 0) + 1; });

    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
    const copy = {
      visual: 'Kamu cenderung bergaya belajar VISUAL 👀 — kamu lebih mudah paham lewat gambar, diagram, warna, dan catatan yang rapi.',
      auditori: 'Kamu cenderung bergaya belajar AUDITORI 🎧 — kamu lebih mudah paham lewat mendengarkan penjelasan, diskusi, atau membaca dengan suara keras.',
      kinestetik: 'Kamu cenderung bergaya belajar KINESTETIK ✋ — kamu lebih mudah paham lewat praktik langsung dan gerakan, bukan cuma teori.',
    };
    if (resultEl) {
      resultEl.textContent = copy[top];
      resultEl.classList.add('show');
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

/* ---------------------------------------------------------
   UTIL
--------------------------------------------------------- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
