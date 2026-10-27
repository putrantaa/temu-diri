# Temu Diri - Prototipe Website Bimbingan Konseling

Website statis (HTML, CSS, JavaScript murni - tanpa framework/build tool) untuk platform BK sekolah. Proyek ini merupakan pembaruan dan rebranding dari "BK Sahabat" menjadi **Temu Diri**, dengan tampilan visual bernuansa merah maroon dan emas yang hangat sesuai logo Temu Diri.

## Fitur Utama
1. **Sistem Role (Mock Auth):** Terdapat dua role pengguna (Siswa & Guru BK) dengan hak akses, navbar, dan halaman profil yang berbeda.
2. **Mood Tracker Harian:** Siswa wajib mengisi mood harian (disertai nama) setelah login, dengan sistem riwayat 30 hari.
3. **Booking Konsultasi:** Katalog Guru BK dan form booking interaktif (Siswa mengajukan, Guru BK menyetujui).
4. **Jurnal & Curhat:** Buku harian rahasia (opsi hapus otomatis 24 jam) yang privat untuk siswa.
5. **Dashboard Guru BK:** Panel admin khusus untuk memantau mood siswa secara keseluruhan dan menyetujui jadwal konsultasi.
6. **Tombol Darurat (Crisis Button):** Akses cepat ke kontak bantuan krisis dari halaman mana saja.

## Struktur Folder

```text
bk-website/
├── index.html           (Beranda: edukasi BK, penjelasan fitur utama, FAQ)
├── login.html           (Halaman masuk untuk Siswa & Guru)
├── profil.html          (Profil pengguna dinamis & statistik)
├── dashboard-guru.html  (Panel admin khusus Guru BK)
├── mood.html            (Mood tracker harian & riwayat)
├── konsultasi.html      (Katalog Guru BK + form pengajuan booking)
├── jurnal.html          (Buku harian rahasia)
├── literasi.html        (Artikel literasi mental + kuis gaya belajar)
├── image/Temu-Diri.jpeg (Logo resmi Temu Diri)
├── css/style.css
├── js/main.js
└── README.md
```

## ⚠️ Batasan Penting (Prototipe Frontend)

Ini adalah **prototipe frontend murni** - tidak menggunakan *server* atau *database* online. Semua data disimpan secara lokal menggunakan `localStorage` di memori browser. 

- **Data tidak tersinkronisasi antar perangkat.** Data yang dimasukkan siswa di laptop/HP mereka **tidak** akan muncul di laptop Guru BK sungguhan.
- **Cara Menguji Fitur (Demo):** Agar Guru BK bisa merespons data dari siswa (menyetujui booking atau memantau mood), pengujian **wajib dilakukan di satu browser yang sama**. 
  *(Alur pengujian: Login sebagai Siswa -> ajukan konsultasi/isi mood -> Logout -> Login sebagai Guru BK -> cek Dashboard).*
- **Data Login Default:**
  - **Siswa:** Username: `siswa01` | Password: `siswa123`
  - **Guru BK:** Username: `gurubk` | Password: `bk2024`

Untuk menjadikannya produk sungguhan yang dipakai resmi oleh sekolah, kode *frontend* ini perlu disambungkan ke *backend/database* (seperti Firebase, Supabase, MySQL, dll).

## Menjalankan secara Lokal di Komputer

Karena `js/main.js` mengandalkan `localStorage` dan pengelolaan halaman berbasis rute sederhana, jangan hanya klik ganda (double-click) file `index.html`. Sangat disarankan untuk menjalankannya menggunakan ekstensi **Live Server** di VS Code agar seluruh fitur berfungsi tanpa terblokir oleh keamanan browser.

## Penyesuaian untuk Sekolah

- **Kontak Darurat:** Cari elemen dengan kelas `.crisis-contact` di file HTML (pada bagian *modal* darurat) dan ubah nomornya ke nomor Hotline atau Guru BK sekolahmu.
- **Data Simulasi Pengguna:** Edit variabel `BK_USERS` di bagian atas file `js/main.js` untuk mengganti detail nama, NISN/NIP, kelas, dan avatar bawaan.
- **Katalog Guru BK:** Sesuaikan data dan keahlian guru pada bagian `#teacherCatalog` di file `konsultasi.html`.
- **Warna Dasar:** Semua variabel warna utama sekarang dipusatkan di `css/style.css` pada blok `:root` (bernuansa merah maroon pada `--color-coral` dan emas pada `--color-gold` / `--color-teal`).
