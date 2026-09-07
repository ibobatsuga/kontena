# Kontena di Cloudflare milik sendiri

Aplikasi berjalan sebagai Cloudflare Worker `kontena` di akun `ibobatsuga`, memakai D1 `kontena-db` dan KV untuk gambar. R2 dapat diaktifkan dan ditambahkan melalui binding `MEDIA` setelah tersedia.

## Penggunaan

Buka https://kontena.nalarasa.workers.dev untuk langsung masuk ke dashboard tanpa halaman login atau password. Konten, pengaturan dan koneksi akun dipisahkan per browser. Gunakan browser yang sama untuk melanjutkan workspace; menghapus cookie atau membuka browser lain membuat workspace baru. Sesi pemilik yang masih valid dari versi sebelumnya tetap membawa data lama.

Menu: Dashboard, Buat Konten, Konten Saya, Template, Scheduler, Kalender, Akun Sosial, Pengaturan. Template hanya menampilkan layout, tanpa foto/logo asli referensi. Rasio konten: 4:5, 9:16 dan 1:1.

Scheduler dan auto post digabung. Kalender menampilkan Scheduled, Success dan Failed serta memungkinkan edit waktu, akun, caption dan gambar. Jadwal yang sedang diproses atau sudah terbit dikunci. Perubahan di editor tidak mengubah postingan yang sudah terbit di platform.

## Instalasi lokal

```sh
npm ci
npm run setup:local
npm run dev
```

Buka http://localhost:3000 langsung tanpa login. Data lokal dan `.env` tidak boleh diunggah ke GitHub.

## Deployment

```sh
npx wrangler login
npm run db:migrate
npm run deploy
```

Akun, ID database dan namespace ada di `wrangler.jsonc`. Rahasia produksi: `SESSION_SECRET`, `SOCIAL_ENCRYPTION_KEY`, `CRON_SECRET`. SESSION_SECRET menandatangani cookie workspace otomatis. Mengganti kunci ini membatalkan akses cookie workspace yang lama. Jangan mengganti kunci enkripsi tanpa memigrasi atau menghubungkan ulang akun sosial.

Worker memiliki cron setiap menit; scheduler tidak bergantung pada browser terbuka. Instagram menerima tautan gambar bertanda tangan yang kedaluwarsa setelah 24 jam. KV adalah penyimpanan sementara sebelum R2 tersedia: gambar baru mungkin memerlukan waktu untuk tersebar antar wilayah. Data dari deployment Sites sebelumnya tidak otomatis dipindahkan.

## Layanan yang masih perlu dihubungkan

- AI: isi AI_GATEWAY_URL dan AI_GATEWAY_KEY, lalu pilih model melalui adapter backend. Tanpa ini, demo tetap menggunakan contoh tetap.
- Meta: Akun Sosial → Pengaturan integrasi. Isi App ID/Secret dan tambahkan redirect URI yang ditampilkan ke Meta App. Izin serta App Review disesuaikan dengan pemakaian. Hubungkan akun melalui login resmi Meta.
- Instagram Business/Creator harus terhubung dengan Facebook Page. Integrasi mendukung feed/carousel 4:5 atau 1:1, maksimal 10 slide; auto post Story 9:16 belum tersedia.

```sh
npm test
npx tsc --noEmit
npm run build
```

Tes publisher memakai respons tiruan dan tidak mengirim postingan ke akun nyata.
