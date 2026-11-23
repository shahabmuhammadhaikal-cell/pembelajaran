# Pembelajar EN ↔ AR

Aplikasi belajar kosakata **Inggris · العربية · Indonesia** — dibangun ulang dengan **React (Vite)** di frontend dan **Node.js (Express)** di backend, siap di-deploy ke **GitHub Pages** (frontend) dan **Render** (backend) dengan **Firebase Firestore** sebagai database.

> v2.0 · Frontend React + Backend Express + Firestore. Versi statis lama (app.js) masih bisa dipakai fallback.

---

## Struktur proyek

```
├── client/                    # Frontend React (Vite)
│   ├── src/
│   │   ├── components/        # Header, Tabs, Modal, Toast, Footer, Icons
│   │   ├── views/             # Dashboard, Cards, Quiz, Phrases, Translate, Settings, Suggestions
│   │   ├── hooks/             # useStudyItems
│   │   ├── lib/               # api, language, srs, speech, storage
│   │   ├── state/             # AppContext (reducer + provider)
│   │   └── styles/            # tokens.css + app.css (tema gelap/terang)
│   ├── scripts/copy-data.mjs  # salin dataset statis ke public/data
│   └── dist/                  # hasil build (deploy ke GitHub Pages)
├── server/                    # Backend Express
│   ├── index.js               # HTTP + semua route API
│   ├── db/                    # pabrik store: firestore.js | local.js (JSON fallback)
│   ├── lib/lexicon.js         # lexicon kompak server-side (cache)
│   └── scripts/seed-firestore.js
├── assets/data/               # dataset statis (87 kategori, ±12.000 entri)
├── render.yaml                # blueprint deploy Render
└── .github/workflows/deploy-pages.yml
```

## Fitur

- **Dasbor** — ring progres harian, streak, rekor, statistik belajar, kategori paling sulit, daftar kesalahan 24 jam.
- **Kartu** — flashcard 3D balik, audio EN/AR/ID (Web Speech + fallback TTS server), favorit, filter (Semua/Favorit/Sulit/Baru/Kuat), badge SRS.
- **Kuis** — 10 soal per sesi, timer lingkaran (bisa dimatikan), pemilihan soal berbobot SRS, ringkasan sesi, mode "ulangi kesalahan".
- **Frasa** — grid kartu EN/AR/ID dengan audio per baris dan paginasi.
- **Terjemah** — kamus lokal ±5.000 entri lewat API `/api/lexicon` (kompak, bukan 3MB), deteksi bahasa otomatis, tambah kata tak dikenal ke kamus lokal, riwayat, bantuan AI lewat Ollama atau endpoint OpenAI-compatible (diatur di **Pengaturan → Bantuan AI**).
- **Saran kata** — form + status, bisa dirapikan AI, admin bisa menandai selesai.
- **Sinkronisasi progres** — SRS/favorit/riwayat tersimpan di localStorage **dan** tersinkron ke backend (`progress/{deviceId}` di Firestore).
- Tampilan baru: tema gelap/terang/sistem, glassmorphism header, animasi halus, responsif penuh, pintasan papan ketik (`1–5`, `/`, spasi, ←→, S).

## Menjalankan lokal

```bash
# 1. Backend (mode JSON lokal, tanpa Firebase)
cd server
npm install
npm start            # http://localhost:8020

# 2. Frontend (terminal kedua)
cd client
npm install
npm run dev          # http://localhost:5173 (proxy API ke :8020)
```

Build produksi frontend only:

```bash
cd client && npm run build     # hasil di client/dist
```

Backend otomatis menyajikan `client/dist` bila ada — jadi satu service Render bisa menampung API + frontend sekaligus.

---

## Deploy

### 1. Frontend → GitHub Pages

Workflow [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) sudah ada: setiap push ke `main` mem-build `client/` dan men-deploy `client/dist` ke Pages. Aktifkan di **Settings → Pages → Source: GitHub Actions**.

Build production membaca alamat backend dari `VITE_API_BASE` di [client/.env.production](client/.env.production) (default `https://pembelajaran-api.onrender.com/`, ganti bila domain Render kamu berbeda):

```bash
VITE_API_BASE=https://pembelajaran-api.onrender.com/
```

`npm run dev` tidak membaca file itu, jadi saat development semua panggilan `/api`, `/tts`, dan `/ai` tetap lewat proxy same-origin di `vite.config.js`. Jalur alternatif (tanpa build ulang): isi `apiBase` di [client/public/app.config.js](client/public/app.config.js) atau lewat **Pengaturan → Server & API** di aplikasi (tersimpan per perangkat); nilai runtime itu menang atas `VITE_API_BASE`.

