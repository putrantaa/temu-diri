/* =========================================================
   TEMU DIRI — main.js
   Semua data (mood, jurnal, booking) disimpan
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
    currentUser: 'bk_current_user',
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
  getCurrentUser() {
    const user = this.load(this.keys.currentUser, null);
    if (user && user.username && BK_USERS[user.username] && BK_USERS[user.username].kelas) {
      user.kelas = BK_USERS[user.username].kelas;
    }
    return user;
  },
  saveCurrentUser(user) {
    this.save(this.keys.currentUser, user);
  },
  clearCurrentUser() {
    try { localStorage.removeItem(this.keys.currentUser); } catch (e) {}
    try { localStorage.removeItem('isLoggedIn'); } catch (e) {}
  },
};

/* ---------------------------------------------------------
   KREDENSIAL HARDCODED
   Siswa  : username=siswa01   password=siswa123
   Guru BK: username=gurubk    password=bk2026
--------------------------------------------------------- */
const BK_USERS = {
  siswa01: {
    password: 'siswa123',
    role: 'siswa',
    name: 'Putranta Wisnu Wardhana',
    kelas: '7A',
    nisn: '0051234567',
    avatar: 'PW',
    email: 'putranta.wardhana@siswa.sch.id',
  },
  gurubk: {
    password: 'bk2026',
    role: 'guru',
    name: 'Bu Alda, S.Pd.',
    nip: '198501012010012001',
    spesialisasi: 'Pertemanan & Keluarga',
    avatar: 'BA',
    email: 'alda.bk@sekolah.sch.id',
  },
};

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initNav();
  initFaq();
  initConsentModal();
  initCrisisModal();
  initMoodTracker();
  initBooking();
  initJournalTabs();
  initDiary();
  initQuiz();
  initHelpModal();
  initGuruDashboard();
  initProfil();
});

/* ---------------------------------------------------------
   AUTH (ROLE-BASED)
--------------------------------------------------------- */
function initAuth() {
  const path = window.location.pathname;
  const isAuthPage   = path.endsWith('login.html') || path.endsWith('register.html');
  const isMoodPage   = path.endsWith('mood.html');
  const isGuruPage   = path.endsWith('dashboard-guru.html');
  const isProfilPage = path.endsWith('profil.html');

  const currentUser = BK.getCurrentUser();
  const isLoggedIn  = !!currentUser;

  function isMoodFilledToday() {
    return BK.load(BK.keys.mood, []).some((h) => h.date === BK.todayStr());
  }

  // Belum login → ke halaman login
  if (!isLoggedIn && !isAuthPage) {
    window.location.href = 'login.html';
    return;
  }

  // Guru membuka halaman siswa → redirect ke dashboard guru
  if (isLoggedIn && currentUser.role === 'guru' && !isGuruPage && !isProfilPage && !isAuthPage) {
    window.location.href = 'dashboard-guru.html';
    return;
  }

  // Siswa membuka halaman guru → redirect ke mood
  if (isLoggedIn && currentUser.role === 'siswa' && isGuruPage) {
    window.location.href = 'mood.html';
    return;
  }

  // Siswa belum isi mood hari ini → wajib isi dulu
  if (isLoggedIn && currentUser.role === 'siswa' && !isAuthPage && !isMoodPage && !isGuruPage && !isMoodFilledToday()) {
    window.location.href = 'mood.html';
    return;
  }

  // Update navbar sesuai user
  updateNavbar(currentUser, isMoodPage);

  // ---- Login Form ----
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const errorEl = document.getElementById('loginError');
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = (document.getElementById('username').value || '').trim();
      const password = document.getElementById('password').value || '';
      const userData = BK_USERS[username];

      if (!userData || userData.password !== password) {
        if (errorEl) {
          errorEl.textContent = '❌ Username atau kata sandi salah. Coba lagi.';
          errorEl.style.display = 'block';
        }
        return;
      }

      // Simpan sesi
      BK.saveCurrentUser({
        username,
        role:        userData.role,
        name:        userData.name,
        avatar:      userData.avatar,
        email:       userData.email      || null,
        kelas:       userData.kelas      || null,
        nisn:        userData.nisn       || null,
        nip:         userData.nip        || null,
        spesialisasi: userData.spesialisasi || null,
      });

      window.location.href = userData.role === 'guru' ? 'dashboard-guru.html' : 'mood.html';
    });
  }

  // ---- Register Form (dinonaktifkan — sistem hardcoded) ----
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('registerError') || document.getElementById('loginError');
      if (errorEl) {
        errorEl.innerHTML = 'ℹ️ Sistem menggunakan akun tetap. Gunakan:<br><b>Siswa</b>: siswa01 / siswa123<br><b>Guru BK</b>: gurubk / bk2026';
        errorEl.style.display = 'block';
      }
    });
  }
}

