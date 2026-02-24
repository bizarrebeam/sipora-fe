## Fitur Theresia Tarianingsih 2306208810

### A. Mengelola Laporan Bullying

#### PBI-9 — Membuat Laporan (Role: **Siswa**) — Must Have
**Tujuan:** Siswa dapat membuat laporan bullying agar segera ditindaklanjuti.

**Backend (API Spec):**
- Endpoint: `POST /api/laporan-bullying`
- Payload menerima field:
    - `judul`
    - `deskripsi`
    - `lokasi`
    - `tanggal_kejadian`
    - `anonimitas` (boolean)
    - `foto_bukti_pendukung`
- Aturan:
    - Jika `anonimitas = true`, pengirim disimpan sebagai **"Pengguna Anonim"**.
    - Setelah berhasil terkirim, status laporan menjadi **"Menunggu Konfirmasi"**.
    - `id` laporan otomatis dibuat format **UUID**.
    - Hanya role **Siswa** yang dapat membuat laporan.
- Response:
    - `201 Created` jika berhasil.

**Frontend (UI Spec):**
- Halaman berisi field:
    - Judul, deskripsi, lokasi, tanggal kejadian, foto bukti pendukung.
- Tombol **"Kirim Laporan"** aktif jika seluruh mandatory field terisi.
- Jika sukses:
    - Menampilkan pesan sukses.
    - Redirect ke halaman detail laporan.

---

#### PBI-10 — Mengedit Laporan (Role: **Siswa**) — Must Have
**Tujuan:** Siswa dapat memperbaiki/melengkapi laporan sebelum diproses.

**Backend (API Spec):**
- Endpoint: `PUT /api/laporan-bullying/{id}`
- Aturan:
    - Hanya **pembuat laporan** yang bisa mengedit.
    - Tidak bisa mengedit jika status laporan **bukan** `"Menunggu konfirmasi"`.

**Frontend (UI Spec):**
- Halaman menampilkan field yang sudah tersimpan:
    - Judul, deskripsi, lokasi, tanggal kejadian, foto bukti pendukung.
- Tombol **"Ubah Laporan"** aktif jika seluruh mandatory field terisi.
- Jika sukses:
    - Pesan sukses.
    - Redirect ke halaman detail laporan.

---

#### PBI-11 — Membatalkan Laporan (Role: **Siswa**) — Should Have
**Tujuan:** Siswa dapat membatalkan laporan yang tidak relevan/salah.

**Backend (API Spec):**
- Endpoint: `PUT /api/laporan-bullying/{id}/cancel`
- Aturan:
    - Jika berhasil, status menjadi **"Dibatalkan"**.
    - Hanya **pembuat laporan** yang dapat cancel.
    - Hanya bisa dibatalkan jika status `"Menunggu Konfirmasi"`.

**Frontend (UI Spec):**
- Halaman menampilkan tombol **"Batalkan Laporan"**.
- Ada modal konfirmasi berisi:
    - Field alasan pembatalan.
    - Tombol **"Yakin, batalkan laporan"** dan **"Tidak yakin"**.
- Jika sukses:
    - Menampilkan pesan sukses.

---

#### PBI-12 — Melihat Daftar Laporan (Role: **Kemahasiswaan, Guru BK**) — Must Have
**Tujuan:** Kemahasiswaan/Guru BK dapat menindaklanjuti seluruh laporan.

**Backend (API Spec):**
- Endpoint: `GET /api/laporan-bullying`
- Akses:
    - Role **Kemahasiswaan & Guru BK** dapat melihat **semua laporan**.
- Fitur query:
    - Filter berdasarkan **keterbaharuan pengiriman** dan **status laporan**.

**Frontend (UI Spec):**
- Tabel daftar laporan berisi kolom:
    - Timestamp, judul laporan, tanggal kejadian, lokasi kejadian, status laporan, aksi.
- Aksi:
    - Tombol **"Lihat detail"**.
- Empty state:
    - Menampilkan **"Belum ada laporan bullying"**.
- Filter:
    - Berdasarkan status dan keterbaharuan laporan.

---

#### PBI-13 — Melihat Riwayat Laporan Pribadi (Role: **Siswa**) — Must Have
**Tujuan:** Siswa memantau laporan yang telah dikirim.

**Backend (API Spec):**
- Endpoint: `GET /api/laporan-bullying`
- Akses:
    - Siswa hanya melihat **laporan miliknya**.
- Fitur query:
    - Filter berdasarkan keterbaharuan pengiriman dan status laporan.

**Frontend (UI Spec):**
- Card riwayat laporan berisi:
    - Status, judul laporan, timestamp.
