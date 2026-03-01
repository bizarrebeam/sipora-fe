# README

## Identitas Mahasiswa

Nama  : Rizki Hidayatul Laeli  
Kelompok : B01  
Proyek : Propenat (C2H5COOH)

---

## Fitur yang Dikerjakan

Berikut adalah daftar fitur dan backlog (PBI) yang saya kerjakan berdasarkan Product Backlog Item (PBI) pada dokumen Propenat 2025/2026.

---

### 1. PBI-38 — Mengelola Jadwal Ketersediaan Guru BK

Backlog Title: Mengelola Jadwal Ketersediaan Guru BK  

Deskripsi Singkat:  
Fitur ini memungkinkan Guru BK untuk menambahkan, mengubah, dan menghapus jadwal ketersediaan konsultasi. Sistem melakukan validasi waktu serta mencegah bentrok jadwal agar slot yang tersedia valid dan dapat digunakan siswa untuk booking.

---

### 2. PBI-39 — Membuat Booking Jadwal Konsultasi BK

Backlog Title: Membuat Booking Jadwal Konsultasi BK  

Deskripsi Singkat:  
Fitur ini memungkinkan siswa melakukan booking berdasarkan slot yang tersedia. Siswa wajib mengisi alasan konsultasi sebelum mengirim permintaan. Status awal booking adalah *Menunggu Konfirmasi*.

---

### 3. PBI-40 — Mengonfirmasi Jadwal Booking

Backlog Title: Mengonfirmasi Jadwal Booking  

Deskripsi Singkat:  
Fitur ini memungkinkan Guru BK untuk menerima atau menolak permintaan booking. Hanya booking dengan status *Menunggu Konfirmasi* yang dapat diproses. Jika ditolak, Guru BK dapat memberikan alasan penolakan.

---

### 4. PBI-41 — Membatalkan Jadwal Booking Konsultasi

Backlog Title: Membatalkan Jadwal Booking Konsultasi  

Deskripsi Singkat:  
Fitur ini memungkinkan siswa membatalkan booking selama masih berstatus *Menunggu Konfirmasi*. Sistem akan memperbarui status menjadi *Dibatalkan* setelah konfirmasi pembatalan dilakukan.

---

### 5. PBI-42 — Reschedule Jadwal Booking Konsultasi

Backlog Title: Reschedule Jadwal Booking Konsultasi  

Deskripsi Singkat:  
Fitur ini memungkinkan siswa mengubah jadwal booking ke slot lain yang masih tersedia tanpa membuat booking baru. Perubahan hanya dapat dilakukan sebelum booking dikonfirmasi.

---

### 6. PBI-43 — Melihat Daftar Booking Konsultasi

Backlog Title: Melihat Daftar Booking Konsultasi  

Deskripsi Singkat:  
Fitur ini menampilkan daftar booking sesuai peran pengguna. Guru BK dapat melihat seluruh booking yang ditujukan kepadanya, sedangkan siswa hanya dapat melihat booking miliknya sendiri.

---

### 7. PBI-47 — Membuat artikel kesehatan mental

Backlog Title: Membuat artikel kesehatan mental

Deskripsi Singkat:  
Fitur membuat artikel kesehatan mental memungkinkan kemahasiswaan membuat sebuah artikel yang berkaitan dengan isu kesehatan mental bagi siswa-siswi SMP Budi Mulia Desa Putera

---

### 8. PBI-48 — Mengedit artikel kesehatan mental

Backlog Title: Mengedit artikel kesehatan mental 

Deskripsi Singkat:  
Fitur mengedit artikel kesehatan mental memungkinkan kemahasiswaan mengedit sebuah artikel yang berkaitan dengan isu kesehatan mental  yang telah disimpan dalam sistem sebelumnya

---

### 9. PBI-50 — Membaca artikel kesehatan mental

Backlog Title: Membaca artikel kesehatan mental

Deskripsi Singkat:  
Fitur membaca artikel kesehatan mental memungkinkan pelapor membaca sebuah artikel yang berkaitan dengan isu kesehatan mental

---

### 7. PBI-52 — Melihat daftar artikel yang dibuat

Backlog Title: Melihat daftar artikel yang dibuat

Deskripsi Singkat:  
Fitur melihat daftar artikel artikel kesehatan mental memungkinkan kemahasiswaan melihat daftar artikel yang berkaitan dengan isu kesehatan mentals

----------------------------------------

# sipora-fe

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