/* ---------------------------------------------------------
   UPDATE NAVBAR (berdasarkan role)
--------------------------------------------------------- */
function updateNavbar(currentUser, isMoodPage) {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  // Hapus link Masuk/Keluar lama dari HTML
  navLinks.querySelectorAll('li').forEach((li) => {
    const txt = (li.querySelector('a') || {}).textContent || '';
    if (txt.trim() === 'Masuk' || txt.trim() === 'Keluar') li.remove();
  });

  if (!currentUser) {
    const li = document.createElement('li');
    li.innerHTML = '<a href="login.html">Masuk</a>';
    navLinks.appendChild(li);
    return;
  }

  // Khusus Guru: bersihkan menu statis siswa, ganti jadi menu guru
  if (currentUser.role === 'guru') {
    navLinks.innerHTML = '';
    const onDashboard = window.location.pathname.endsWith('dashboard-guru.html');
    const dashLi = document.createElement('li');
    dashLi.innerHTML = `<a href="dashboard-guru.html" ${onDashboard ? 'aria-current="page"' : ''}>Dashboard</a>`;
    navLinks.appendChild(dashLi);
  }

  // Blokir navigasi di mood.html jika mood belum diisi
  if (currentUser.role === 'siswa' && isMoodPage) {
    navLinks.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!href.includes('mood.html') && !href.includes('profil.html') && href !== '#') {
        link.addEventListener('click', (e) => {
          const filled = BK.load(BK.keys.mood, []).some((h) => h.date === BK.todayStr());
          if (!filled) {
            e.preventDefault();
            const warn = document.getElementById('moodBlockedWarning');
            if (warn) {
              warn.style.display = 'block';
              warn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => { warn.style.display = 'none'; }, 3500);
            }
          }
        });
      }
    });
  }

  // Tambah link Profil (nama depan + avatar)
  const onProfil = window.location.pathname.endsWith('profil.html');
  const profilLi = document.createElement('li');
  profilLi.innerHTML = `<a href="profil.html" ${onProfil ? 'aria-current="page"' : ''} style="display:flex;align-items:center;gap:7px;">
    <span style="width:26px;height:26px;border-radius:50%;background:${currentUser.role === 'guru' ? 'var(--color-coral)' : 'var(--color-teal)'};color:#fff;font-size:0.72rem;font-weight:700;display:grid;place-items:center;flex-shrink:0;">${currentUser.avatar}</span>
    ${currentUser.name.split(' ')[0]}
  </a>`;
  navLinks.appendChild(profilLi);

  // Event listener untuk tombol keluar (sekarang hanya ada di halaman profil)
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'logoutBtn') {
      e.preventDefault();
      BK.clearCurrentUser();
      window.location.href = 'login.html';
    }
  });
}

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

  const historyGrid    = document.getElementById('moodHistoryGrid');
  const streakNotice   = document.getElementById('moodStreakNotice');
  const savedNotice    = document.getElementById('moodSavedNotice');
  const noteSection    = document.getElementById('moodNoteSection');
  const noteInput      = document.getElementById('moodNoteInput');
  const saveBtn        = document.getElementById('moodSaveBtn');
  const motivasiModal  = document.getElementById('motivasiModal');
  const motivasiClose  = document.getElementById('motivasiClose');
  const motivasiText   = document.getElementById('motivasiText');
  const motivasiEmoji  = document.getElementById('motivasiEmoji');

  const moodMeta = {
    1: { emoji: '😢', label: 'Sangat Sedih', color: 'var(--mood-1)' },
    2: { emoji: '😟', label: 'Cemas',        color: 'var(--mood-2)' },
    3: { emoji: '😐', label: 'Biasa Saja',   color: 'var(--mood-3)' },
    4: { emoji: '🙂', label: 'Senang',       color: 'var(--mood-4)' },
    5: { emoji: '🤩', label: 'Bersemangat',  color: 'var(--mood-5)' },
  };

  // Kumpulan kata motivasi berdasarkan nilai mood
  const motivasi = {
    1: [
      { emoji: '💛', text: 'Nggak apa-apa merasa sedih. Kamu sudah sangat berani dengan menuliskan perasaanmu hari ini.' },
      { emoji: '🌧️', text: 'Hari-hari berat pasti akan berlalu. Kamu lebih kuat dari yang kamu kira.' },
      { emoji: '🤍', text: 'Perasaanmu valid. Kalau butuh cerita lebih, ruang BK selalu terbuka untukmu.' },
    ],
    2: [
      { emoji: '🌬️', text: 'Cemas itu wajar — tanda kamu peduli. Tarik napas pelan-pelan, kamu pasti bisa melewatinya.' },
      { emoji: '💙', text: 'Satu langkah kecil setiap hari. Kamu tidak harus menyelesaikan semuanya sekarang.' },
      { emoji: '🌱', text: 'Kecemasanmu bukan kelemahan, itu tandamu sedang tumbuh dan belajar menghadapi sesuatu.' },
    ],
    3: [
      { emoji: '☕', text: 'Hari biasa pun berharga. Nikmati momen kecil yang ada hari ini.' },
      { emoji: '🌤️', text: 'Kadang "biasa saja" adalah bentuk ketenangan yang sesungguhnya. Tetap semangat ya!' },
      { emoji: '✨', text: 'Di balik hari yang biasa, ada ribuan hal kecil yang bisa disyukuri.' },
    ],
    4: [
      { emoji: '😊', text: 'Moodmu hari ini bagus! Sebarkan energi positif itu ke orang-orang di sekitarmu.' },
      { emoji: '🌻', text: 'Senang mendengar kamu merasa senang! Pertahankan semangat ini terus ya.' },
      { emoji: '🎉', text: 'Hari yang menyenangkan adalah hadiah. Kamu berhak merasakannya sepenuhnya!' },
    ],
    5: [
      { emoji: '🚀', text: 'Wow, energimu luar biasa hari ini! Manfaatkan momen bersemangat ini sebaik-baiknya.' },
      { emoji: '⚡', text: 'Semangatmu menular! Terus jaga bara api itu dan capai hal-hal luar biasa hari ini.' },
      { emoji: '🌟', text: 'Kamu bersinar hari ini. Ingat momen ini saat hari-hari terasa berat nanti.' },
    ],
  };

  let history = BK.load(BK.keys.mood, []);
  const today = BK.todayStr();
  const todayEntry = history.find((h) => h.date === today);
  let selectedValue = todayEntry ? todayEntry.value : null;

  // Tandai pilihan mood jika sudah pernah diisi hari ini
  picker.querySelectorAll('.mood-option').forEach((btn) => {
    const val = Number(btn.dataset.value);
    if (todayEntry && todayEntry.value === val) {
      btn.setAttribute('aria-pressed', 'true');
    }
    btn.addEventListener('click', () => {
      picker.querySelectorAll('.mood-option').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      selectedValue = val;

      // Tampilkan bagian catatan setelah mood dipilih
      if (noteSection) noteSection.style.display = 'block';
      if (savedNotice) savedNotice.style.display = 'none';
    });
  });

  // Jika sudah pernah isi hari ini, tampilkan bagian catatan langsung
  if (todayEntry && noteSection) noteSection.style.display = 'block';

  // Tombol Simpan
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!selectedValue) {
        // Belum pilih mood — highlight picker
        picker.style.outline = '3px solid var(--color-coral)';
        picker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { picker.style.outline = ''; }, 2000);
        return;
      }

      const note = noteInput ? noteInput.value.trim() : '';

      const currentUser = BK.getCurrentUser();
      const studentName = currentUser && currentUser.role === 'siswa' ? currentUser.name : 'Siswa Anonim';

      // Simpan mood + catatan ke history
      history = history.filter((h) => h.date !== today);
      history.push({ date: today, value: selectedValue, note, studentName });
      history.sort((a, b) => a.date.localeCompare(b.date));
      BK.save(BK.keys.mood, history);

      // Kosongkan textarea & sembunyikan section catatan
      if (noteInput) noteInput.value = '';
      if (noteSection) noteSection.style.display = 'none';

      if (savedNotice) {
        savedNotice.textContent = '✅ Tersimpan — moodmu hari ini: ' + moodMeta[selectedValue].label + ' ' + moodMeta[selectedValue].emoji;
        savedNotice.style.display = 'block';
      }

      renderHistory();
      checkStreak();

      // Tampilkan popup motivasi (khususnya jika ada catatan)
      if (note && motivasiModal) {
        const pool = motivasi[selectedValue];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (motivasiText)  motivasiText.textContent  = pick.text;
        if (motivasiEmoji) motivasiEmoji.textContent = pick.emoji;
        motivasiModal.classList.add('open');
      }
    });
  }

  // Tutup popup motivasi
  if (motivasiClose && motivasiModal) {
    motivasiClose.addEventListener('click', () => motivasiModal.classList.remove('open'));
    motivasiModal.addEventListener('click', (e) => {
      if (e.target === motivasiModal) motivasiModal.classList.remove('open');
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && motivasiModal) motivasiModal.classList.remove('open');
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
      let title = BK.formatDate(d) + (entry ? ' — ' + moodMeta[entry.value].label : ' — belum diisi');
      if (entry && entry.note) title += ': "' + entry.note + '"';
      cell.title = title;
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
    streakNotice.style.display = streak >= 3 ? 'block' : 'none';
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

    const currentUser = BK.getCurrentUser();
    const studentName = currentUser && currentUser.role === 'siswa' ? currentUser.name : 'Siswa Anonim';

    bookings.push({
      id: BK.uid(),
      studentName,
      teacher, mode, date, time, note,
      status: 'Menunggu Persetujuan',
    });
    BK.save(BK.keys.bookings, bookings);
    form.reset();
    render();
  });

  list.addEventListener('click', (e) => {
    const cancelBtn = e.target.closest('[data-cancel]');
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
          <button class="btn btn-ghost btn-sm" data-cancel="${b.id}">Batalkan Pengajuan</button>
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
   HELP MODAL (ⓘ Cara Menggunakan)
--------------------------------------------------------- */
function initHelpModal() {
  // Buka modal ketika tombol [data-help-modal] diklik
  document.querySelectorAll('[data-help-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.helpModal;
      const modal = document.getElementById(targetId);
      if (modal) {
        modal.classList.add('open');
        const box = modal.querySelector('.help-modal-box');
        if (box) box.focus();
      }
    });
  });

  // Tutup modal ketika tombol [data-help-close] diklik
  document.querySelectorAll('[data-help-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.help-modal-backdrop');
      if (modal) modal.classList.remove('open');
    });
  });

  // Klik backdrop juga menutup
  document.querySelectorAll('.help-modal-backdrop').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  });

  // Tekan Escape juga menutup
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.help-modal-backdrop.open').forEach((m) => m.classList.remove('open'));
    }
  });
}

