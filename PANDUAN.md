# Kontena — Panduan menjalankan aplikasi

Aplikasi desktop-first responsif untuk membuat konten sosial media, dengan studio AI, tujuh preset layout, pustaka konten, Scheduler, Kalender, dan koneksi akun sosial.

## Mulai di komputer sendiri

1. Pasang Node.js versi 22.13 atau lebih baru.
2. Ekstrak ZIP, lalu buka Terminal di folder `kontena`.
3. Jalankan:

```sh
npm ci
npm run setup:local
npm run dev
```

4. Buka **http://localhost:3000/signin-with-chatgpt?return_to=/**. Pada komputer lokal, tautan ini memakai identitas pengembangan bawaan, bukan login ke akun sosial.

`setup:local` membuat database lokal dari migrasi dan kunci enkripsi lokal di `.env`. Simpan `.env` dengan aman. Jangan memasukkannya ke Git atau mengirimkannya kepada orang lain. Data aplikasi lokal tersimpan di `.wrangler/`; data dari website yang sudah dipublikasikan tidak ikut dalam ZIP.

## Fitur yang tersedia

- Studio konten dengan rasio **4:5, 9:16, dan 1:1**, pengaturan slide/carousel, topik, niche, visual, font, overlay, caption dan CTA.
- Edit teks serta prompt gambar, unggah gambar, simpan konten, unduh PNG dan ZIP slide.
- Tujuh preset berupa **layout saja**, tanpa foto atau logo asli dari referensi.
- **Scheduler:** jadwal baru, kesiapan publikasi otomatis, dan aktivitas auto post.
- **Kalender:** filter Scheduled, Success, Failed, Diproses, Dibatalkan; edit waktu, akun, caption, serta perbarui gambar dari konten terbaru. Jadwal yang sudah berhasil terbit atau sedang diproses bersifat hanya baca.
- **Akun Sosial:** login Meta untuk menghubungkan Facebook Page dan Instagram Business/Creator yang terhubung ke Page, memeriksa koneksi, dan memutus akun.

## Aktivasi layanan nyata

**AI:** model belum ditentukan. Mode demo menggunakan contoh tetap yang diberi label demo. Untuk generasi berdasarkan prompt, hubungkan adapter backend melalui `AI_GATEWAY_URL` dan `AI_GATEWAY_KEY`. Kontrak request/response ada di `README.md`.

**Akun sosial:** buat dan konfigurasi Meta App, lalu masukkan App ID dan App Secret lewat **Akun Sosial → Pengaturan integrasi**. Daftarkan OAuth Redirect URI yang ditampilkan. Lengkapi izin dan App Review sesuai kebutuhan aplikasi. Login akun serta persetujuan izin dilakukan sendiri oleh pengguna. Kredensial akun nyata tidak disertakan.

**Auto post:** perlu runner backend yang memanggil `/api/dispatch`, `CRON_SECRET`, dan `SCHEDULER_ENABLED=true`. Instagram juga memerlukan layanan gambar publik sementara (`MEDIA_STAGING_URL` dan `MEDIA_STAGING_KEY`) agar Meta bisa mengakses gambar dari aplikasi privat. Lihat kontrak lengkap di README. Runner dan layanan staging belum disediakan/diaktifkan. Mode live dibatasi sampai prasyarat tersedia; jadwal demo tidak mengirim postingan.

Untuk Instagram, integrasi ini mendukung feed/carousel 4:5 atau 1:1, maksimal 10 slide, dan caption 2.200 karakter. Auto post Story 9:16 belum tersedia. Facebook personal dan Instagram personal tidak didukung.

## Verifikasi dan build

```sh
npm test
npx tsc --noEmit
npm run build
```

Uji publisher memakai respons Meta tiruan dan tidak mengirim postingan. Alur akun nyata belum diuji tanpa Meta App/akun yang dikonfigurasi.

## Hosting dan struktur

Frontend React/TypeScript berjalan di Vinext; backend memakai Cloudflare Worker, D1, dan R2. Proyek ini bukan HTML statis dan tidak dapat dijalankan dengan sekadar membuka file HTML. Konfigurasi `.openai/hosting.json` menunjuk ke Site Kontena yang dibuat dalam sesi ini. Jangan mengubah akses Site menjadi publik atau membagikannya sebagai aplikasi multi-pengguna sebelum melengkapi isolasi data proyek, aset, dan pengaturan. Untuk memindahkan ke hosting lain, developer perlu menyesuaikan binding serta autentikasi backend.

- `app/`: halaman dan API backend.
- `components/`: studio, kalender, akun sosial, dan UI.
- `lib/`: renderer, model, enkripsi, dan publisher.
- `db/` dan `drizzle/`: skema serta migrasi database.
- `public/`: aset aplikasi.
- `.env.example`: daftar konfigurasi tanpa nilai rahasia.

ZIP berisi source code, lockfile, aset, migrasi, tes, dan panduan. Tidak memuat `node_modules`, `.env`, token akun, database pengguna, cache, atau riwayat Git.