### 1b. Frontend → Firebase Hosting

[firebase.json](firebase.json) sudah menyajikan `client/dist`:

```bash
cd client && npm run build
firebase deploy --only hosting --project pembelajaran-90f14
```

Karena Hosting tidak mem-proxy `/api` ke server lain, build hosted wajib memakai `VITE_API_BASE` absolut di atas. Tambahkan juga domain hosting ke **Firebase Authentication → Settings → Authorized domains** (`pembelajaran-90f14.web.app` dan `pembelajaran-90f14.firebaseapp.com`) agar login Google bekerja.

> Mode fallback: bila `app.config.js` tidak diisi, aplikasi tetap jalan memakai `client/public/data` (dataset statis) + localStorage — hanya fitur server yang mati.

### 2. Backend → Render

1. Push repo ke GitHub.
2. Di Render: **New → Blueprint**, pilih repo — [render.yaml](render.yaml) otomatis membuat service `pembelajaran-api`.
3. Isi environment variables:
   - `FIREBASE_SERVICE_ACCOUNT` — **isi file service account JSON Firebase** (satu baris, tanpa enter). Render → Environment → Add.
   - `API_BASE_URL` — URL publik service (mis. `https://pembelajaran-api.onrender.com/`)
   - `CORS_ORIGINS` — URL Pages kamu (mis. `https://username.github.io`), koma bila lebih dari satu
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` — untuk login admin (upload, status saran)
   - `AI_BASE_URL` / `AI_MODEL` / `AI_API_KEY` — opsional, untuk fitur AI (lihat bagian berikut)
   - `AUTO_SEED` — opsional, set `0` untuk mematikan pengisian Firestore otomatis saat katalog kosong

Health check: `GET /api/health` — balik `{"ok":true,"storage":"firestore|json"}` plus `store.contentSource` dan `store.catalogSeeded`. Sesudah deploy pertama, cek keduanya seperti dijelaskan pada [3. Firebase Firestore](#3-firebase-firestore-database-sementara).

### 2a. Bantuan AI (Ollama atau OpenAI-compatible)

Fitur "Bantu AI" di tab Terjemah dan "Rapikan dengan AI" di Saran Kata memakai
satu lapisan AI di backend. Ada dua cara menyambungkannya:

**Ollama (lokal/privat, default).** Jalankan server Ollama, lalu isi di `server/.env`:

```bash
ollama pull qwen2.5:3b
ollama serve                     # http://127.0.0.1:11434
AI_BASE_URL=http://127.0.0.1:11434
AI_MODEL=qwen2.5:3b
```

Di aplikasi, buka **Pengaturan → Bantuan AI**, isi `http://127.0.0.1:11434`,
klik **Uji koneksi** (daftar model terpasang muncul dan bisa dipilih), lalu
**Simpan & uji**. Alamat ini tersimpan per perangkat.