/* ---------------------------------------------------------
   DASHBOARD GURU BK (dashboard-guru.html)
--------------------------------------------------------- */
function initGuruDashboard() {
  if (!document.getElementById('guruDashboard')) return;

  const moodMeta = {
    1: { emoji: '😢', label: 'Sangat Sedih', color: 'var(--mood-1)' },
    2: { emoji: '😟', label: 'Cemas',        color: 'var(--mood-2)' },
    3: { emoji: '😐', label: 'Biasa Saja',   color: 'var(--mood-3)' },
    4: { emoji: '🙂', label: 'Senang',       color: 'var(--mood-4)' },
    5: { emoji: '🤩', label: 'Bersemangat',  color: 'var(--mood-5)' },
  };

  const currentUser = BK.getCurrentUser();
  const greetEl = document.getElementById('guruGreet');
  if (greetEl && currentUser) {
    greetEl.textContent = `Selamat datang, ${currentUser.name}! 👋`;
  }

  // Hitung ringkasan
  const moodHistory = BK.load(BK.keys.mood, []);
  const bookings    = BK.load(BK.keys.bookings, []);
  const el = (id) => document.getElementById(id);
  if (el('statMood'))    el('statMood').textContent    = moodHistory.length;
  if (el('statBooking')) el('statBooking').textContent = bookings.filter(b => b.status !== 'Disetujui').length;

  // Tabs
  document.querySelectorAll('.guru-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.guru-tab-btn').forEach((b) => b.setAttribute('aria-selected', 'false'));
      btn.setAttribute('aria-selected', 'true');
      document.querySelectorAll('.guru-tab-panel').forEach((p) => p.classList.remove('active'));
      const panel = document.getElementById(btn.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });

  // ---- Render Mood Siswa ----
  function renderMood() {
    const container = document.getElementById('guruMoodList');
    if (!container) return;
    const history = BK.load(BK.keys.mood, []).slice().reverse();
    if (history.length === 0) {
      container.innerHTML = '<p class="empty-state">Belum ada data mood dari siswa.</p>';
      return;
    }
    container.innerHTML = history.map((entry) => {
      const m = moodMeta[entry.value];
      return `
      <div class="card guru-entry-card" style="border-left:5px solid ${m.color};">
        <div class="entry-meta">
          <span class="entry-date">${BK.formatDate(entry.date)} · <strong style="color:var(--color-ink);">${escapeHtml(entry.studentName || 'Siswa Anonim')}</strong></span>
          <span style="font-size:1.6rem;">${m.emoji}</span>
        </div>
        <p style="margin:4px 0 0; font-weight:700; color:var(--color-ink);">${m.label}</p>
        ${entry.note
          ? `<p class="guru-note">"${escapeHtml(entry.note)}"</p>`
          : '<p style="color:var(--color-ink-faint);font-size:0.82rem;font-style:italic;">Tidak ada catatan.</p>'}
      </div>`;
    }).join('');
  }

  // ---- Render Booking ----
  function renderBooking() {
    const container = document.getElementById('guruBookingList');
    if (!container) return;
    let list = BK.load(BK.keys.bookings, []);
    if (list.length === 0) {
      container.innerHTML = '<p class="empty-state">Belum ada permintaan konsultasi.</p>';
      return;
    }
    container.innerHTML = list.slice().reverse().map((b) => `
    <div class="card guru-entry-card" data-booking-id="${b.id}">
      <div class="entry-meta">
        <span class="entry-date">📅 ${BK.formatDate(b.date)} · ${b.time}</span>
        <span class="badge ${b.status === 'Disetujui' ? 'badge-ok' : 'badge-wait'}">${b.status}</span>
      </div>
      <p style="margin:6px 0 2px;">Oleh: <strong>${escapeHtml(b.studentName || 'Siswa Anonim')}</strong></p>
      <p style="margin:0 0 2px; font-size:0.9rem;">Pilihan: <strong>${b.teacher}</strong> · ${b.mode}</p>
      ${b.note ? `<p class="guru-note">"${escapeHtml(b.note)}"</p>` : ''}
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
        ${b.status !== 'Disetujui' ? `<button class="btn btn-primary btn-sm" data-approve="${b.id}">Setujui</button>` : '<span style="color:var(--color-teal-dark);font-size:0.85rem;font-weight:700;">✅ Sudah disetujui</span>'}
        <button class="btn btn-ghost btn-sm" data-cancel="${b.id}">Batalkan</button>
      </div>
    </div>`).join('');
  }

  // Delegasi klik untuk tombol booking
  const bookingContainer = document.getElementById('guruBookingList');
  if (bookingContainer) {
    bookingContainer.addEventListener('click', (e) => {
      const approveBtn = e.target.closest('[data-approve]');
      const cancelBtn  = e.target.closest('[data-cancel]');
      if (approveBtn) {
        let list = BK.load(BK.keys.bookings, []);
        list = list.map((b) => b.id === approveBtn.dataset.approve ? { ...b, status: 'Disetujui' } : b);
        BK.save(BK.keys.bookings, list);
        renderBooking();
        // Update stat
        if (el('statBooking')) el('statBooking').textContent = list.filter(b => b.status !== 'Disetujui').length;
      }
      if (cancelBtn) {
        let list = BK.load(BK.keys.bookings, []);
        list = list.filter((b) => b.id !== cancelBtn.dataset.cancel);
        BK.save(BK.keys.bookings, list);
        renderBooking();
        if (el('statBooking')) el('statBooking').textContent = list.filter(b => b.status !== 'Disetujui').length;
      }
    });
  }

  renderMood();
  renderBooking();
}

