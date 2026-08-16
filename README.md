# BK Sahabat — Prototipe Website Bimbingan Konseling

Website statis (HTML, CSS, JavaScript murni — tanpa framework/build tool) untuk platform BK sekolah, dibuat berdasarkan brief: edukasi BK, mood tracker harian, booking konsultasi, jurnal pribadi & surat kaleng anonim, pojok literasi mental, dan tombol darurat.

## Struktur folder

```
bk-website/
├── index.html        (Beranda: edukasi BK, topik bantuan, FAQ)
├── mood.html          (Mood tracker harian + riwayat 30 hari)
├── konsultasi.html    (Katalog Guru BK + form booking)
├── jurnal.html        (Buku harian rahasia + surat kaleng anonim)
├── literasi.html      (Artikel ringan + kuis gaya belajar)
├── css/style.css
├── js/main.js
└── README.md
```

## ⚠️ Batasan penting (baca sebelum dipakai di sekolah sungguhan)

Ini adalah **frontend murni** — tidak ada server/database. Semua data (mood, jurnal, surat kaleng, jadwal booking) disimpan dengan `localStorage`, artinya:

- Data **hanya tersimpan di browser masing-masing perangkat**, tidak sinkron antar perangkat, dan hilang kalau cache browser dibersihkan.
- **"Surat Kaleng" belum benar-benar terkirim ke Guru BK** — psikologis prosesnya adalah menyimpan datanya secara lokal saja di HP/laptop siswa itu sendiri. Guru BK tidak menerima notifikasi apa pun.
- Login siswa/dashboard Guru BK sungguhan **belum ada** di versi ini.
- Notifikasi WhatsApp/Email otomatis **belum ada** (butuh backend + API pihak ketiga).

Karena data curhat siswa itu sensitif, **jangan gunakan versi ini untuk menyimpan curhatan siswa sungguhan** sampai ditambahkan backend yang aman (server + database dengan autentikasi & enkripsi, bukan disimpan di repo GitHub publik). Anggap versi ini sebagai **prototipe/demo tampilan & alur (UI/UX)** untuk didiskusikan dengan pihak sekolah, bukan produk jadi.

Untuk menjadikannya produk sungguhan, langkah selanjutnya biasanya:
1. Tambah backend (mis. Firebase, Supabase, atau server Node.js/Express + database) untuk menyimpan data dengan aman.
2. Tambah sistem login siswa (NISN) & login Guru BK yang terautentikasi.
3. Pindahkan repo/hosting ke tempat yang mendukung privasi data siswa (GitHub Pages publik **tidak cocok** untuk data sensitif sungguhan).

## Menjalankan di komputer (sebelum di-deploy)

Karena `js/main.js` memakai `localStorage` dan file dibuka lewat `http://`, sebaiknya jangan cuma double-click `index.html`. Gunakan **Live Server** di VS Code (lihat langkah di bawah) supaya semua fitur berjalan normal.

## Langkah Deploy ke GitHub Pages (pakai VS Code)

1. **Siapkan folder proyek**
   Ekstrak/salin folder `bk-website` ini ke komputer, lalu buka foldernya di VS Code (`File > Open Folder...`).

2. **Coba dulu secara lokal**
   Install ekstensi **Live Server** (oleh Ritwick Dey) dari tab Extensions VS Code. Klik kanan `index.html` → **Open with Live Server**. Situs akan terbuka di `http://127.0.0.1:5500` dan semua fitur (mood tracker, jurnal, dll) bisa dicoba.

3. **Buat repository di GitHub**
   Buka [github.com](https://github.com) → tombol **New repository** → beri nama (misal `bk-sahabat`) → pilih **Public** → **Create repository**. Jangan centang "Add a README" kalau sudah punya README sendiri.

4. **Push proyek dari VS Code ke GitHub**
   Buka **Terminal** di VS Code (`Terminal > New Terminal`), lalu jalankan perintah ini satu per satu di dalam folder `bk-website`:
   ```bash
   git init
   git add .
   git commit -m "Inisialisasi website BK Sahabat"
   git branch -M main
   git remote add origin https://github.com/USERNAME-KAMU/bk-sahabat.git
   git push -u origin main
   ```
   Ganti `USERNAME-KAMU/bk-sahabat` dengan alamat repo yang baru kamu buat di langkah 3 (bisa disalin dari tombol hijau **Code** di halaman GitHub repo-mu). Kalau diminta login, ikuti proses autentikasi GitHub di browser/VS Code.

   *Tips: kalau di VS Code sudah ada ikon "Source Control" (ikon cabang di sidebar kiri), kamu juga bisa klik ikon itu → **Publish Branch** sebagai alternatif dari perintah git manual di atas.*

5. **Aktifkan GitHub Pages**
   Di halaman repo GitHub → **Settings** → menu **Pages** (di sidebar kiri) → pada bagian **Build and deployment**, pilih **Source: Deploy from a branch** → pilih **Branch: main** dan folder **/ (root)** → **Save**.

6. **Tunggu 1–2 menit**, lalu refresh halaman Settings > Pages. Akan muncul link seperti:
   ```
   https://USERNAME-KAMU.github.io/bk-sahabat/
   ```
   Itulah alamat website BK Sahabat yang sudah live dan bisa dibuka siapa saja.

7. **Update website di kemudian hari**
   Setiap kali mengubah file di VS Code, jalankan lagi:
   ```bash
   git add .
   git commit -m "Deskripsi perubahan"
   git push
   ```
   GitHub Pages akan otomatis memperbarui situs dalam 1–2 menit.

## Mengganti hal-hal yang perlu disesuaikan sekolah

- **Kontak darurat sekolah**: cari `Kontak Darurat Sekolah` di tiap file `.html` (bagian modal tombol darurat) dan ganti `href="#"` serta teksnya dengan nomor/kontak Guru BK atau wali kelas sekolahmu.
- **Nama & data Guru BK**: edit bagian `#teacherCatalog` di `konsultasi.html` dan `<select id="bookingTeacher">` di form booking.
- **Warna & font**: semua ada di `css/style.css` bagian `:root` paling atas (variabel `--color-...` dan `--font-...`).
