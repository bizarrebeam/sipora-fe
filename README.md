# SIPORA Frontend

Proyek ini adalah bagian Frontend dari Sistem Informasi Portal Akademik (SIPORA), yang dibangun menggunakan kerangka kerja antarmuka **Vue.js** dengan bantuan *build tool* modern, **Vite**, serta fitur keamanan *type-safe* **TypeScript**.

## 📂 Struktur Direktori

Berikut penjelasan singkat mengenai folder dan file yang terdapat dalam repositori `sipora-fe`:

- **`package.json`**: Jantung utama proyek NPM Node.js. Mendefinisikan metadata, *script* terminal (seperti `npm run dev`), dan daftar librari eksternal (*Dependencies/DevDependencies*) yang akan di-*download* dari internet.
- **`vite.config.ts`**: Pengaturan untuk modul *bundler* Vite.
- **`tailwind.config.js`**: Tempat konfigurasi utilitas *styling* Tailwind CSS yang mengatur desain antarmuka, tata letak visual, dsb.
- **`tsconfig.json`**: Kumpulan pengaturan kompilasi untuk *compiler* TypeScript.
- **`index.html`**: Halaman/file masuknya aplikasi *Single Page Application* (SPA) Vue ke peramban (browser). Di dalamnyalah ID root `#app` *mount* di-inisiasi.
- **`src/`**: Direktori akar sentral (*root directory*) source code utama FE, mencakup:
  - **`assets/`**: Penyimpanan objek tidak te-transformasi, file gambar statik, konfigurasi CSS global, atau _font_.
  - **`components/`**: Komponen dasar (*building block*) Vue yang ringkas dan re-usable (contoh: Tombol, Form, *Alert Message*).
  - **`router/`**: Tempat definisi perutean halaman (Vue Router), memastikan tiap rute/URL memanggil komponen *views* yang mana.
  - **`views/`**: Tempat kumpulan komponen perhalaman utuh. Biasanya terdiri dari struktur tata letak yang menampilkan gabungan banyak *components*.
  - **`stores/`**: Menggunakan Pinia sebagai sistem manajemen *state global* Vue. `auth.ts` bisa kita temui untuk mengatur *logic* *session token* autentikasi *login/logout*.
  - **`services/`**: Wadah pemanggilan fungsionalitas sisi luar. Di `api.ts` ini Axios difokuskan mengambil atau mem-POST *request* dan data menuju API Backend.

---

## 🚀 Panduan Instalasi (Development)

Untuk menyalakan *server frontend* lokal melalui laptop Anda, penuhi tahapan di bawah ini:

### 1. Prasyarat Sistem
Coba verifikasi apakah sistem operasi Anda memiliki **Node.js** terinstal beserta *package manager* bawaannya, **npm**. Semua file paket mengandalkan dependensi berbasis node.

### 2. Install Dependensi Node
Di dalam terminal (pastikan *path*-nya saat ini berada di root folder `sipora-fe`), mula-mula unduh seluruh *library* dan paket pendukung Node.js:
```bash
npm install
```

### 3. Setup Environment Variable
Supaya komunikasi aplikasi Frontend ini bisa berjalan mulus menjangkau Backend, ia membutuhkan konfigurasi **API URL Base**.
- Buat sebuah file bernama `.env` di dalam folder root `sipora-fe`.
- Isikan *endpoint* URL tempat backend berjalan:
  ```env
  VITE_API_URL=http://localhost:8000/api
  ```
  *(Sebagai catatan: Sesuaikan alamat ini jika port server backend Anda berbeda).*

### 4. Jalankan Server Dev!
Nyalakan aplikasi peramban versi *development* menggunakan Vite:
```bash
npm run dev
```

Server Vite lokal Anda biasanya akan instan menyala di `http://localhost:5173/` (perhatikan pesan konfirmasi port spesifiknya pada terminal). Cukup buka tautan URL tersebut di *browser* Anda untuk mulai berinteraksi dengan SIPORA Frontend.