**Ollama Cloud (gratis, tanpa instalasi).** Ollama menyediakan akses cloud langsung
di `https://ollama.com/v1` (protokol OpenAI-compatible) memakai API key dari
[ollama.com/settings/keys](https://ollama.com/settings/keys). Paket Free berisi
kredit awal dan akses model starter; model cloud belum mendukung structured
output, dan klien ini otomatis mengirim permintaan JSON tanpa `response_format`
untuk `ollama.com` (plus fallback bila endpoint menolaknya). Isi di server:

```bash
AI_PROVIDER=openai
AI_BASE_URL=https://ollama.com/v1
AI_MODEL=model-yang-tersedia-di-akun-anda
AI_API_KEY=api-key-dari-ollama        # rahasia, hanya di server
```

Model yang bisa dipakai bergantung pada paket akun, jadi jangan menebak nama
model: di **Pengaturan → Bantuan AI** klik **Ollama Cloud**, biarkan kolom model
kosong, lalu **Uji koneksi** — model pertama yang terdeteksi diisi otomatis dan
bisa diganti dari daftar. URL tersimpan di perangkat, kunci tetap di server.

**Endpoint OpenAI-compatible lain (untuk server hosted seperti Render).** Render tidak
bisa menjangkau Ollama di komputer Anda, jadi pakai endpoint yang kompatibel
OpenAI — Ollama Cloud, OpenLLM, OpenAI, Groq, LM Studio, llama.cpp. Isi URL
berakhiran `/v1` dan simpan kuncinya hanya di server:

```bash
AI_PROVIDER=openai
AI_BASE_URL=https://.../v1
AI_MODEL=nama-model
AI_API_KEY=isi-dari-dashboard-penyedia   # rahasia, jangan di-commit
```

Kunci API tidak pernah dikirim ke browser; halaman Pengaturan hanya menyimpan
URL dan nama model. Isi `AI_API_KEY` lewat Render → Environment (atau secret
manager host) setelah deploy pertama. `GET /ai/status` menampilkan status,
provider yang terdeteksi, dan daftar model tanpa membocorkan kunci.

**Frontend ikut di server Render (satu URL).** [render.yaml](render.yaml) memakai build command
`npm install && cd ../client && npm ci && npm run build`, lalu Express menyajikan `client/dist`,
jadi `https://pembelajaran-api.onrender.com/` langsung membuka aplikasi dan semua panggilan
`/api`, `/tts`, `/ai` tetap same-origin. Kalau service dibuat manual (bukan Blueprint), set
**Build Command** di Render → Settings persis seperti di atas, lalu **Manual Deploy**; tanpa itu
halaman root akan 404 "Frontend belum di-build".

Build React di Render memakai `client/.env.production` (`VITE_API_BASE` absolut). Untuk pemakaian
same-origin, kosongkan nilai itu (`VITE_API_BASE=`) agar aplikasi memanggil backend dari origin
halaman, dan tetap isi `apiBase`/Authorized domains hanya bila memakai Hosting/Pages terpisah.

### 2b. Backend di host container gratis

[Dockerfile](Dockerfile) di root membangun React + Express dalam satu image (port `8080`), jadi
cocok untuk host gratis berbasis container:

```bash
docker build -t pembelajaran .
docker run -p 8080:8080 -e STORAGE=firestore -e FIREBASE_SERVICE_ACCOUNT='{...}' pembelajaran
```

Langkah di host (contoh **Northflank Sandbox** — gratis, 2 service selalu aktif tanpa tidur):

1. New Service → Dockerfile → repo ini, konteks build root, Dockerfile `Dockerfile`.
2. Port publik `8080` (HTTP), health check `/api/health`.
3. Tambahkan env yang sama seperti Render: `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_WEB_API_KEY`,
   `GOOGLE_OAUTH_CLIENT_ID`, `STORAGE=firestore`, `CORS_ORIGINS`.
4. Deploy; host memberi domain HTTPS. Masukkan domain itu ke Firebase Authentication →
   Authorized domains bila ingin login Google.

Alternatif lain: Render free (tidur setelah 15 menit idle, tanpa kartu), Koyeb/Railway (butuh
kartu), Zeabur. Untuk penyimpanan: `STORAGE=json` menulis ke disk container yang hilang saat
restart, jadi di host gratis pakai Firestore.

### 3. Firebase Firestore (database sementara)

Backend memakai Firestore bila kredensial ada, otomatis fallback ke JSON lokal bila tidak.

1. Firebase Console → buat project → **Firestore Database** (mode Native).
2. **Project settings → Service accounts → Generate new private key** → salin isi JSON-nya ke env `FIREBASE_SERVICE_ACCOUNT` di Render.
3. Biarkan server menyinkronkan materi sendiri. Saat start, server membandingkan sidik jari `assets/data` dengan `meta/seedState.localFingerprint` di Firestore, lalu menulis katalog, entri, dan saran kata memakai `FIREBASE_SERVICE_ACCOUNT` yang sudah ada. Log startup menampilkan `[store] materi tersinkron ke Firestore: 91 kategori, 12415 entri`. Bila data lokal tidak berubah, tidak ada penulisan ulang — jadi aman untuk setiap deploy. Set `AUTO_SEED=0` untuk mematikan seluruh penulisan otomatis.

   Kategori yang datanya pernah diubah manual lewat import admin dicatat di `meta/seedState.manualCategories` dan **tidak** ditimpa data bawaan saat sinkronisasi berikutnya. Untuk memaksa sinkronisasi pada server yang sedang berjalan (tanpa redeploy):

   ```bash
   curl -X POST https://pembelajaran-api.onrender.com/admin/sync-content \
     -H "x-admin-token: <token hasil /admin/login>"
   ```

Seed manual tetap tersedia (opsional — untuk verifikasi atau memaksa ulang dari mesin yang punya kredensial):

```bash
cd server
FIREBASE_SERVICE_ACCOUNT='{...json...}' node scripts/seed-firestore.js --dry-run   # lihat ringkasan
FIREBASE_SERVICE_ACCOUNT='{...json...}' node scripts/seed-firestore.js             # tulis
```

4. Deploy/restart service, lalu pastikan materi terbaca dari Firestore:

```bash
curl -s https://pembelajaran-api.onrender.com/api/health
```

Yang perlu dilihat di respons:

| Field | Nilai | Arti |
|---|---|---|
| `storage` | `firestore` | kredensial Firebase terbaca |
| `store.contentSource` | `firestore` | katalog dan entri dari Firestore (normal) |
| `store.contentSource` | `assets-json` | Firestore terhubung tetapi katalog kosong — jalankan seed lalu restart |
| `store.catalogSeeded` | `true` / `false` | ringkas dari `contentSource`; hanya muncul saat Firestore aktif |
| `store.seededNow` | `true` | hanya muncul pada boot yang baru saja menulis materi ke Firestore |
| `store.localFingerprint` | hash | sidik jari `assets/data` yang terakhir disinkronkan |
| `store.manualCategories` | array | kategori yang isinya diubah manual dan dipertahankan saat sinkronisasi |
| `store.entryCount` | angka | total entri yang tercatat di `meta/catalog` |
| `store.lastSyncAt` | timestamp | hanya ada setelah sinkronisasi manual lewat `/admin/sync-content` |
| `store.warning` | teks | hanya ada saat fallback aktif; berisi perintah seed |

Skema Firestore:

| Collection | Isi |
|---|---|
| `categories/{id}` | `{ id, name, count, order, manual? }` |
| `entries/{cat}__{n}` | `{ category, index, items: [...] }` (chunk < 1MB) |
| `meta/catalog` | ringkasan kategori untuk respon cepat + `sourceFingerprint` |
| `meta/seedState` | status sinkronisasi: `localFingerprint`, `manualCategories`, `status` |
| `word_suggestions/{id}` | saran kata |
| `progress/{deviceId}` | `{ payload, updated_at }` — progres belajar per perangkat |

> **Deploy baru tampil kosong?** Cek `/api/health` lebih dulu, jangan menebak dari tampilan. Bila `storage` = `firestore` tetapi `store.contentSource` = `assets-json` (dan `store.catalogSeeded` = `false`), kredensial sudah benar tetapi katalog Firestore belum di-seed: aplikasi sengaja memakai `assets/data` agar tidak blank, sementara akun, progres, dan saran kata tetap disimpan di Firestore. Log startup juga menulis `store_ready: kind=firestore content=assets-json` beserta peringatan berisi perintah seed. Deploy/restart dengan build terbaru: sinkronisasi startup mengisi Firestore dari `assets/data`, dan `/api/health` berubah menjadi `store.contentSource: "firestore"` + `store.catalogSeeded: true` (boot yang menulis juga menampilkan `store.seededNow: true`). Bila sinkronisasi gagal, log server menyebut alasannya (kredensial/izin tulis) dan aplikasi sementara memakai `assets/data`.
>
> Tanpa kredensial Firebase sama sekali (`storage` = `json`), backend memakai JSON lokal dan tetap menyajikan seluruh kategori.

## API

| Endpoint | Ket |
|---|---|
| `GET /api/health` | status + storage aktif + statistik lexicon |
| `GET /api/catalog` | daftar kategori + jumlah entri per kategori |
| `GET /api/entries/:categoryId` | entri satu kategori |
| `GET /api/entries` | seluruh entri |
| `GET /api/lexicon` | lexicon kompak (EN/AR/ID) untuk fitur Terjemah |
| `GET·PUT /api/progress/:deviceId` | baca/simpan progres belajar |
| `GET /tts?lang&text` | audio TTS (rate-limited) |
| `GET·POST /word-suggestions` | baca/kirim saran kata |
| `POST /word-suggestions-status` | ubah status (admin) |
| `GET /ai/status` | status koneksi AI + daftar model |
| `POST /ai/translate`, `/ai/word-suggestion-draft` | bantuan AI (Ollama / OpenAI-compatible) |
| `POST /admin/login·logout·session` | sesi admin |
| `POST /upload`, `/import-animals`, `/import-vegetables` | admin — data hasil import langsung disimpan ke store aktif (Firestore) |
| `POST /admin/sync-content` | admin — sinkronkan ulang katalog/entri dari `assets/data` |

## Catatan

- Data belajar (SRS, favorit, riwayat) milik perangkat: localStorage dulu, sinkron ke Firestore pas ada jaringan.
- `client/public/data` dibuat otomatis oleh `scripts/copy-data.mjs` (jangan edit manual; sudah di-gitignore).
- `scripts/*.py` di root adalah script generator dataset (sudah terpakai) — boleh dihapus kalau dataset tidak lagi dikembangkan.
- Path `/assets/*` tetap dilayani backend (folder `assets/`, termasuk `user-images/` hasil upload admin).