- Aksi:
    - **"Lihat detail"** (ke halaman PBI-14).
    - **"Tambahkan Laporan"** (ke halaman PBI-9).
- Empty state:
    - Menampilkan **"Belum ada laporan bullying"**.
- Filter:
    - Berdasarkan status dan keterbaharuan laporan.

---

#### PBI-14 — Melihat Detail Laporan (Role: **Siswa, Kemahasiswaan, Guru BK**) — Must Have
**Tujuan:** Pengguna melihat detail dan melacak status laporan.

**Backend (API Spec):**
- Endpoint: `GET /api/laporan-bullying/{id}`
- Akses:
    - Hanya **pelapor terkait**, **kemahasiswaan**, dan **guru BK**.

**Frontend (UI Spec):**
- Detail laporan menampilkan:
    - Nama pengirim, kelas pengirim, judul, deskripsi, lokasi, tanggal kejadian, anonimitas, foto bukti pendukung.
- Menampilkan:
    - Status dan riwayat perubahan.
    - Komentar/tanggapan dari kemahasiswaan atau guru BK.
- Tombol:
    - Untuk **Siswa**: **"Ubah Laporan"** (PBI-10) dan **"Batalkan Laporan"** (PBI-11).
    - Untuk **Kemahasiswaan & Guru BK**: **"Ubah Status Laporan"**.

---

## B. Mengelola Evaluasi Guru dan Staff

#### PBI-31 — Mengevaluasi Kinerja Staff & Guru (Role: **Siswa**) — Must Have
**Tujuan:** Siswa memberi umpan balik pembelajaran/pelayanan.

**Backend (API Spec):**
- Endpoint: `POST /api/evaluasi`
- Payload:
    - `staff_id`
    - `rating` (skala 1–5)
    - `komentar` / `feedback`
- Aturan:
    - Hanya role pelapor (Siswa) yang dapat mengirim evaluasi.
    - Validasi: 1 siswa hanya boleh memberikan 1 evaluasi per staff/guru dalam 1 periode penilaian.
- Response:
    - `201 Created` jika berhasil.

**Frontend (UI Spec):**
- Daftar guru/staff yang bisa dinilai.
- Komponen input rating numerik.
- Text area komentar/masukan.
- Tombol **"Kirim penilaian"**.
- Jika sukses:
    - Notifikasi **"Evaluasi berhasil dikirim"**.

Catatan: Tidak ada create/update pertanyaan EDOM.

---

#### PBI-32 — Melihat Daftar Hasil Evaluasi (Role: **Kemahasiswaan**) — Must Have
**Tujuan:** Kemahasiswaan memantau kualitas pengajaran/pelayanan.

**Backend (API Spec):**
- Endpoint: `GET /api/evaluasi/rekap`
- Akses:
    - Hanya role **Kemahasiswaan**.
- Perhitungan:
    - Rata-rata rating per Guru.
- Data yang dikembalikan:
    - Nama Guru, rata-rata rating, jumlah total responden.

**Frontend (UI Spec):**
- Menampilkan nilai performa keseluruhan tiap variabel penilaian.
- Filter nama Guru/staff.
- Menampilkan detail komentar siswa.

---

#### PBI-33 — Melihat Hasil Evaluasi Pribadi (Role: **Guru**) — Must Have
**Tujuan:** Guru melihat statistik evaluasi dirinya untuk peningkatan.

**Backend (API Spec):**
- Endpoint: `GET /api/evaluasi/rekap`
- Akses:
    - Hanya role **Guru** dan hanya untuk evaluasi dirinya sendiri.
- Perhitungan:
    - Rata-rata aspek penilaian untuk Guru terkait.
- Data:
    - Nama Guru, rata-rata rating, jumlah total responden.
- Privasi:
    - Tidak mengembalikan identitas siswa, hanya **kelas siswa**.
- Kondisi khusus:
    - Jika belum ada evaluasi: tetap `200 OK`.
    - Jika bukan role Guru: `403 Forbidden`.

**Frontend (UI Spec):**
- Statistik rata-rata hasil evaluasi bagi dirinya.
- Rekap komentar siswa yang masuk untuk dirinya.

---

## C. FAQ

#### PBI-40 — Melihat Tentang SIPORA (Role: **All Users**) — Must Have
**Tujuan:** Pengguna melihat informasi umum SIPORA dengan cepat.

**Backend/Route (Spec):**
- Route halaman FAQ dapat diakses **publik (tanpa token)** jika diperlukan oleh semua role.

**Frontend (UI Spec):**
- Menampilkan informasi umum mengenai platform SIPORA.