/* ---------------------------------------------------------
   HALAMAN PROFIL (profil.html)
--------------------------------------------------------- */
function initProfil() {
  if (!document.getElementById('profilPage')) return;
  const currentUser = BK.getCurrentUser();
  if (!currentUser) return;

  const el = (id) => document.getElementById(id);

  // Avatar
  const avatarEl = el('profilAvatar');
  if (avatarEl) {
    avatarEl.textContent = currentUser.avatar;
    avatarEl.style.background = currentUser.role === 'guru' ? 'var(--color-coral)' : 'var(--color-teal)';
  }

  // Info umum
  if (el('profilName'))  el('profilName').textContent  = currentUser.name;
  if (el('profilRole'))  el('profilRole').textContent  = currentUser.role === 'guru' ? '👩‍🏫 Guru Bimbingan & Konseling' : '🎓 Siswa';
  if (el('profilEmail')) el('profilEmail').textContent = currentUser.email || '-';

  // Info khusus siswa
  if (currentUser.role === 'siswa') {
    if (el('siswaInfo')) el('siswaInfo').style.display = 'block';
    if (el('profilKelas')) el('profilKelas').textContent = currentUser.kelas  || '-';
    if (el('profilNisn'))  el('profilNisn').textContent  = currentUser.nisn   || '-';

    // Statistik mood
    const moodHistory = BK.load(BK.keys.mood, []);
    if (el('statMoodTotal')) el('statMoodTotal').textContent = moodHistory.length + ' hari';
    const lastMood = moodHistory[moodHistory.length - 1];
    if (el('statLastMood') && lastMood) {
      const meta = { 1:'😢 Sangat Sedih', 2:'😟 Cemas', 3:'😐 Biasa Saja', 4:'🙂 Senang', 5:'🤩 Bersemangat' };
      el('statLastMood').textContent = meta[lastMood.value] || '-';
    }
  }

  // Info khusus guru
  if (currentUser.role === 'guru') {
    if (el('guruInfo')) el('guruInfo').style.display = 'block';
    if (el('profilNip'))         el('profilNip').textContent         = currentUser.nip          || '-';
    if (el('profilSpesialisasi')) el('profilSpesialisasi').textContent = currentUser.spesialisasi || '-';
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
